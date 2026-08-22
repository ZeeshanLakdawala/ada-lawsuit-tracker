"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/types";

type FiltersProps = {
  industry?: string;
  timeRange?: string;
};

export function Filters({ industry, timeRange }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasFilters = Boolean(industry || timeRange);

  function updateFilter(name: "industry" | "timeRange", value: string) {
    const params = new URLSearchParams();

    if (name !== "industry" && industry) params.set("industry", industry);
    if (name !== "timeRange" && timeRange) params.set("timeRange", timeRange);
    if (value) params.set(name, value);
    params.set("page", "1");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    router.replace(pathname, { scroll: false });
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1 sm:max-w-52">
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-stone-500" htmlFor="industry-filter">Industry</label>
        <div className="relative">
          <Select id="industry-filter" className="h-9 w-full min-w-0 appearance-none rounded border-stone-200 bg-stone-100 px-2.5 pr-8 text-xs text-stone-900 hover:border-stone-300 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-red-100" value={industry ?? ""} onChange={(event) => updateFilter("industry", event.target.value)} aria-label="Industry">
            <option value="">All industries</option>
            {INDUSTRIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
        </div>
      </div>

      <div className="min-w-0 flex-1 sm:max-w-44">
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-stone-500" htmlFor="filing-window-filter">Filing window</label>
        <div className="relative">
          <Select id="filing-window-filter" className="h-9 w-full min-w-0 appearance-none rounded border-stone-200 bg-stone-100 px-2.5 pr-8 text-xs text-stone-900 hover:border-stone-300 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-red-100" value={timeRange ?? ""} onChange={(event) => updateFilter("timeRange", event.target.value)} aria-label="Filing window">
            <option value="">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </Select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500" />
        </div>
      </div>

      {hasFilters && (
        <Button className="h-9 px-3 text-xs" type="button" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
