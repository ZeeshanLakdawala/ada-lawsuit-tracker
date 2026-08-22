"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { caseListPageHref, type CaseListParams } from "@/lib/page-params";

type PaginationScrubberProps = {
  currentPage: number;
  totalPages: number;
  district?: string;
  industry?: CaseListParams["industry"];
  timeRange?: CaseListParams["timeRange"];
};

export function PaginationScrubber({ currentPage, totalPages, district, industry, timeRange }: PaginationScrubberProps) {
  const router = useRouter();
  const [selectedPage, setSelectedPage] = useState(currentPage);

  useEffect(() => setSelectedPage(currentPage), [currentPage]);

  function pageHref(page: number) {
    return caseListPageHref(page, { district, industry, timeRange, page: currentPage });
  }

  function goToPage(value: string) {
    const page = Math.min(Math.max(Number(value), 1), totalPages);
    setSelectedPage(page);
    router.replace(pageHref(page), { scroll: false });
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-200 px-4 py-4" aria-label="Pagination">
      {currentPage > 1 ? <Link className={buttonClasses("outline")} href={pageHref(currentPage - 1)}><ArrowLeft size={16} /> Previous</Link> : <span className={buttonClasses("outline", "pointer-events-none opacity-50")} aria-disabled="true"><ArrowLeft size={16} /> Previous</span>}
      <div className="flex min-w-[min(100%,420px)] flex-1 items-center gap-3">
        <span className="text-xs font-semibold text-stone-500" aria-hidden="true">1</span>
        <input className="h-2 w-full cursor-pointer accent-teal-700" type="range" min="1" max={totalPages} value={selectedPage} onChange={(event) => goToPage(event.target.value)} aria-label="Page scrubber" aria-valuetext={`Page ${selectedPage} of ${totalPages}`} />
        <span className="text-xs font-semibold text-stone-500" aria-hidden="true">{totalPages}</span>
        <output className="min-w-24 text-right text-sm font-semibold text-stone-700" aria-live="polite">Page {selectedPage} of {totalPages}</output>
      </div>
      {currentPage < totalPages ? <Link className={buttonClasses("outline")} href={pageHref(currentPage + 1)}>Next <ArrowRight size={16} /></Link> : <span className={buttonClasses("outline", "pointer-events-none opacity-50")} aria-disabled="true">Next <ArrowRight size={16} /></span>}
    </nav>
  );
}
