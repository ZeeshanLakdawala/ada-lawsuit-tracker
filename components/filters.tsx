"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/types";

type FiltersProps = {
  courts: string[];
  court?: string;
  industry?: string;
  timeRange?: string;
};

export function Filters({ courts, court, industry, timeRange }: FiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasFilters = Boolean(court || industry || timeRange);

  function updateFilter(name: "district" | "industry" | "timeRange", value: string) {
    const params = new URLSearchParams();

    if (name !== "district" && court) params.set("district", court);
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
    <div className="mb-4 flex flex-wrap gap-3">
      <Select
        value={court ?? ""}
        onChange={(event) => updateFilter("district", event.target.value)}
        aria-label="Federal court"
      >
        <option value="">All federal courts</option>
        {courts.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Select
        value={industry ?? ""}
        onChange={(event) => updateFilter("industry", event.target.value)}
        aria-label="Industry"
      >
        <option value="">All industries</option>
        {INDUSTRIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Select
        value={timeRange ?? ""}
        onChange={(event) => updateFilter("timeRange", event.target.value)}
        aria-label="Time range"
      >
        <option value="">All time</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
      </Select>

      {hasFilters && (
        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
