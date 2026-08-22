import { describe, expect, it } from "vitest";
import { extractCaseRecords, ingestCases } from "@/lib/ingest";
import { MemoryCasesRepository } from "./memory-repository";

const validRecord = {
  case_name: "Jane Doe v Example Store Inc. (2026)",
  defendant: "Example Store Inc.",
  plaintiff: "Jane Doe",
  district: "S.D.N.Y.",
  date_filed: "2026-08-20",
  case_number: "1:26-cv-12345",
  case_url: "https://example.com/case"
};

describe("ingestCases", () => {
  it("inserts a valid record with classified industry", async () => {
    const repository = new MemoryCasesRepository();
    const result = await ingestCases([{ cases: [validRecord] }], repository, async () => "Ecommerce");

    expect(result).toEqual({ inserted: 1, skipped: 0, rejected: 0 });
    expect(repository.records[0]).toMatchObject({
      case_name: "Jane Doe v Example Store Inc.",
      industry: "Ecommerce"
    });
  });

  it("skips duplicate case numbers", async () => {
    const repository = new MemoryCasesRepository();

    await ingestCases([{ cases: [validRecord] }], repository, async () => "Ecommerce");
    const result = await ingestCases([{ cases: [validRecord] }], repository, async () => "Ecommerce");

    expect(result).toEqual({ inserted: 0, skipped: 1, rejected: 0 });
    expect(repository.records).toHaveLength(1);
  });

  it("rejects empty payload", async () => {
    const repository = new MemoryCasesRepository();

    await expect(ingestCases([], repository)).rejects.toThrow("Payload must include Bright Data page objects");
  });

  it("counts invalid records as rejected", async () => {
    const repository = new MemoryCasesRepository();
    const result = await ingestCases([{ cases: [{ ...validRecord, case_number: "" }] }], repository);

    expect(result).toEqual({ inserted: 0, skipped: 0, rejected: 1 });
  });

  it("extracts Bright Data page results with cases arrays", async () => {
    expect(extractCaseRecords([{ cases: [validRecord] }])).toEqual([validRecord]);
  });

  it("ignores payload items without cases arrays", async () => {
    expect(extractCaseRecords([validRecord])).toEqual([]);
  });

  it("ingests Bright Data page results with nested cases arrays", async () => {
    const repository = new MemoryCasesRepository();
    const result = await ingestCases([{ cases: [validRecord] }], repository, async () => "Ecommerce");

    expect(result).toEqual({ inserted: 1, skipped: 0, rejected: 0 });
    expect(repository.records).toHaveLength(1);
  });
});
