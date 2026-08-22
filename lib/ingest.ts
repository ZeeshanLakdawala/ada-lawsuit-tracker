import { normalizeRecord } from "@/lib/cleaning";
import type { CasesRepository } from "@/lib/cases-repository";
import { classifyIndustry } from "@/lib/industry";
import type { Industry, RawCaseRecord } from "@/lib/types";

export type IngestResult = {
  inserted: number;
  skipped: number;
  rejected: number;
};

export type Classifier = (defendant: string, caseName: string) => Promise<Industry>;

export async function ingestCases(
  payload: unknown,
  repository: CasesRepository,
  classifier: Classifier = classifyIndustry
): Promise<IngestResult> {
  const records = extractCaseRecords(payload);

  if (records.length === 0) {
    throw new Error("Payload must include Bright Data page objects with non-empty cases arrays");
  }

  const normalized = records
    .map((record) => normalizeRecord(record as RawCaseRecord))
    .filter((record) => record !== null);

  const results = await Promise.all(
    normalized.map(async (record) => {
      const existing = await repository.findByCaseNumber(record.case_number);

      if (existing) {
        return "skipped" as const;
      }

      const industry = await classifier(record.defendant, record.case_name);
      await repository.insert({ ...record, industry });
      return "inserted" as const;
    })
  );

  return {
    inserted: results.filter((result) => result === "inserted").length,
    skipped: results.filter((result) => result === "skipped").length,
    rejected: records.length - normalized.length
  };
}

export function extractCaseRecords(payload: unknown): unknown[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((item) =>
    item && typeof item === "object" && "cases" in item && Array.isArray(item.cases) ? item.cases : []
  );
}
