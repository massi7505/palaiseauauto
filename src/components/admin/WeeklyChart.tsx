"use client";

export function WeeklyChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="w-full">
      <ul className="flex items-end gap-2" aria-label="Demandes des 7 derniers jours">
        {data.map((d) => (
          <li key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-semibold text-zinc-700">{d.count}</span>
            <span
              aria-hidden
              className="w-full rounded-t bg-zinc-900"
              style={{ height: `${Math.max(6, Math.round((d.count / max) * 140))}px` }}
            />
            <span className="text-[11px] text-zinc-500">{d.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
