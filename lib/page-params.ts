import { INDUSTRIES, type Industry } from "@/lib/types";

const INDUSTRY_SET = new Set<string>(INDUSTRIES);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type RawCaseListParams = {
  district?: string;
  court?: string;
  industry?: string;
  timeRange?: string;
  page?: string;
};

export type CaseListParams = {
  district?: string;
  industry?: Industry;
  timeRange?: "7" | "30";
  page: number;
};

export function parseCaseListParams(params: RawCaseListParams): CaseListParams {
  return {
    district: cleanOptionalParam(params.court ?? params.district),
    industry: parseIndustryParam(params.industry),
    timeRange: params.timeRange === "7" || params.timeRange === "30" ? params.timeRange : undefined,
    page: parsePageParam(params.page)
  };
}

export function caseListPageHref(page: number, params: CaseListParams) {
  const next = new URLSearchParams();

  if (params.district) next.set("district", params.district);
  if (params.industry) next.set("industry", params.industry);
  if (params.timeRange) next.set("timeRange", params.timeRange);
  next.set("page", String(Math.max(Math.trunc(page), 1)));

  return `/?${next.toString()}`;
}

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

function parseIndustryParam(value?: string): Industry | undefined {
  const cleanValue = cleanOptionalParam(value);
  return cleanValue && INDUSTRY_SET.has(cleanValue) ? (cleanValue as Industry) : undefined;
}

function parsePageParam(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function cleanOptionalParam(value?: string) {
  const cleanValue = value?.trim();
  return cleanValue ? cleanValue : undefined;
}
