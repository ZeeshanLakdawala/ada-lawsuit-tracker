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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env vars are missing");
  }

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
    const [total, last7, last30] = await Promise.all([
      this.countSince(),
      this.countSince(7),
      this.countSince(30)
    ]);

    return { total, last7, last30 };
  }

  async topPlaintiffs() {
    return this.rpcCounts("top_plaintiffs");
  }

  async topDistricts() {
    return this.rpcCounts("top_districts");
  }

  async industryDistribution() {
    return this.rpcCounts("industry_distribution");
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

  private async countSince(days?: number) {
    let query = this.client.from("cases").select("id", { count: "exact", head: true });

    if (days) {
      const date = new Date();
      date.setDate(date.getDate() - days);
      query = query.gte("date_filed", date.toISOString().slice(0, 10));
    }

    const { count, error } = await query;

    if (error) throw error;
    return count ?? 0;
  }

  private async rpcCounts(functionName: string) {
    const { data, error } = await this.client.rpc(functionName);

    if (error) throw error;
    return (data ?? []).map((row: { label: string; count: number }) => ({
      label: row.label,
      count: Number(row.count)
    }));
  }
}

export function getCasesRepository(): CasesRepository {
  return new SupabaseCasesRepository();
}
