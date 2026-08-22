import type { CaseRecordInput, RawCaseRecord } from "@/lib/types";

export function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/[.,;:]+$/u, "").trim();
}

export function cleanCaseName(value: unknown): string {
  return cleanText(cleanText(value).split("(")[0]);
}

export function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

export function normalizeRecord(raw: RawCaseRecord): CaseRecordInput | null {
  const dateFiled = normalizeDate(raw.date_filed);
  const record = {
    case_name: cleanCaseName(raw.case_name),
    defendant: cleanText(raw.defendant),
    plaintiff: cleanText(raw.plaintiff),
    district: cleanText(raw.district),
    date_filed: dateFiled ?? "",
    case_number: cleanText(raw.case_number),
    case_url: cleanText(raw.case_url)
  };

  if (!record.case_number || !record.defendant || !dateFiled) {
    return null;
  }

  if (!record.case_name || !record.plaintiff || !record.district || !record.case_url) {
    return null;
  }

  return record;
}
