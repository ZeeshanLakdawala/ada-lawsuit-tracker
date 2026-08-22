import Link from "next/link";
import { ExternalLink } from "lucide-react";
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
    <main className="mx-auto w-[min(1240px,calc(100%-40px))] py-6 pb-12 max-[760px]:w-[min(100%-28px,100%)]">
      <section className="border-b border-stone-300 pb-10">
        <div className="min-w-0">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-red-700">
            Federal ADA website filing
          </p>
          <h1 className="max-w-[1050px] text-[clamp(2.5rem,4vw,4rem)] font-black leading-[1.04] tracking-normal text-gray-950">
            {caseRecord.case_name}
          </h1>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-2 text-lg text-stone-600 max-[760px]:text-base">
            <MetaItem label="Filed" value={caseRecord.date_filed} />
            <MetaItem label="District" value={caseRecord.district} />
            <MetaItem label="Case number" value={caseRecord.case_number} mono />
          </div>
        </div>
      </section>

      <section className="mt-10 grid grid-cols-[minmax(0,1fr)_360px] gap-10 max-[1040px]:grid-cols-1 max-[760px]:mt-7">
        <div className="grid gap-8">
          <Card className="rounded-2xl border-[#d1d8e0] shadow-sm">
            <CardHeader className="p-7 pb-2 max-[760px]:p-5 max-[760px]:pb-2">
              <CardTitle className="text-xl font-bold uppercase text-stone-600">Parties</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-8 p-7 pt-5 max-[760px]:grid-cols-1 max-[760px]:p-5">
              <PartyFact label="Defendant" value={caseRecord.defendant} />
              <PartyFact label="Plaintiff" value={caseRecord.plaintiff} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#d1d8e0] shadow-sm">
            <CardHeader className="p-7 pb-2 max-[760px]:p-5 max-[760px]:pb-2">
              <CardTitle className="text-xl font-bold uppercase text-stone-600">Filing facts</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-12 gap-y-6 p-7 pt-5 max-[760px]:grid-cols-1 max-[760px]:p-5">
              <DetailFact label="Court" value={caseRecord.district} />
              <DetailFact label="Date filed" value={caseRecord.date_filed} />
              <DetailFact label="Case number" value={caseRecord.case_number} mono />
              <DetailFact label="Industry" value={caseRecord.industry} />
              <DetailLink label="External link" href={caseRecord.case_url} value={sourceLabel(caseRecord.case_url)} />
            </CardContent>
          </Card>
        </div>

        <RelatedCasesCard district={caseRecord.district} related={related} />
      </section>
    </main>
  );
}

function MetaItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <span>
      {label} <strong className={mono ? "font-mono text-gray-950" : "font-bold text-gray-950"}>{value}</strong>
    </span>
  );
}

function PartyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-3">
      <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-stone-500">{label}</span>
      <strong className="text-2xl leading-tight text-gray-950 max-[760px]:text-xl">{value}</strong>
    </div>
  );
}

function DetailFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-2">
      <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-stone-500">{label}</span>
      <strong className={mono ? "font-mono text-xl font-medium text-gray-950" : "text-xl font-normal text-gray-950"}>
        {value}
      </strong>
    </div>
  );
}

function DetailLink({ label, href, value }: { label: string; href: string; value: string }) {
  return (
    <div className="grid gap-2">
      <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-stone-500">{label}</span>
      <a
        className="inline-flex w-fit items-center gap-2 text-xl font-medium text-blue-950"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {value}
        <ExternalLink className="h-5 w-5" />
      </a>
    </div>
  );
}

function RelatedCasesCard({ district, related }: { district: string; related: CaseRecord[] }) {
  return (
    <Card className="self-start rounded-2xl border-[#d1d8e0] shadow-sm">
      <CardHeader className="p-7 pb-2">
        <CardTitle className="text-base font-bold uppercase tracking-[0.04em] text-stone-600">
          Recent related filings in {district}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-7 pt-4">
        {related.length === 0 ? (
          <p className="py-7 text-center text-sm text-stone-500">No related cases in this district yet.</p>
        ) : (
          <ul>
            {related.slice(0, 5).map((item) => (
              <li key={item.id} className="border-b border-stone-200 py-3.5 first:pt-0 last:border-b-0 last:pb-0">
                <Link className="text-lg font-medium leading-snug text-blue-950" href={`/case/${item.id}`}>
                  {item.defendant}
                </Link>
                <p className="mt-1 text-sm text-stone-500">
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

function sourceLabel(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "courtlistener.com" ? "CourtListener" : host;
  } catch {
    return "Open filing";
  }
}
