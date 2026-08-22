import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CaseTable } from "@/components/case-table";
import { CountList } from "@/components/count-list";
import { Filters } from "@/components/filters";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 pb-14">
      <section className="mb-7 flex items-end justify-between gap-5 max-[820px]:block">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-normal text-teal-800">Federal filings</p>
          <h1 className="mb-2 text-4xl font-bold tracking-normal text-stone-900 sm:text-5xl">
            ADA Website Lawsuit Tracker
          </h1>
          <p className="max-w-2xl text-stone-500">
            Fresh federal ADA website filings, classified by industry and grouped for fast account research.
          </p>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-3 gap-4 max-[820px]:grid-cols-1" aria-label="Filing metrics">
        {[
          ["Total filings", metrics.total],
          ["Last 7 days", metrics.last7],
          ["Last 30 days", metrics.last30]
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent>
              <span className="text-sm text-stone-500">{label}</span>
              <strong className="mt-2 block text-4xl">{value}</strong>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-lg border border-stone-300 bg-white p-5">
        <Filters
          districts={districtOptions}
          district={params.district}
          industry={params.industry}
          timeRange={params.timeRange}
        />
        <CaseTable cases={casePage.cases} />
        <nav className="mt-4 flex items-center justify-between gap-3" aria-label="Pagination">
          <Link className={buttonClasses("outline")} href={pageHref(page - 1, params)} aria-disabled={page <= 1}>
            <ArrowLeft size={16} /> Previous
          </Link>
          <span className="text-sm text-stone-600">
            Page {page} of {totalPages}
          </span>
          <Link className={buttonClasses("outline")} href={pageHref(page + 1, params)} aria-disabled={page >= totalPages}>
            Next <ArrowRight size={16} />
          </Link>
        </nav>
      </section>

      <section className="mt-7 grid grid-cols-3 gap-4 max-[820px]:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Top plaintiffs</CardTitle>
          </CardHeader>
          <CardContent>
            <CountList rows={plaintiffs} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top districts</CardTitle>
          </CardHeader>
          <CardContent>
            <CountList rows={districts} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Industry distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <CountList rows={industries} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-7 rounded-lg border border-stone-300 bg-white p-5">
        <h2 className="mb-3 text-xl font-semibold">Settlement cost guide</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cost bucket</TableHead>
                <TableHead>Typical range</TableHead>
                <TableHead>What it usually covers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Early settlement</TableCell>
                <TableCell>$5,000 to $20,000</TableCell>
                <TableCell>Demand response, limited remediation, plaintiff fees</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Litigated settlement</TableCell>
                <TableCell>$20,000 to $75,000</TableCell>
                <TableCell>Counsel, expert review, larger remediation scope</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Enterprise remediation</TableCell>
                <TableCell>$75,000+</TableCell>
                <TableCell>Audit program, engineering fixes, policy rollout</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
