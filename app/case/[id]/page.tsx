import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCasesRepository } from "@/lib/cases-repository";
import { isUuid } from "@/lib/page-params";
import type { CaseRecord } from "@/lib/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetail({ params }: PageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const repository = getCasesRepository();
  const caseRecord = await repository.getById(id);

  if (!caseRecord) {
    notFound();
  }

  const related = await repository.relatedCases(caseRecord.district, caseRecord.id);

  return (
    <main className="mx-auto w-[min(920px,calc(100%-32px))] py-5 pb-10 max-[760px]:w-[min(100%-24px,100%)]">
      <Link className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 transition-colors hover:text-teal-700" href="/">
        <ArrowLeft className="h-4 w-4" />
        Back to federal filings
      </Link>
      <section className="border-b border-stone-200 pb-6">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-red-700">
            Federal ADA website filing
          </p>
          <h1 className="max-w-[760px] text-[clamp(1.65rem,2.4vw,2.25rem)] font-semibold leading-[1.12] tracking-normal text-gray-950">
            {caseRecord.case_name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600">
            <MetaItem label="Filed" value={caseRecord.date_filed} />
            <MetaItem label="District" value={caseRecord.district} />
            <MetaItem label="Case number" value={caseRecord.case_number} mono />
            <a
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-stone-300 bg-white px-3 text-xs font-medium text-gray-900 shadow-sm hover:bg-stone-50"
              href={caseRecord.case_url}
              target="_blank"
              rel="noreferrer"
            >
              Open filing <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      <section className="mt-5 grid grid-cols-[minmax(0,1fr)_285px] gap-3 max-[820px]:grid-cols-1">
        <div className="grid gap-3">
          <Card className="rounded-lg border-stone-200 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.04em] text-stone-600">Parties</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-[minmax(0,1.2fr)_minmax(160px,0.8fr)] gap-x-2 gap-y-3 p-4 pt-3 max-[640px]:grid-cols-1">
              <PartyFact label="Defendant" value={caseRecord.defendant} />
              <PartyFact label="Plaintiff" value={caseRecord.plaintiff} />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-stone-200 shadow-sm">
            <CardHeader className="p-4 pb-1">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.04em] text-stone-600">
                Filing facts
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-[minmax(0,1fr)_minmax(160px,0.9fr)] gap-x-2 gap-y-3 p-4 pt-3 max-[640px]:grid-cols-1">
              <DetailFact label="Court" value={caseRecord.district} />
              <DetailFact label="Date filed" value={caseRecord.date_filed} />
              <DetailFact label="Case number" value={caseRecord.case_number} mono />
              <DetailFact label="Nature of suit" value="446 (Americans with Disabilities Act)" />
              <DetailFact label="Category" value="ada website" />
              <DetailFact label="Industry" value={caseRecord.industry.toLowerCase()} />
            </CardContent>
          </Card>
        </div>

        <RelatedCasesCard district={caseRecord.district} related={related} />
      </section>

      <section className="mt-3 rounded-xl border border-stone-200 bg-stone-100 px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.04em] text-stone-600">Why this case appears here</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-600">
          This is a real federal court filing pulled from CourtListener&apos;s public RECAP archive. It was identified as an ADA website accessibility case based on its Nature of Suit code (446, 443, or 440) and the case caption. We don&apos;t add commentary on the merits. The filing speaks for itself.
        </p>
      </section>
    </main>
  );
}

function MetaItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <span>
      {label} <strong className={mono ? "font-mono font-medium text-gray-950" : "font-semibold text-gray-950"}>{value}</strong>
    </span>
  );
}

function PartyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-stone-500">{label}</span>
      <strong className="text-base font-semibold leading-snug text-gray-950">{value}</strong>
    </div>
  );
}

function DetailFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-stone-500">{label}</span>
      <strong className={mono ? "font-mono text-sm font-medium text-gray-950" : "text-sm font-normal text-gray-950"}>
        {value}
      </strong>
    </div>
  );
}

function RelatedCasesCard({ district, related }: { district: string; related: CaseRecord[] }) {
  return (
    <Card className="self-start rounded-lg border-stone-200 shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-[0.05em] text-stone-600">
          Recent related filings in {district}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-3">
        {related.length === 0 ? (
          <p className="py-5 text-sm text-stone-500">No related cases in this district yet.</p>
        ) : (
          <ul>
            {related.slice(0, 5).map((item) => (
              <li key={item.id} className="border-b border-stone-200 py-2.5 first:pt-0 last:border-b-0 last:pb-0">
                <Link className="text-sm font-medium leading-snug text-blue-950" href={`/case/${item.id}`}>
                  {item.defendant}
                </Link>
                <p className="mt-1 text-xs text-stone-500">
                  {item.date_filed} · {item.district}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
