import {
  DEFAULT_BRIGHTDATA_PAGES,
  DEFAULT_BRIGHTDATA_START_PAGE,
  buildCourtListenerInputs,
  getBrightDataConfig,
  triggerBrightData
} from "./brightdata-client.mjs";

const { apiToken, collectorId } = getBrightDataConfig();

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/u, "").split("=");
    return [key, value ?? "true"];
  })
);

const startPage = Number(args.start ?? DEFAULT_BRIGHTDATA_START_PAGE);
const pages = Number(args.pages ?? DEFAULT_BRIGHTDATA_PAGES);

if (!Number.isInteger(startPage) || startPage < 1 || !Number.isInteger(pages) || pages < 1) {
  console.error(`Usage: pnpm brightdata:trigger -- --start=1 --pages=${DEFAULT_BRIGHTDATA_PAGES}`);
  process.exit(1);
}

const inputs = buildCourtListenerInputs(startPage, pages);
const response = await triggerBrightData({ apiToken, collectorId, inputs });

console.log(
  JSON.stringify(
    {
      ok: true,
      status: response.status,
      collectorId,
      startPage,
      pages,
      inputCount: inputs.length,
      response
    },
    null,
    2
  )
);
