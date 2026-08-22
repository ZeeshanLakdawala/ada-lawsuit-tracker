import { NextResponse } from "next/server";
import type { CasesRepository } from "@/lib/cases-repository";
import { ingestCases, type Classifier } from "@/lib/ingest";

export function createIngestPost(repository: CasesRepository, classifier?: Classifier) {
  return async function ingestPost(request: Request) {
    let payload: unknown;

    try {
      payload = parseWebhookBody(await request.text());
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON. Send Bright Data's raw JSON output, not a markdown-formatted sample. Remove escaped underscores and unescaped line breaks inside string values."
        },
        { status: 400 }
      );
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
      const message = getErrorMessage(error);
      const status = message.includes("Payload") ? 400 : 500;

      console.error("Ingest failed", error);
      return NextResponse.json({ error: message }, { status });
    }
  };
}

export function parseWebhookBody(body: string) {
  try {
    return JSON.parse(body);
  } catch {
    const repaired = body.replace(/\\_/g, "_").replace(/[\r\n]+/g, " ");
    return JSON.parse(repaired);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unexpected error";
}
