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
