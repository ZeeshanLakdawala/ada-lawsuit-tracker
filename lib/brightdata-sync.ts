import type { CasesRepository } from "@/lib/cases-repository";
import { ingestCases, type Classifier } from "@/lib/ingest";

export const DEFAULT_SYNC_START_PAGE = 2;
export const DEFAULT_SYNC_MAX_PAGE = 20;

type BrightDataConfig = {
  apiToken: string;
  collectorId: string;
};

export type BrightDataSyncResult = {
  pagesScanned: number;
  inserted: number;
  skipped: number;
  rejected: number;
  stoppedReason: "duplicate" | "empty_page" | "max_page";
  duplicateCaseNumber?: string;
};

export async function continueBrightDataSync(
  repository: CasesRepository,
  classifier?: Classifier,
  options: {
    startPage?: number;
    maxPage?: number;
    timeoutMs?: number;
    intervalMs?: number;
  } = {}
): Promise<BrightDataSyncResult> {
  const config = getBrightDataConfig();
  const startPage = options.startPage ?? DEFAULT_SYNC_START_PAGE;
  const maxPage = options.maxPage ?? Number(process.env.BRIGHTDATA_SYNC_MAX_PAGE ?? DEFAULT_SYNC_MAX_PAGE);
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const intervalMs = options.intervalMs ?? 10 * 1000;
  const result: BrightDataSyncResult = {
    pagesScanned: 0,
    inserted: 0,
    skipped: 0,
    rejected: 0,
    stoppedReason: "max_page"
  };

  for (let page = startPage; page <= maxPage; page += 1) {
    const trigger = await triggerBrightData({
      ...config,
      inputs: [buildCourtListenerInput(page)]
    });
    const collectionId = trigger.collection_id;

    if (!collectionId) {
      throw new Error("Bright Data did not return collection_id");
    }

    const dataset = await waitForBrightDataDataset({
      apiToken: config.apiToken,
      collectionId,
      timeoutMs,
      intervalMs
    });
    const pageResult = await ingestCases(dataset, repository, classifier, { stopOnDuplicate: true });

    result.pagesScanned += 1;
    result.inserted += pageResult.inserted;
    result.skipped += pageResult.skipped;
    result.rejected += pageResult.rejected;

    if (pageResult.processed === 0) {
      result.stoppedReason = "empty_page";
      return result;
    }

    if (pageResult.sawDuplicate) {
      result.stoppedReason = "duplicate";
      result.duplicateCaseNumber = pageResult.duplicateCaseNumber;
      return result;
    }
  }

  return result;
}

export function buildCourtListenerInput(page: number) {
  const url = new URL("https://www.courtlistener.com/");

  url.searchParams.set("q", "");
  url.searchParams.set("type", "r");
  url.searchParams.set("order_by", "dateFiled desc");
  url.searchParams.set("nature_of_suit", "446");
  url.searchParams.set("page", String(page));

  return { url: url.toString() };
}

function getBrightDataConfig(): BrightDataConfig {
  const apiToken = process.env.BRIGHTDATA_API_TOKEN?.trim();
  const collectorId = process.env.BRIGHTDATA_COLLECTOR_ID?.trim();

  if (!apiToken || !collectorId) {
    throw new Error("Bright Data env vars are missing");
  }

  return { apiToken, collectorId };
}

async function triggerBrightData({
  apiToken,
  collectorId,
  inputs
}: BrightDataConfig & { inputs: Array<{ url: string }> }) {
  const triggerUrl = new URL("https://api.brightdata.com/dca/trigger");
  triggerUrl.searchParams.set("collector", collectorId);
  triggerUrl.searchParams.set("queue_next", "1");

  const response = await fetch(triggerUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(inputs)
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Bright Data trigger failed with ${response.status}: ${text}`);
  }

  return JSON.parse(text) as { collection_id?: string };
}

async function waitForBrightDataDataset({
  apiToken,
  collectionId,
  timeoutMs,
  intervalMs
}: {
  apiToken: string;
  collectionId: string;
  timeoutMs: number;
  intervalMs: number;
}) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const dataset = await getBrightDataDataset({ apiToken, collectionId });

    if (Array.isArray(dataset)) {
      return dataset;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out waiting for Bright Data dataset ${collectionId}`);
}

async function getBrightDataDataset({ apiToken, collectionId }: { apiToken: string; collectionId: string }) {
  const datasetUrl = new URL("https://api.brightdata.com/dca/dataset");
  datasetUrl.searchParams.set("id", collectionId);

  const response = await fetch(datasetUrl, {
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Bright Data dataset failed with ${response.status}: ${text}`);
  }

  return JSON.parse(text) as unknown;
}
