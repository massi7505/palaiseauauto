import Link from "next/link";

export function Pagination({
  page, totalPages, base,
}: {
  page: number; totalPages: number; base: string;
}) {
  const href = (p: number) => {
    const q = new URLSearchParams(base);
    q.set("page", String(p));
    return `?${q.toString()}`;
  };
  if (totalPages <= 1) return null;
  const nums: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(totalPages, page + 2); p++) nums.push(p);
  const linkClass = (active: boolean, disabled = false) =>
    `rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold ${active ? "bg-zinc-900 text-white" : "bg-white text-zinc-900 hover:bg-zinc-100"} ${disabled ? "pointer-events-none opacity-40" : ""}`;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      <Link href={href(Math.max(1, page - 1))} aria-disabled={page <= 1}
        className={linkClass(false, page <= 1)}>
        Page précédente
      </Link>
      {nums.map((p) => (
        <Link key={p} href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={linkClass(p === page)}>
          {p}
        </Link>
      ))}
      <Link href={href(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}
        className={linkClass(false, page >= totalPages)}>
        Page suivante
      </Link>
    </nav>
  );
}

export function ExportButton({ base }: { base: string }) {
  const q = new URLSearchParams(base);
  q.delete("page");
  q.delete("pageSize");
  return (
    <a href={`/api/requests/export?${q.toString()}`}
      className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">
      Exporter en CSV
    </a>
  );
}
