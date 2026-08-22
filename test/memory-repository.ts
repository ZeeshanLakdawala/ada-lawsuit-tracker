import type { CaseFilters, CasePage, CasesRepository } from "@/lib/cases-repository";
import type { CaseInsert, CaseMetrics, CaseRecord, CountRow } from "@/lib/types";

export class MemoryCasesRepository implements CasesRepository {
  records: CaseRecord[] = [];

  async findByCaseNumber(caseNumber: string) {
    return this.records.find((record) => record.case_number === caseNumber) ?? null;
  }

  async insert(record: CaseInsert) {
    const inserted = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };
    this.records.push(inserted);
    return inserted;
  }

  async list(filters: CaseFilters): Promise<CasePage> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const filtered = this.records
      .filter((record) => !filters.district || record.district === filters.district)
      .filter((record) => !filters.industry || record.industry === filters.industry)
      .sort((a, b) => b.date_filed.localeCompare(a.date_filed));

    return {
      cases: filtered.slice(start, start + pageSize),
      total: filtered.length,
      page,
      pageSize
    };
  }

  async metrics(): Promise<CaseMetrics> {
    return {
      total: this.records.length,
      filedYtd: this.records.length,
      last7: this.records.length,
      last30: this.records.length,
      distinctDefendants: new Set(this.records.map((record) => record.defendant)).size,
      distinctPlaintiffs: new Set(this.records.map((record) => record.plaintiff)).size,
      activeDistricts: new Set(this.records.map((record) => record.district)).size,
      largestSettlement: "$5.15M",
      largestSettlementNote: "Fashion Nova, 2025 class action"
    };
  }

  async topPlaintiffs() {
    return countBy(this.records.map((record) => record.plaintiff)).slice(0, 10);
  }

  async topDistricts() {
    return countBy(this.records.map((record) => record.district));
  }

  async industryDistribution() {
    return countBy(this.records.filter((record) => record.industry !== "Other").map((record) => record.industry));
  }

  async getById(id: string) {
    return this.records.find((record) => record.id === id) ?? null;
  }

  async relatedCases(district: string, id: string) {
    return this.records
      .filter((record) => record.district === district && record.id !== id)
      .sort((a, b) => b.date_filed.localeCompare(a.date_filed))
      .slice(0, 5);
  }

  async distinctDistricts() {
    return Array.from(new Set(this.records.map((record) => record.district))).sort();
  }
}

function countBy(values: string[]): CountRow[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
