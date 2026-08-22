import { readEnvFile } from "./env.mjs";

export const DEFAULT_BRIGHTDATA_START_PAGE = 1;
export const DEFAULT_BRIGHTDATA_PAGES = 20;

export function getBrightDataConfig() {
  const env = readEnvFile();
  const apiToken = env.BRIGHTDATA_API_TOKEN;
  const collectorId = env.BRIGHTDATA_COLLECTOR_ID ?? "c_mt1pq36661zec4ol4";

  if (!apiToken) {
    throw new Error("Missing BRIGHTDATA_API_TOKEN in .env.local");
  }

  if (!collectorId) {
    throw new Error("Missing BRIGHTDATA_COLLECTOR_ID in .env.local");
  }

  return { apiToken, collectorId };
}

export function buildCourtListenerInputs(startPage, pages) {
  return Array.from({ length: pages }, (_, index) => {
    const page = startPage + index;
    const url = new URL("https://www.courtlistener.com/");

    url.searchParams.set("q", "");
    url.searchParams.set("type", "r");
    url.searchParams.set("order_by", "dateFiled desc");
    url.searchParams.set("nature_of_suit", "446");
    url.searchParams.set("page", String(page));

    return { url: url.toString() };
  });
}

export async function triggerBrightData({ apiToken, collectorId, inputs }) {
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
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        response: responseText
      })
    );
  }

  return JSON.parse(responseText);
}

export async function getBrightDataDataset({ apiToken, collectionId }) {
  const datasetUrl = new URL("https://api.brightdata.com/dca/dataset");
  datasetUrl.searchParams.set("id", collectionId);

  const response = await fetch(datasetUrl, {
    headers: {
      Authorization: `Bearer ${apiToken}`
    }
  });
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        response: responseText
      })
    );
  }

  return JSON.parse(responseText);
}

export function countCases(dataset) {
  if (!Array.isArray(dataset)) {
    return 0;
  }

  return dataset.reduce((count, item) => {
    if (item && typeof item === "object" && Array.isArray(item.cases)) {
      return count + item.cases.length;
    }

    return count;
  }, 0);
}
