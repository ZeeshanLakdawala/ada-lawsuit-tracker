# Contributing

Thanks for helping improve ADA Website Lawsuit Tracker.

## Before you start

Read the [Code of Conduct](CODE_OF_CONDUCT.md). For a large change, open an issue first and describe the problem, the proposed behaviour, and any data or deployment impact.

## Local workflow

1. Fork the repository and create a focused branch.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env.local` and add local credentials.
4. Make the smallest change that solves the issue.
5. Run `pnpm test`.
6. Run `pnpm build` for changes that affect the app or deployment.
7. Open a pull request with the problem, the change, and verification results.

## Data and secrets

Do not commit `.env.local`, API keys, Supabase service role keys, Bright Data tokens, Gemini keys, private docket data, or generated datasets. Use small fixtures in `test/` when a test needs sample data.

## Pull requests

Keep one concern per pull request. Include screenshots for meaningful UI changes. Explain changes to ingestion, database schema, source handling, or classification rules because they can affect existing records.

Pull requests should include:

- What problem the change solves.
- Which files or workflows changed.
- How the change was tested.
- Any migration, environment variable, or deployment steps.
- Known limitations or follow-up work.

## Database changes

Update `supabase/schema.sql` when the schema changes. Explain whether existing data needs a migration or reclassification. Never use production credentials in tests.

## License

By submitting a contribution, you agree that it may be distributed under this repository's [MIT License](LICENSE).
