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

POST `/api/ingest` with an array:

```json
[
  {
    "case_name": "Jane Doe v Example Retail Inc. (2026)",
    "defendant": "Example Retail Inc.",
    "plaintiff": "Jane Doe",
    "district": "S.D.N.Y.",
    "date_filed": "2026-08-20",
    "case_number": "1:26-cv-12345",
    "case_url": "https://example.com/case"
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

Send the scraper output as a JSON array. Each item must include:

```text
case_name
defendant
plaintiff
district
date_filed
case_number
case_url
```

The endpoint handles the batch record by record. Duplicates are skipped by `case_number`; invalid rows are counted as rejected.

To trigger CourtListener pages 1-10 through the Bright Data collector, add these to `.env.local`:

```bash
BRIGHTDATA_API_TOKEN=...
BRIGHTDATA_COLLECTOR_ID=c_mt1pq36661zec4ol4
```

Then run:

```bash
pnpm brightdata:trigger -- --start=1 --pages=10
```

The script sends 10 explicit input URLs to Bright Data. That is how the run knows where to stop.

To clear the `cases` table during test setup:

```bash
pnpm db:clear-cases -- --confirm
```
