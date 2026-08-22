import type { CaseRecordInput, RawCaseRecord } from "@/lib/types";

export function cleanText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().replace(/[.,;:]+$/u, "").trim();
}

export function cleanCaseName(name: string) {
  return name.split("(")[0].trim();
}

export function extractPlaintiffFromCaseName(caseName: string): string {
  return parsePartiesFromCaseName(caseName).plaintiff;
}

export function parsePartiesFromCaseName(caseName: string): { plaintiff: string; defendant: string } {
  const cleaned = cleanCaseName(cleanText(caseName));
  const match = cleaned.match(/^(.+?)\s+v\.?\s+(.+)$/iu);

  return {
    plaintiff: cleanText(match?.[1]),
    defendant: cleanText(match?.[2])
  };
}

export function cleanUrl(value: unknown): string {
  const text = cleanText(value);
  const markdownLink = text.match(/\[(https?:\/\/[^\]\s]+)\]\(https?:\/\/[^\)]+\)/u);
  const bracketedUrl = text.match(/\[?(https?:\/\/[^\]\)\s]+)/u);

  return markdownLink?.[1] ?? bracketedUrl?.[1] ?? text;
}

export function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalizedValue = cleanText(value).replace(/\b(\d{1,2})(st|nd|rd|th)\b/giu, "$1");
  const monthNameDate = parseMonthNameDate(normalizedValue);

  if (monthNameDate) {
    return monthNameDate;
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function parseMonthNameDate(value: string): string | null {
  const match = value.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})$/iu
  );

  if (!match) {
    return null;
  }

  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december"
  ];
  const month = months.indexOf(match[1].toLowerCase()) + 1;
  const day = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || day < 1 || day > 31) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function normalizeRecord(raw: RawCaseRecord): CaseRecordInput | null {
  const dateFiled = normalizeDate(raw.date_filed);
  const caseName = cleanCaseName(cleanText(raw.case_name));
  const rawPlaintiff = cleanText(raw.plaintiff ?? raw.plaintiff_name);
  const rawDefendant = cleanText(raw.defendant ?? raw.defendant_name);
  const parsedParties = parsePartiesFromCaseName(caseName);
  const record = {
    case_name: caseName,
    defendant: choosePartyName(rawDefendant, parsedParties.defendant),
    plaintiff: choosePartyName(rawPlaintiff, parsedParties.plaintiff),
    district: cleanText(raw.district ?? raw.court),
    date_filed: dateFiled ?? "",
    case_number: cleanText(raw.case_number ?? raw.docket_number),
    case_url: cleanUrl(raw.case_url)
  };

  if (!record.case_number || !record.defendant || !dateFiled) {
    return null;
  }

  if (!record.case_name || !record.plaintiff || !record.district || !record.case_url) {
    return null;
  }

  return record;
}

function isPartyNameFragment(value: string) {
  return ["inc", "llc", "ltd", "corp", "co", "company"].includes(value.toLowerCase().replace(/\./g, ""));
}

function choosePartyName(rawValue: string, parsedValue: string) {
  if (!parsedValue) {
    return rawValue;
  }

  if (!rawValue || isPartyNameFragment(rawValue)) {
    return parsedValue;
  }

  const raw = normalizePartyForComparison(rawValue);
  const parsed = normalizePartyForComparison(parsedValue);

  if (raw.includes(parsed) || parsed.includes(raw)) {
    return rawValue;
  }

  return parsedValue;
}

function normalizePartyForComparison(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(incorporated|inc|llc|l\.l\.c|ltd|corp|corporation|company|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
