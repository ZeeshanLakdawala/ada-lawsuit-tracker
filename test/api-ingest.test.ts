import { describe, expect, it } from "vitest";
import { createIngestPost } from "@/lib/ingest-handler";
import { MemoryCasesRepository } from "./memory-repository";

const record = {
  case_name: "Jane Doe v Example Store Inc. (2026)",
  defendant: "Example Store Inc.",
  plaintiff: "Jane Doe",
  district: "S.D.N.Y.",
  date_filed: "2026-08-20",
  case_number: "1:26-cv-12345",
  case_url: "https://example.com/case"
};

describe("POST /api/ingest", () => {
  it("returns success for a valid payload", async () => {
    const repository = new MemoryCasesRepository();
    const post = createIngestPost(repository, async () => "Ecommerce");
    const response = await post(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        body: JSON.stringify([record])
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ inserted: 1, skipped: 0 });
  });
});
