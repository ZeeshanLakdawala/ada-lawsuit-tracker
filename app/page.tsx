import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CaseTable } from "@/components/case-table";
import { CountList } from "@/components/count-list";
import { Filters } from "@/components/filters";
import { getCasesRepository } from "@/lib/cases-repository";

type SearchParams = Promise<{
  district?: string;
  industry?: string;
  timeRange?: "7" | "30";
  page?: string;
}>;

function pageHref(page: number, params: Awaited<SearchParams>) {
  const next = new URLSearchParams();

  if (params.district) next.set("district", params.district);
  if (params.industry) next.set("industry", params.industry);
  if (params.timeRange) next.set("timeRange", params.timeRange);
  next.set("page", String(page));

  return `/?${next.toString()}`;
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(Number(params.page ?? 1), 1);
  const repository = getCasesRepository();
  const [casePage, metrics, plaintiffs, districts, industries, districtOptions] = await Promise.all([
    repository.list({
      district: params.district,
      industry: params.industry,
      timeRange: params.timeRange,
      page,
      pageSize: 10
    }),
    repository.metrics(),
    repository.topPlaintiffs(),
    repository.topDistricts(),
    repository.industryDistribution(),
    repository.distinctDistricts()
  ]);
  const totalPages = Math.max(Math.ceil(casePage.total / casePage.pageSize), 1);

  return (
    <main className="page">
      <section className="topbar">
        <div>
          <p className="eyebrow">Federal filings</p>
          <h1>ADA Website Lawsuit Tracker</h1>
          <p className="subhead">
            Fresh federal ADA website filings, classified by industry and grouped for fast account research.
          </p>
        </div>
      </section>

      <section className="metric-grid" aria-label="Filing metrics">
        <div className="metric">
          <span>Total filings</span>
          <strong>{metrics.total}</strong>
        </div>
        <div className="metric">
          <span>Last 30 days</span>
          <strong>{metrics.last30}</strong>
        </div>
        <div className="metric">
          <span>Last 7 days</span>
          <strong>{metrics.last7}</strong>
        </div>
      </section>

      <section className="panel">
        <Filters
          districts={districtOptions}
          district={params.district}
          industry={params.industry}
          timeRange={params.timeRange}
        />
        <CaseTable cases={casePage.cases} />
        <nav className="pagination" aria-label="Pagination">
          <Link className="button" href={pageHref(page - 1, params)} aria-disabled={page <= 1}>
            <ArrowLeft size={16} /> Previous
          </Link>
          <span>
            Page {page} of {totalPages}
          </span>
          <Link className="button" href={pageHref(page + 1, params)} aria-disabled={page >= totalPages}>
            Next <ArrowRight size={16} />
          </Link>
        </nav>
      </section>

      <section className="analytics-grid">
        <div className="panel">
          <h2>Top plaintiffs</h2>
          <CountList rows={plaintiffs} />
        </div>
        <div className="panel">
          <h2>Top districts</h2>
          <CountList rows={districts} />
        </div>
        <div className="panel">
          <h2>Industry distribution</h2>
          <CountList rows={industries} />
        </div>
      </section>

      <section className="panel settlement-table">
        <h2>Settlement cost guide</h2>
        <table>
          <thead>
            <tr>
              <th>Cost bucket</th>
              <th>Typical range</th>
              <th>What it usually covers</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Early settlement</td>
              <td>$5,000 to $20,000</td>
              <td>Demand response, limited remediation, plaintiff fees</td>
            </tr>
            <tr>
              <td>Litigated settlement</td>
              <td>$20,000 to $75,000</td>
              <td>Counsel, expert review, larger remediation scope</td>
            </tr>
            <tr>
              <td>Enterprise remediation</td>
              <td>$75,000+</td>
              <td>Audit program, engineering fixes, policy rollout</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  );
}
