import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCasesRepository } from "@/lib/cases-repository";
import { isUuid } from "@/lib/page-params";

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
    <main className="mx-auto w-[min(1180px,calc(100%-32px))] py-8 pb-14">
      <section className="flex items-start justify-between gap-4 max-[820px]:block">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-normal text-teal-800">Case detail</p>
          <h1 className="mb-2 text-4xl font-bold tracking-normal text-stone-900 sm:text-5xl">
            {caseRecord.case_name}
          </h1>
          <p className="max-w-2xl text-stone-500">
            {caseRecord.date_filed} | {caseRecord.district} | {caseRecord.case_number}
          </p>
        </div>
        <a className={buttonClasses("default", "mt-2 max-[820px]:mt-5")} href={caseRecord.case_url} target="_blank" rel="noreferrer">
          Open filing <ExternalLink size={16} />
        </a>
      </section>

      <section className="mt-7 grid grid-cols-3 gap-4 max-[820px]:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Parties</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-1">
              <span className="text-sm text-stone-500">Defendant</span>
              <strong>{caseRecord.defendant}</strong>
            </div>
            <div className="grid gap-1">
              <span className="text-sm text-stone-500">Plaintiff</span>
              <strong>{caseRecord.plaintiff}</strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Filing facts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              <li className="flex justify-between gap-3 border-b border-stone-300 pb-2 text-sm">
              <span>District</span>
              <strong>{caseRecord.district}</strong>
            </li>
              <li className="flex justify-between gap-3 border-b border-stone-300 pb-2 text-sm">
              <span>Case number</span>
              <strong>{caseRecord.case_number}</strong>
            </li>
              <li className="flex justify-between gap-3 border-b border-stone-300 pb-2 text-sm">
              <span>Date filed</span>
              <strong>{caseRecord.date_filed}</strong>
            </li>
              <li className="flex justify-between gap-3 border-b border-stone-300 pb-2 text-sm">
              <span>Industry</span>
              <strong>{caseRecord.industry}</strong>
            </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related cases</CardTitle>
          </CardHeader>
          <CardContent>
          {related.length === 0 ? (
            <p className="py-7 text-center text-sm text-stone-500">No related cases in this district yet.</p>
          ) : (
            <ul className="grid gap-2">
              {related.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 border-b border-stone-300 pb-2 text-sm">
                  <Link className="font-semibold text-teal-800" href={`/case/${item.id}`}>
                    {item.defendant}
                  </Link>
                  <span>{item.date_filed}</span>
                </li>
              ))}
            </ul>
          )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
