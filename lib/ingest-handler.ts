import { NextResponse } from "next/server";
import type { CasesRepository } from "@/lib/cases-repository";
import { ingestCases, type Classifier } from "@/lib/ingest";

export function createIngestPost(repository: CasesRepository, classifier?: Classifier) {
  return async function ingestPost(request: Request) {
    let payload: unknown;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    try {
      const result = await ingestCases(payload, repository, classifier);

      if (result.inserted === 0 && result.skipped === 0) {
        return NextResponse.json({ error: "No valid records" }, { status: 400 });
      }

      return NextResponse.json({
        inserted: result.inserted,
        skipped: result.skipped
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      const status = message.includes("Payload") ? 400 : 500;

      return NextResponse.json({ error: message }, { status });
    }
  };
}
