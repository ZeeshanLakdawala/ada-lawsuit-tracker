import { createClient } from "@supabase/supabase-js";
import type { CaseInsert, CaseMetrics, CaseRecord, CountRow } from "@/lib/types";

export type CaseFilters = {
  district?: string;
  industry?: string;
  timeRange?: "7" | "30";
  page?: number;
  pageSize?: number;
};

export type CasePage = {
  cases: CaseRecord[];
  total: number;
  page: number;
  pageSize: number;
};

export interface CasesRepository {
  findByCaseNumber(caseNumber: string): Promise<CaseRecord | null>;
  insert(record: CaseInsert): Promise<CaseRecord>;
  list(filters: CaseFilters): Promise<CasePage>;
  metrics(): Promise<CaseMetrics>;
  topPlaintiffs(): Promise<CountRow[]>;
  topDistricts(): Promise<CountRow[]>;
  industryDistribution(): Promise<CountRow[]>;
  getById(id: string): Promise<CaseRecord | null>;
  relatedCases(district: string, id: string): Promise<CaseRecord[]>;
  distinctDistricts(): Promise<string[]>;
}

function getSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!rawUrl || !key) {
    throw new Error("Supabase env vars are missing");
  }

  const url = new URL(rawUrl.trim().replace(/^["']|["']$/g, "")).origin;

  return createClient(url, key, {
    auth: { persistSession: false }
  });
}

export class SupabaseCasesRepository implements CasesRepository {
  private client = getSupabaseClient();

  async findByCaseNumber(caseNumber: string) {
    const { data, error } = await this.client
      .from("cases")
      .select("*")
      .eq("case_number", caseNumber)
      .maybeSingle();

    if (error) throw error;
    return data as CaseRecord | null;
  }

  async insert(record: CaseInsert) {
    const { data, error } = await this.client.from("cases").insert(record).select("*").single();

    if (error) throw error;
    return data as CaseRecord;
  }

  async list(filters: CaseFilters) {
    const page = Math.max(filters.page ?? 1, 1);
    const pageSize = filters.pageSize ?? 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = this.client
      .from("cases")
      .select("*", { count: "exact" })
      .order("date_filed", { ascending: false })
      .range(from, to);

    if (filters.district) {
      query = query.eq("district", filters.district);
    }

    if (filters.industry) {
      query = query.eq("industry", filters.industry);
    }

    if (filters.timeRange) {
      const date = new Date();
      date.setDate(date.getDate() - Number(filters.timeRange));
      query = query.gte("date_filed", date.toISOString().slice(0, 10));
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      cases: (data ?? []) as CaseRecord[],
      total: count ?? 0,
      page,
      pageSize
    };
  }

  async metrics() {
    const currentYear = new Date().getFullYear();
    const [total, filedYtd, last7, last30, distinctDefendants, distinctPlaintiffs, activeDistricts] = await Promise.all([
      this.countSince(),
      this.countSince(undefined, `${currentYear}-01-01`),
      this.countSince(7),
      this.countSince(30),
      this.distinctCount("defendant"),
      this.distinctCount("plaintiff"),
      this.distinctCount("district")
    ]);

    return {
      total,
      filedYtd,
      last7,
      last30,
      distinctDefendants,
      distinctPlaintiffs,
      activeDistricts,
      largestSettlement: "$5.15M",
      largestSettlementNote: "Fashion Nova, 2025 class action"
    };
  }

  async topPlaintiffs() {
    return this.countColumn("plaintiff", { limit: 10 });
  }

  async topDistricts() {
    return this.countColumn("district");
  }

  async industryDistribution() {
    return this.countColumn("industry", { excludeOther: true });
  }

  async getById(id: string) {
    const { data, error } = await this.client.from("cases").select("*").eq("id", id).maybeSingle();

    if (error) throw error;
    return data as CaseRecord | null;
  }

  async relatedCases(district: string, id: string) {
    const { data, error } = await this.client
      .from("cases")
      .select("*")
      .eq("district", district)
      .neq("id", id)
      .order("date_filed", { ascending: false })
      .limit(5);

    if (error) throw error;
    return (data ?? []) as CaseRecord[];
  }

  async distinctDistricts() {
    const { data, error } = await this.client.from("cases").select("district").order("district");

    if (error) throw error;
    return Array.from(new Set((data ?? []).map((row) => row.district).filter(Boolean)));
  }

  private async countSince(days?: number, fromDate?: string) {
    let query = this.client.from("cases").select("id", { count: "exact", head: true });

    if (fromDate) {
      query = query.gte("date_filed", fromDate);
    } else if (days) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      query = query.gte("date_filed", date.toISOString().slice(0, 10));
    }

    const { count, error } = await query;

    if (error) throw error;
    return count ?? 0;
  }

  private async distinctCount(column: "defendant" | "plaintiff" | "district") {
    const { data, error } = await this.client.from("cases").select(column);

    if (error) throw error;

    return new Set(
      (data ?? [])
        .map((row) => (row as Record<string, unknown>)[column])
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    ).size;
  }

  private async countColumn(
    column: "plaintiff" | "district" | "industry",
    options: { excludeOther?: boolean; limit?: number } = {}
  ) {
    let query = this.client.from("cases").select(column);

    if (options.excludeOther) {
      query = query.neq(column, "Other");
    }

    const { data, error } = await query;

    if (error) throw error;

    const counts = new Map<string, number>();

    for (const row of (data ?? []) as Array<Record<typeof column, string | null>>) {
      const value = row[column];

      if (typeof value === "string" && value) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, options.limit);
  }
}

export function getCasesRepository(): CasesRepository {
  return new SupabaseCasesRepository();
}
