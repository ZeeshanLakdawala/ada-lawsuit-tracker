import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CaseRecord } from "@/lib/types";

export function CaseTable({ cases }: { cases: CaseRecord[] }) {
  if (cases.length === 0) {
    return <p className="py-7 text-center text-sm text-stone-500">No filings match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date Filed</TableHead>
            <TableHead>Defendant</TableHead>
            <TableHead>Plaintiff</TableHead>
            <TableHead>District</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Case Number</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
        {cases.map((caseRecord) => (
          <TableRow key={caseRecord.id} className="transition-colors hover:bg-stone-100/80">
            <TableCell>{caseRecord.date_filed}</TableCell>
            <TableCell>
              <Link
                className="font-semibold text-teal-800 underline-offset-2 hover:underline focus-visible:underline"
                href={`/case/${caseRecord.id}`}
              >
                {caseRecord.defendant}
              </Link>
            </TableCell>
            <TableCell>{caseRecord.plaintiff}</TableCell>
            <TableCell>{caseRecord.district}</TableCell>
            <TableCell className="capitalize">{caseRecord.industry}</TableCell>
            <TableCell>{caseRecord.case_number}</TableCell>
          </TableRow>
        ))}
        </TableBody>
      </Table>
    </div>
  );
}
