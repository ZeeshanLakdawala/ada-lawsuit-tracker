export const INDUSTRIES = [
  "Ecommerce",
  "SaaS",
  "Healthcare",
  "Finance",
  "Education",
  "Hospitality",
  "Government",
  "Other"
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export type RawCaseRecord = {
  case_name?: unknown;
  defendant?: unknown;
  plaintiff?: unknown;
  district?: unknown;
  date_filed?: unknown;
  case_number?: unknown;
  case_url?: unknown;
};

export type CaseRecordInput = {
  case_name: string;
  defendant: string;
  plaintiff: string;
  district: string;
  date_filed: string;
  case_number: string;
  case_url: string;
};

export type CaseRecord = CaseRecordInput & {
  id: string;
  industry: Industry;
  created_at: string;
};

export type CaseInsert = CaseRecordInput & {
  industry: Industry;
};

export type CaseMetrics = {
  total: number;
  last7: number;
  last30: number;
};

export type CountRow = {
  label: string;
  count: number;
};
