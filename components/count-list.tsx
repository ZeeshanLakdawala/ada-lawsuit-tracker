import type { CountRow } from "@/lib/types";

export function CountList({ rows }: { rows: CountRow[] }) {
  if (rows.length === 0) {
    return <p className="empty">No data yet.</p>;
  }

  return (
    <ul className="list">
      {rows.map((row) => (
        <li key={row.label}>
          <span>{row.label}</span>
          <strong>{row.count}</strong>
        </li>
      ))}
    </ul>
  );
}
