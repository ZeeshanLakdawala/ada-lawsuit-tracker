import { readEnvFile } from "./env.mjs";

const env = readEnvFile();
const apiToken = env.BRIGHTDATA_API_TOKEN;
const collectorId = env.BRIGHTDATA_COLLECTOR_ID ?? "c_mt1pq36661zec4ol4";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/u, "").split("=");
    return [key, value ?? "true"];
  })
);

const startPage = Number(args.start ?? 1);
const pages = Number(args.pages ?? 10);

if (!apiToken) {
  console.error("Missing BRIGHTDATA_API_TOKEN in .env.local");
  process.exit(1);
}

if (!collectorId) {
  console.error("Missing BRIGHTDATA_COLLECTOR_ID in .env.local");
  process.exit(1);
}

if (!Number.isInteger(startPage) || startPage < 1 || !Number.isInteger(pages) || pages < 1) {
  console.error("Usage: pnpm brightdata:trigger -- --start=1 --pages=10");
  process.exit(1);
}

const inputs = Array.from({ length: pages }, (_, index) => {
  const page = startPage + index;
  const url = new URL("https://www.courtlistener.com/");

  url.searchParams.set("q", "");
  url.searchParams.set("type", "r");
  url.searchParams.set("order_by", "dateFiled desc");
  url.searchParams.set("nature_of_suit", "446");
  url.searchParams.set("page", String(page));

  return { url: url.toString() };
});

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
  console.error(
    JSON.stringify(
      {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        response: responseText
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      status: response.status,
      collectorId,
      startPage,
      pages,
      inputCount: inputs.length,
      response: responseText
    },
    null,
    2
  )
);
