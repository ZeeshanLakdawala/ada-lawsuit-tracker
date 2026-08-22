# ADA Website Lawsuit Tracker

ADA Website Lawsuit Tracker is a public-facing tracker for federal lawsuits involving website accessibility. It collects filing data, classifies defendants by industry, stores records, and presents the result as a searchable table with filing metrics and docket patterns.

## Why this exists

Website accessibility lawsuits are filed across many federal districts, but the public record is spread across docket systems. A business, researcher, journalist, or accessibility practitioner needs one place to answer:

- How many filings are in the tracked docket?
- Which plaintiffs, districts, defendants, and industries appear most often?
- What changed in the last 7 or 30 days?
- What does a specific filing say, and where can the original docket be opened?

This project turns individual docket records into one working research view.

## The problem it solves

The tracker reduces the manual work between a public docket source and a usable research view. It handles collection, duplicate detection, field cleaning, industry classification, storage, filtering, pagination, and summary counts in one workflow.

It is a research and monitoring tool. It does not decide whether a claim is valid, predict the result of a case, or replace advice from a lawyer.

## Product overview

The app has two main views:

1. **Live tracker:** a 10-row filing table with live URL filters for industry and filing window, compact pagination, case links, filing metrics, ranked plaintiffs, federal districts, and industries.
2. **Case detail:** the filing name, date, district, case number, parties, filing facts, related cases, source link, and a short explanation of why the record appears in the tracker.

The source link points back to the underlying public filing record when one is available.

## Features

- Bright Data webhook ingestion for CourtListener / RECAP result payloads.
- Record validation and cleaning.
- Duplicate protection using the case number.
- Gemini-backed industry classification with a fixed set of supported industries.
- Supabase storage with indexes for filing date, district, and industry.
- Live filter updates for industry and filing window.
- Ten filings per table page with a compact range scrubber.
- Filing metrics for total records, year-to-date filings, recent filings, distinct defendants, distinct plaintiffs, active districts, and largest known settlement reference.
- Ranked views for plaintiffs, federal districts, and industries.
- Related filings grouped by federal district.
- Accessibility-themed favicon and accessible labels for key controls.
- Automated tests for cleaning, ingestion, classification, URL parameters, Bright Data sync, and the ingest API.

## How it works

```text
CourtListener / RECAP
        |
        v
Bright Data collector
        |
        v
POST /api/ingest
        |
        +--> parse and repair JSON
        +--> validate and clean each record
        +--> classify industry with Gemini
        +--> skip duplicate case numbers
        +--> insert new rows into Supabase
        |
        v
Next.js tracker reads Supabase
        |
        v
Table, case detail, metrics, and analytics
```

When a webhook batch contains only new records, the ingest route schedules a continuation in the background. The continuation requests the next Bright Data page and stops when it finds a duplicate, reaches an empty page, or reaches the configured page cap. This supports daily updates without repeatedly scanning the full archive.

## Architecture

This is a Next.js App Router application.

| Area | Responsibility |
| --- | --- |
| `app/page.tsx` | Tracker table, filters, metrics, analytics, and settlement context |
| `app/case/[id]/page.tsx` | Case detail page and related filings |
| `app/api/ingest/route.ts` | Bright Data webhook entry point |
| `components/` | Table, filter, card, ranked list, and pagination UI |
| `lib/ingest.ts` | Parsing, validation, cleaning, classification, and insert flow |
| `lib/ingest-handler.ts` | Webhook parsing and HTTP response handling |
| `lib/brightdata-sync.ts` | Follow-up page collection after a new batch |
| `lib/cases-repository.ts` | Supabase repository and metrics queries |
| `lib/cleaning.ts` | Field normalization and record validation |
| `lib/industry.ts` | Industry labels and Gemini classification |
| `scripts/` | Manual Bright Data runs and database maintenance commands |
| `supabase/schema.sql` | Table, indexes, and aggregate SQL functions |
| `test/` | Unit and integration tests |

## Data model

The `cases` table stores `case_name`, `defendant`, `plaintiff`, `district`, `date_filed`, unique `case_number`, `case_url`, `industry`, and `created_at`.

Supported industry values are Retail, Real Estate, Ecommerce, Healthcare, Education, Hospitality, Financial, Technology, Travel, and Other.

## Local setup

### Requirements

- Node.js
- pnpm
- A Supabase project
- A Gemini API key for industry classification
- Bright Data access for collection and scheduled ingestion

### Install

```bash
pnpm install
cp .env.example .env.local
```

Set the required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
GEMINI_API_KEY=your-gemini-key
```

Run `supabase/schema.sql` in the Supabase SQL editor, then start the app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Ingestion setup

Set the Bright Data collector webhook URL to:

```text
https://YOUR-VERCEL-DOMAIN/api/ingest
```

Each page-level result must contain a `cases` array. Each case must include:

```text
case_name
defendant_name
plaintiff_name
court
date_filed
docket_number
case_url
```

The endpoint accepts Bright Data's raw JSON output, rejects invalid records, skips duplicate case numbers, and returns counts for inserted, skipped, and rejected records.

For the daily CourtListener run, use page 1 as the starting input:

```text
https://www.courtlistener.com/?q=&type=r&order_by=dateFiled+desc&nature_of_suit=446&page=1
```

Add these values for the scripts:

```bash
BRIGHTDATA_API_TOKEN=your-brightdata-token
BRIGHTDATA_COLLECTOR_ID=your-collector-id
INGEST_URL=https://YOUR-VERCEL-DOMAIN/api/ingest
```

Run a collection and ingest the result:

```bash
pnpm brightdata:trigger -- --start=1 --pages=1
pnpm brightdata:run-ingest -- --start=1 --pages=1
```

Useful maintenance commands:

```bash
pnpm test
pnpm check:supabase
pnpm db:clear-cases -- --confirm
pnpm db:reclassify-cases -- --limit=100
pnpm db:reclassify-cases -- --all --limit=100 --delay-ms=4200
```

## Deployment on Vercel

1. Import the GitHub repository into Vercel.
2. Set the production environment variables from `.env.local` in Vercel.
3. Use `pnpm install` for installation if Vercel does not detect pnpm.
4. Use `pnpm build` as the build command.
5. Point Bright Data's webhook to the deployed `/api/ingest` route.
6. Send one test record and confirm it appears in Supabase and the tracker.

Keep the Supabase service role key in server-side environment variables. Never expose it through `NEXT_PUBLIC_*` variables or commit it to the repository.

## Limitations

- Coverage depends on records returned by CourtListener / RECAP and Bright Data.
- A docket record can be amended, delayed, sealed, or missing fields.
- Industry classification depends on the available case text and Gemini's response.
- The ingest endpoint does not currently provide application-level authentication. Add a signed webhook header, authenticated gateway, or Vercel access rule before using it for sensitive production workflows.
- Settlement figures are references, not a complete settlement dataset.
- Recent filing counts use `date_filed`, not the time a record entered Supabase.
- The app is a tracker and research aid, not legal advice.

## Future improvements

- Signed webhook authentication and replay protection.
- Ingestion run history, source pages, and classification confidence.
- A review queue for uncertain industry labels.
- Source freshness and last successful sync status in the UI.
- Richer plaintiff, defendant, and district search.
- CSV export and a documented read-only API.
- Historical trend charts and monthly comparison views.
- End-to-end tests against a seeded Supabase environment.
- Scheduled ingestion with failure alerts.

## License and community files

The application code is available under the [MIT License](LICENSE). Contributions follow [CONTRIBUTING.md](CONTRIBUTING.md), and community participation follows the [Code of Conduct](CODE_OF_CONDUCT.md).

The MIT license applies to this repository's original code. External services, datasets, package dependencies, and source records keep their own terms and licenses.
