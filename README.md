# ADA Website Lawsuit Tracker

Minimal Next.js app for ingesting federal ADA website lawsuit filings from Bright Data, classifying defendants with Gemini, storing records in Supabase, and viewing live filings plus analytics.

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
```

3. Run `supabase/schema.sql` in Supabase SQL editor.

4. Start the app:

```bash
pnpm dev
```

## Ingest webhook

POST `/api/ingest` with Bright Data's page-level result array:

```json
[
  {
    "cases": [
      {
        "case_name": "Jane Doe v Example Retail Inc. (2026)",
        "defendant_name": "Example Retail Inc.",
        "plaintiff_name": "Jane Doe",
        "court": "S.D.N.Y.",
        "date_filed": "August 20th, 2026",
        "docket_number": "1:26-cv-12345",
        "case_url": "https://example.com/case"
      }
    ]
  }
]
```

Response:

```json
{
  "inserted": 1,
  "skipped": 0
}
```

Invalid records are rejected inside the batch. A fully empty or fully invalid payload returns `400`.

## Bright Data setup

Set the Bright Data subscription webhook URL to:

```text
https://YOUR-VERCEL-DOMAIN/api/ingest
```

Send Bright Data's raw JSON output. Each page item must include a `cases` array. Each case must include:

```text
case_name
defendant_name
plaintiff_name
court
date_filed
docket_number
case_url
```

The endpoint handles the batch record by record. Duplicates are skipped by `case_number`; invalid rows are counted as rejected.

To trigger CourtListener pages 1-20 through the Bright Data collector, add these to `.env.local`:

```bash
BRIGHTDATA_API_TOKEN=...
BRIGHTDATA_COLLECTOR_ID=c_mt1pq36661zec4ol4
```

Then run:

```bash
pnpm brightdata:trigger -- --start=1 --pages=20
```

The script sends explicit input URLs to Bright Data. That is how the run knows where to stop.

To trigger, poll Bright Data until results are ready, and then post the result into `/api/ingest`:

```bash
pnpm brightdata:run-ingest -- --start=1 --pages=20
```

To create the JSON inputs for a scheduled Bright Data run:

```bash
pnpm brightdata:schedule-inputs -- --start=1 --pages=20
```

To clear the `cases` table during test setup:

```bash
pnpm db:clear-cases -- --confirm
```

To re-run industry classification for rows currently marked `Other`:

```bash
pnpm db:reclassify-cases -- --limit=100
```

To re-run all rows while staying under the Gemini Flash Lite 15 RPM limit:

```bash
pnpm db:reclassify-cases -- --all --limit=100 --delay-ms=4200
```
