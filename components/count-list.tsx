import type { CountRow } from "@/lib/types";

export function CountList({ rows }: { rows: CountRow[] }) {
  if (rows.length === 0) {
    return <p className="py-7 text-center text-sm text-stone-500">No data yet.</p>;
  }

  return (
    <ul className="grid gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex justify-between gap-3 border-b border-stone-300 pb-2 text-sm">
          <span>{row.label}</span>
          <strong>{row.count}</strong>
        </li>
      ))}
    </ul>
  );
}
