import { FiltersBar } from "@/components/admin/FiltersBar";
import { ExportButton, Pagination } from "@/components/admin/Pagination";
import { RequestsTable } from "@/components/admin/RequestsTable";
import { getPaginatedRequests, parseRequestFilters } from "@/lib/requests";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;
  const filters = parseRequestFilters(resolved);
  const data = await getPaginatedRequests(filters);
  const base = new URLSearchParams(
    Object.fromEntries(
      Object.entries(resolved).flatMap(([k, v]) =>
        typeof v === "string" ? [[k, v]] : [],
      ),
    ),
  ).toString();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Demandes</h1>
          <p className="text-sm text-zinc-400">Recherche, filtres et export.</p>
        </div>
        <ExportButton base={base} />
      </div>
      <FiltersBar total={data.total} />
      <RequestsTable items={data.items} />
      <Pagination page={data.page} totalPages={data.totalPages} base={base} />
    </div>
  );
}
