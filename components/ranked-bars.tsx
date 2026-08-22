import type { CountRow } from "@/lib/types";

export function RankedBars({ rows }: { rows: CountRow[] }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  if (rows.length === 0) {
    return <p className="py-5 text-sm text-stone-500">No data yet.</p>;
  }

  return (
    <ul className="grid gap-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex justify-between gap-4 text-sm">
            <span>{row.label}</span>
            <strong>{row.count}</strong>
          </div>
          <div className="h-2 rounded-full bg-stone-100" aria-hidden="true">
            <div className="h-2 rounded-full bg-teal-700" style={{ width: `${Math.max((row.count / max) * 100, 3)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
