import Link from "next/link";
import type { CaseRecord } from "@/lib/types";

export function CaseTable({ cases }: { cases: CaseRecord[] }) {
  if (cases.length === 0) {
    return <p className="empty">No filings match these filters.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Date Filed</th>
          <th>Defendant</th>
          <th>Plaintiff</th>
          <th>District</th>
          <th>Case #</th>
        </tr>
      </thead>
      <tbody>
        {cases.map((caseRecord) => (
          <tr key={caseRecord.id}>
            <td>{caseRecord.date_filed}</td>
            <td>
              <Link className="link" href={`/case/${caseRecord.id}`}>
                {caseRecord.defendant}
              </Link>
            </td>
            <td>{caseRecord.plaintiff}</td>
            <td>{caseRecord.district}</td>
            <td>{caseRecord.case_number}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
