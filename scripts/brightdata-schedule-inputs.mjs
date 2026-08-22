import {
  DEFAULT_BRIGHTDATA_PAGES,
  DEFAULT_BRIGHTDATA_START_PAGE,
  buildCourtListenerInputs
} from "./brightdata-client.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/u, "").split("=");
    return [key, value ?? "true"];
  })
);

const startPage = Number(args.start ?? DEFAULT_BRIGHTDATA_START_PAGE);
const pages = Number(args.pages ?? DEFAULT_BRIGHTDATA_PAGES);

if (!Number.isInteger(startPage) || startPage < 1 || !Number.isInteger(pages) || pages < 1) {
  console.error(`Usage: pnpm brightdata:schedule-inputs -- --start=1 --pages=${DEFAULT_BRIGHTDATA_PAGES}`);
  process.exit(1);
}

console.log(JSON.stringify(buildCourtListenerInputs(startPage, pages), null, 2));
