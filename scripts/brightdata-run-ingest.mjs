import {
  DEFAULT_BRIGHTDATA_PAGES,
  DEFAULT_BRIGHTDATA_START_PAGE,
  buildCourtListenerInputs,
  countCases,
  getBrightDataConfig,
  getBrightDataDataset,
  triggerBrightData
} from "./brightdata-client.mjs";
import { readEnvFile } from "./env.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/u, "").split("=");
    return [key, value ?? "true"];
  })
);

const env = readEnvFile();
const { apiToken, collectorId } = getBrightDataConfig();
const startPage = Number(args.start ?? DEFAULT_BRIGHTDATA_START_PAGE);
const pages = Number(args.pages ?? DEFAULT_BRIGHTDATA_PAGES);
const ingestUrl = args.ingestUrl ?? env.INGEST_URL ?? "https://ada-lawsuit-tracker.vercel.app/api/ingest";
const timeoutMs = Number(args.timeoutMs ?? 10 * 60 * 1000);
const intervalMs = Number(args.intervalMs ?? 10 * 1000);

if (!Number.isInteger(startPage) || startPage < 1 || !Number.isInteger(pages) || pages < 1) {
  console.error(`Usage: pnpm brightdata:run-ingest -- --start=1 --pages=${DEFAULT_BRIGHTDATA_PAGES}`);
  process.exit(1);
}

const trigger = await triggerBrightData({
  apiToken,
  collectorId,
  inputs: buildCourtListenerInputs(startPage, pages)
});
const collectionId = trigger.collection_id;

if (!collectionId) {
  console.error(JSON.stringify({ ok: false, error: "Bright Data did not return collection_id", trigger }));
  process.exit(1);
}

console.log(
  JSON.stringify({
    step: "triggered",
    collectionId,
    startPage,
    pages,
    startEta: trigger.start_eta
  })
);

let dataset = null;
const startedAt = Date.now();

while (Date.now() - startedAt < timeoutMs) {
  const candidate = await getBrightDataDataset({ apiToken, collectionId });

  if (Array.isArray(candidate)) {
    dataset = candidate;
    break;
  }

  console.log(JSON.stringify({ step: "waiting", collectionId, response: candidate }));
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

if (!dataset) {
  console.error(JSON.stringify({ ok: false, error: "Timed out waiting for Bright Data dataset", collectionId }));
  process.exit(1);
}

const ingestResponse = await fetch(ingestUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(dataset)
});
const ingestText = await ingestResponse.text();

if (!ingestResponse.ok) {
  console.error(
    JSON.stringify({
      ok: false,
      step: "ingest",
      status: ingestResponse.status,
      response: ingestText
    })
  );
  process.exit(1);
}

console.log(
  JSON.stringify({
    ok: true,
    collectionId,
    pages,
    scrapedCaseCount: countCases(dataset),
    ingest: JSON.parse(ingestText)
  })
);
