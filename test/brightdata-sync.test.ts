import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCourtListenerInput, continueBrightDataSync } from "@/lib/brightdata-sync";
import { MemoryCasesRepository } from "./memory-repository";

const originalBrightDataToken = process.env.BRIGHTDATA_API_TOKEN;
const originalBrightDataCollector = process.env.BRIGHTDATA_COLLECTOR_ID;

const baseRecord = {
  case_name: "Jane Doe v Example Store Inc. (2026)",
  defendant: "Example Store Inc.",
  plaintiff: "Jane Doe",
  district: "S.D.N.Y.",
  date_filed: "2026-08-20",
  case_number: "1:26-cv-12345",
  case_url: "https://example.com/case"
};

afterEach(() => {
  process.env.BRIGHTDATA_API_TOKEN = originalBrightDataToken;
  process.env.BRIGHTDATA_COLLECTOR_ID = originalBrightDataCollector;
  vi.restoreAllMocks();
});

describe("brightdata sync", () => {
  it("builds one CourtListener page input", () => {
    expect(buildCourtListenerInput(3)).toEqual({
      url: "https://www.courtlistener.com/?q=&type=r&order_by=dateFiled+desc&nature_of_suit=446&page=3"
    });
  });

  it("continues pages until a duplicate appears", async () => {
    process.env.BRIGHTDATA_API_TOKEN = "token";
    process.env.BRIGHTDATA_COLLECTOR_ID = "collector";
    const repository = new MemoryCasesRepository();
    await repository.insert({ ...baseRecord, case_number: "1:26-cv-old", industry: "Retail" });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ collection_id: "page-2" }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            cases: [
              { ...baseRecord, case_number: "1:26-cv-new-2", defendant: "New Retail LLC" },
              { ...baseRecord, case_number: "1:26-cv-old", defendant: "Old Retail LLC" },
              { ...baseRecord, case_number: "1:26-cv-never", defendant: "Never Retail LLC" }
            ]
          }
        ])
      );

    const result = await continueBrightDataSync(repository, async () => "Retail", {
      startPage: 2,
      maxPage: 20,
      intervalMs: 1,
      timeoutMs: 100
    });

    expect(result).toEqual({
      pagesScanned: 1,
      inserted: 1,
      skipped: 1,
      rejected: 0,
      stoppedReason: "duplicate",
      duplicateCaseNumber: "1:26-cv-old"
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(repository.records.map((record) => record.case_number)).toEqual(["1:26-cv-old", "1:26-cv-new-2"]);
  });

  it("keeps scanning when every page is new until max page", async () => {
    process.env.BRIGHTDATA_API_TOKEN = "token";
    process.env.BRIGHTDATA_COLLECTOR_ID = "collector";
    const repository = new MemoryCasesRepository();
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ collection_id: "page-2" }))
      .mockResolvedValueOnce(jsonResponse([{ cases: [{ ...baseRecord, case_number: "1:26-cv-new-2" }] }]))
      .mockResolvedValueOnce(jsonResponse({ collection_id: "page-3" }))
      .mockResolvedValueOnce(jsonResponse([{ cases: [{ ...baseRecord, case_number: "1:26-cv-new-3" }] }]));

    const result = await continueBrightDataSync(repository, async () => "Retail", {
      startPage: 2,
      maxPage: 3,
      intervalMs: 1,
      timeoutMs: 100
    });

    expect(result).toEqual({
      pagesScanned: 2,
      inserted: 2,
      skipped: 0,
      rejected: 0,
      stoppedReason: "max_page"
    });
  });
});

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
