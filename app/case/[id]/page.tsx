import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCasesRepository } from "@/lib/cases-repository";
import { districtToState } from "@/lib/district-state";
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
  const state = districtToState(caseRecord.district);

  return (
    <main className="mx-auto w-[min(1180px,calc(100%-40px))] py-5 pb-12 max-[760px]:w-[min(100%-28px,100%)]">
      <section className="border-b border-stone-300 pb-9">
        <div className="min-w-0">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-red-700">
            Federal ADA website filing
          </p>
          <h1 className="max-w-[1040px] text-[clamp(2.25rem,3.7vw,3.5rem)] font-black leading-[1.05] tracking-normal text-gray-950">
            {caseRecord.case_name}
          </h1>
          <div className="mt-5 flex flex-wrap gap-x-7 gap-y-2 text-[17px] text-stone-600 max-[760px]:text-base">
            <MetaItem label="Filed" value={caseRecord.date_filed} />
            <MetaItem label="District" value={caseRecord.district} />
            <MetaItem label="Case number" value={caseRecord.case_number} mono />
          </div>
        </div>
      </section>

      <section className="mt-9 grid grid-cols-[minmax(0,1fr)_350px] gap-9 max-[1040px]:grid-cols-1 max-[760px]:mt-7">
        <div className="grid gap-7">
          <Card className="rounded-2xl border-[#d1d8e0] shadow-sm">
            <CardHeader className="p-7 pb-1 max-[760px]:p-5 max-[760px]:pb-1">
              <CardTitle className="text-[19px] font-bold uppercase text-stone-600">Parties</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-8 p-7 pt-5 max-[760px]:grid-cols-1 max-[760px]:p-5">
              <PartyFact label="Defendant" value={caseRecord.defendant} />
              <PartyFact label="Plaintiff" value={caseRecord.plaintiff} />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-[#d1d8e0] shadow-sm">
            <CardHeader className="p-7 pb-1 max-[760px]:p-5 max-[760px]:pb-1">
              <CardTitle className="text-[19px] font-bold uppercase text-stone-600">Filing facts</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-12 gap-y-6 p-7 pt-5 max-[760px]:grid-cols-1 max-[760px]:p-5">
              <DetailFact label="Court" value={caseRecord.district} />
              <DetailFact label="State" value={state} />
              <DetailFact label="Case number" value={caseRecord.case_number} mono />
              <DetailFact label="Date filed" value={caseRecord.date_filed} />
              <DetailFact label="Nature of suit" value="446 (Americans with Disabilities Act)" />
              <DetailFact label="Category" value="ada website" />
              <DetailFact label="Data source" value="court_listener" mono />
              <DetailFact label="Industry" value={caseRecord.industry.toLowerCase()} />
            </CardContent>
          </Card>

          <section className="grid gap-3 px-1">
            <h2 className="text-xl font-bold text-gray-950">Sources & dockets</h2>
            <ul className="list-disc space-y-2 pl-5 text-base text-stone-700">
              <li>
                Case number: <span className="font-mono text-gray-950">{caseRecord.case_number}</span>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-1.5 font-medium text-blue-950"
                  href={caseRecord.case_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  CourtListener docket <ExternalLink className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </section>
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
      <strong className="text-[23px] leading-tight text-gray-950 max-[760px]:text-xl">{value}</strong>
    </div>
  );
}

function DetailFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-2">
      <span className="text-[13px] font-medium uppercase tracking-[0.04em] text-stone-500">{label}</span>
      <strong className={mono ? "font-mono text-lg font-medium text-gray-950" : "text-lg font-normal text-gray-950"}>
        {value}
      </strong>
    </div>
  );
}

function RelatedCasesCard({ district, related }: { district: string; related: CaseRecord[] }) {
  return (
    <Card className="self-start rounded-2xl border-[#d1d8e0] shadow-sm">
      <CardHeader className="p-6 pb-2">
        <CardTitle className="text-[15px] font-bold uppercase tracking-[0.05em] text-stone-600">
          Recent related filings in {district}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-4">
        {related.length === 0 ? (
          <p className="py-7 text-center text-sm text-stone-500">No related cases in this district yet.</p>
        ) : (
          <ul>
            {related.slice(0, 5).map((item) => (
              <li key={item.id} className="border-b border-stone-200 py-3.5 first:pt-0 last:border-b-0 last:pb-0">
                <Link className="text-[17px] font-medium leading-snug text-blue-950" href={`/case/${item.id}`}>
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
