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
  const [isHovering, setIsHovering] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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

  const progress = totalPages > 1 ? ((selectedPage - 1) / (totalPages - 1)) * 100 : 0;
  const thumbLeft = `calc(${progress}% + ${8 - progress * 0.16}px)`;
  const showThumbLabel = isHovering || isScrubbing || isFocused;

  return (
    <nav className="border-t border-stone-200 px-4 py-3" aria-label="Pagination">
      <div className="mx-auto flex w-full max-w-2xl items-end gap-3">
        <span className="text-xs font-semibold text-stone-500" aria-hidden="true">1</span>
        <div className="relative flex h-10 flex-1 items-end">
          <output
            className={`pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md bg-slate-950 px-2 py-1 text-xs font-semibold text-white shadow-sm transition-opacity ${showThumbLabel ? "opacity-100" : "opacity-0"}`}
            style={{ left: thumbLeft }}
            aria-hidden="true"
          >
            Page {selectedPage}
          </output>
          <input
            className="h-2 w-full cursor-pointer accent-teal-700"
            type="range"
            min="1"
            max={totalPages}
            value={selectedPage}
            onInput={handleInput}
            onPointerEnter={() => setIsHovering(true)}
            onPointerLeave={() => {
              setIsHovering(false);
              setIsScrubbing(false);
            }}
            onPointerDown={() => setIsScrubbing(true)}
            onPointerUp={() => setIsScrubbing(false)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-label="Page scrubber"
            aria-valuetext={`Page ${selectedPage} of ${totalPages}`}
          />
        </div>
        <span className="text-xs font-semibold text-stone-500" aria-hidden="true">{totalPages}</span>
        <output className="min-w-24 text-right text-sm font-semibold text-stone-700" aria-live="polite">{selectedPage} / {totalPages}</output>
      </div>
    </nav>
  );
}
