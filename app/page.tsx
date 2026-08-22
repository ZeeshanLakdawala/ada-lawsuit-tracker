import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CaseTable } from "@/components/case-table";
import { Filters } from "@/components/filters";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCasesRepository } from "@/lib/cases-repository";
import { caseListPageHref, parseCaseListParams } from "@/lib/page-params";

type SearchParams = Promise<{ district?: string; court?: string; industry?: string; timeRange?: string; page?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = parseCaseListParams(await searchParams);
  const repository = getCasesRepository();
  const [initialCasePage, metrics] = await Promise.all([
    repository.list({ district: params.district, industry: params.industry, timeRange: params.timeRange, page: params.page, pageSize: 10 }),
    repository.metrics()
  ]);
  const totalPages = Math.max(Math.ceil(initialCasePage.total / initialCasePage.pageSize), 1);
  const currentPage = Math.min(params.page, totalPages);
  const casePage = params.page === currentPage ? initialCasePage : await repository.list({ district: params.district, industry: params.industry, timeRange: params.timeRange, page: currentPage, pageSize: 10 });
  const metricCards = [
    ["In our DB", metrics.total, "federal filings tracked"], ["Filed YTD", metrics.filedYtd, `${new Date().getFullYear()} so far`],
    ["Last 30 days", metrics.last30, "rolling window"], ["Last 7 days", metrics.last7, "this week"],
    ["Distinct defendants", metrics.distinctDefendants, "companies named"], ["Distinct plaintiff names", metrics.distinctPlaintiffs, "plaintiffs in the docket"],
    ["Active districts (DB)", metrics.activeDistricts, "federal districts represented"], ["Largest known settlement", metrics.largestSettlement, metrics.largestSettlementNote]
  ] as const;

  return (
    <main className="mx-auto w-[min(1136px,calc(100%-32px))] py-14 pb-20">
      <section className="mb-12">
        <div className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-wide"><span className="rounded bg-red-50 px-2 py-1 text-red-700">Live federal data</span><span className="font-normal normal-case tracking-normal text-stone-500">Updated daily from CourtListener / RECAP</span></div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">ADA Website Lawsuit Tracker</h1>
        <p className="max-w-4xl text-lg leading-8 text-stone-500"><strong className="text-stone-900">3,948 federal lawsuits</strong> filed against US business websites in 2025 alone, up <strong className="text-stone-900">23.84%</strong> from 2024. ADA-website cases are now <strong className="text-stone-900">36%</strong> of all ADA Title III filings, and just <strong className="text-stone-900">31 plaintiffs</strong> file over half of them. This tracker shows the actual federal docket.</p>
      </section>

      <section className="mb-16 grid grid-cols-4 gap-3 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1" aria-label="Filing metrics">
        {metricCards.map(([label, value, note], index) => <Card key={label} className={`min-h-32 rounded-xl ${index === 0 ? "bg-slate-950 text-white" : ""}`}><CardContent className="p-5"><span className={`text-xs font-semibold uppercase tracking-wide ${index === 0 ? "text-slate-300" : "text-stone-500"}`}>{label}</span><strong className={`mt-2 block text-3xl font-bold tracking-tight ${index === 0 ? "text-white" : "text-slate-950"}`}>{value}</strong><span className={`mt-1 block text-xs ${index === 0 ? "text-slate-300" : "text-stone-500"}`}>{note}</span></CardContent></Card>)}
      </section>

      <section className="mb-5"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">{metrics.total} filings in our docket</p><h2 className="mb-2 text-3xl font-bold tracking-tight text-slate-950">Federal ADA website filings</h2><p className="max-w-4xl text-stone-500">Live cases from CourtListener&apos;s RECAP archive, {metrics.total} in our DB so far, against a known 2025 total of 3,948 nationally. Use the filters below to narrow by industry or filing window. Click any case to view the docket.</p></section>
      <section className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-4" aria-label="Filing filters"><Filters industry={params.industry} timeRange={params.timeRange} /></section>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"><div className="overflow-x-auto p-2"><CaseTable cases={casePage.cases} /></div><nav className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-4" aria-label="Pagination">
        {currentPage > 1 ? <Link className={buttonClasses("outline")} href={caseListPageHref(currentPage - 1, params)}><ArrowLeft size={16} /> Previous</Link> : <span className={buttonClasses("outline", "pointer-events-none opacity-50")} aria-disabled="true"><ArrowLeft size={16} /> Previous</span>}
        <div className="flex flex-wrap items-center justify-center gap-1" aria-label="Page numbers">{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <Link key={page} className={buttonClasses(page === currentPage ? "default" : "outline", "h-9 min-w-9 px-2")} href={caseListPageHref(page, params)} aria-current={page === currentPage ? "page" : undefined}>{page}</Link>)}</div>
        {currentPage < totalPages ? <Link className={buttonClasses("outline")} href={caseListPageHref(currentPage + 1, params)}>Next <ArrowRight size={16} /></Link> : <span className={buttonClasses("outline", "pointer-events-none opacity-50")} aria-disabled="true">Next <ArrowRight size={16} /></span>}
      </nav></section>
    </main>
  );
}
