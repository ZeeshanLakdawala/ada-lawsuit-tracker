import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/types";

type FiltersProps = {
  districts: string[];
  district?: string;
  industry?: string;
  timeRange?: string;
};

export function Filters({ districts, district, industry, timeRange }: FiltersProps) {
  return (
    <form className="mb-4 flex flex-wrap gap-3">
      <Select name="district" defaultValue={district ?? ""} aria-label="District">
        <option value="">All districts</option>
        {districts.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Select name="industry" defaultValue={industry ?? ""} aria-label="Industry">
        <option value="">All industries</option>
        {INDUSTRIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>

      <Select name="timeRange" defaultValue={timeRange ?? ""} aria-label="Time range">
        <option value="">All time</option>
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
      </Select>

      <Button type="submit">
        Apply
      </Button>
    </form>
  );
}
