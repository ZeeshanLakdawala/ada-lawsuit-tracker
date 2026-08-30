import { normalizeRecord } from "@/lib/cleaning";
import type { CasesRepository } from "@/lib/cases-repository";
import { classifyIndustry } from "@/lib/industry";
import type { Industry, RawCaseRecord } from "@/lib/types";

export type IngestResult = {
  inserted: number;
  skipped: number;
  rejected: number;
  sawDuplicate: boolean;
  duplicateCaseNumber?: string;
  processed: number;
};

export type Classifier = (defendant: string, caseName: string) => Promise<Industry>;

export type IngestOptions = {
  stopOnDuplicate?: boolean;
};

export async function ingestCases(
  payload: unknown,
  repository: CasesRepository,
  classifier: Classifier = classifyIndustry,
  options: IngestOptions = {}
): Promise<IngestResult> {
  const records = extractCaseRecords(payload);
  const stopOnDuplicate = options.stopOnDuplicate ?? true;

  if (records.length === 0) {
    throw new Error("Payload must include Bright Data page objects with non-empty cases arrays");
  }

  const normalized = records
    .map((record) => normalizeRecord(record as RawCaseRecord))
    .filter((record) => record !== null);

  let inserted = 0;
  let skipped = 0;
  let duplicateCaseNumber: string | undefined;

  for (const record of normalized) {
    const existing = await repository.findByCaseNumber(record.case_number);

    if (existing) {
      skipped += 1;
      duplicateCaseNumber = record.case_number;

      if (stopOnDuplicate) {
        break;
      }

      continue;
    }

    const industry = await classifier(record.defendant, record.case_name);
    await repository.insert({ ...record, industry });
    inserted += 1;
  }

  const result: IngestResult = {
    inserted,
    skipped,
    rejected: records.length - normalized.length,
    sawDuplicate: skipped > 0,
    processed: inserted + skipped
  };

  if (duplicateCaseNumber) {
    result.duplicateCaseNumber = duplicateCaseNumber;
  }

  return result;
}

export function extractCaseRecords(payload: unknown): unknown[] {
  if (!Array.isArray(payload)) {
    return extractCaseRecordsFromValue(payload);
  }

  return payload.flatMap((item) => extractCaseRecordsFromValue(item));
}

function extractCaseRecordsFromValue(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractCaseRecordsFromValue(item));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const record = value as Record<string, unknown>;
  const directCases = record.cases;

  if (Array.isArray(directCases)) {
    return directCases;
  }

  if (looksLikeCaseRecord(record)) {
    return [record];
  }

  return Object.values(record).flatMap((item) => extractCaseRecordsFromValue(item));
}

function looksLikeCaseRecord(record: Record<string, unknown>) {
  return (
    "case_name" in record ||
    "defendant_name" in record ||
    "plaintiff_name" in record ||
    "docket_number" in record ||
    "case_number" in record ||
    "case_url" in record
  );
}
