import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";
import { getCasesRepository } from "@/lib/cases-repository";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CaseDetail({ params }: PageProps) {
  const { id } = await params;
  const repository = getCasesRepository();
  const caseRecord = await repository.getById(id);

  if (!caseRecord) {
    notFound();
  }

  const related = await repository.relatedCases(caseRecord.district, caseRecord.id);

  return (
    <main className="page">
      <section className="case-header">
        <div>
          <p className="eyebrow">Case detail</p>
          <h1>{caseRecord.case_name}</h1>
          <p className="subhead">
            {caseRecord.date_filed} · {caseRecord.district} · {caseRecord.case_number}
          </p>
        </div>
        <a className="button primary" href={caseRecord.case_url} target="_blank" rel="noreferrer">
          Open filing <ExternalLink size={16} />
        </a>
      </section>

      <section className="detail-grid">
        <div className="case-card">
          <h2>Parties</h2>
          <div className="fact">
            <span className="label">Defendant</span>
            <strong>{caseRecord.defendant}</strong>
          </div>
          <br />
          <div className="fact">
            <span className="label">Plaintiff</span>
            <strong>{caseRecord.plaintiff}</strong>
          </div>
        </div>

        <div className="case-card">
          <h2>Filing facts</h2>
          <ul className="list">
            <li>
              <span>District</span>
              <strong>{caseRecord.district}</strong>
            </li>
            <li>
              <span>Case number</span>
              <strong>{caseRecord.case_number}</strong>
            </li>
            <li>
              <span>Date filed</span>
              <strong>{caseRecord.date_filed}</strong>
            </li>
            <li>
              <span>Industry</span>
              <strong>{caseRecord.industry}</strong>
            </li>
            <li>
              <span>Category</span>
              <strong>ADA website</strong>
            </li>
          </ul>
        </div>

        <div className="case-card">
          <h2>Related cases</h2>
          {related.length === 0 ? (
            <p className="empty">No related cases in this district yet.</p>
          ) : (
            <ul className="list">
              {related.map((item) => (
                <li key={item.id}>
                  <Link className="link" href={`/case/${item.id}`}>
                    {item.defendant}
                  </Link>
                  <span>{item.date_filed}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
