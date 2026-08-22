"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
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
    const nextPage = Number(value);
    const page = Number.isFinite(nextPage) ? Math.min(Math.max(nextPage, 1), totalPages) : currentPage;
    setSelectedPage(page);
    router.replace(pageHref(page), { scroll: false });
  }

  function handleInput(event: FormEvent<HTMLInputElement>) {
    goToPage(event.currentTarget.value);
  }

  return (
    <nav className="border-t border-stone-200 px-5 py-2.5" aria-label="Pagination">
      <div className="mx-auto grid w-full max-w-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span className="text-xs font-semibold text-stone-500" aria-hidden="true">1</span>
        <div className="flex items-center gap-3">
          <input
            className="h-1.5 w-full cursor-pointer accent-teal-700"
            type="range"
            min="1"
            max={totalPages}
            value={selectedPage}
            onInput={handleInput}
            aria-label="Page scrubber"
            aria-valuetext={`Page ${selectedPage} of ${totalPages}`}
          />
          <span className="text-xs font-semibold text-stone-500" aria-hidden="true">{totalPages}</span>
        </div>
        <output className="whitespace-nowrap text-xs font-semibold text-stone-700" aria-live="polite">
          <span className="text-red-700">{selectedPage}</span> / {totalPages}
        </output>
      </div>
    </nav>
  );
}
