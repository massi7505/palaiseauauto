import Link from "next/link";
import {
  PART_CATEGORY_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/validations/order.schema";
import { formatDateTime } from "@/lib/utils";
import type { RequestWithCustomer } from "@/lib/requests";

const STATUS_STYLES: Record<string, string> = {
  NOUVEAU: "bg-zinc-900 text-white",
  EN_COURS: "bg-zinc-200 text-zinc-900",
  TRAITE: "bg-white text-zinc-900 border border-zinc-300",
  ANNULE: "bg-zinc-100 text-zinc-500",
};

export function statusBadge(status: string, label: string) {
  return (
    <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status] ?? STATUS_STYLES.NOUVEAU}`}>
      {label}
    </span>
  );
}

export function RequestsTable({ items }: { items: RequestWithCustomer[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
        Aucune demande ne correspond aux filtres.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto border border-zinc-200 bg-white">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3 font-semibold">Date</th>
            <th className="px-4 py-3 font-semibold">Client</th>
            <th className="px-4 py-3 font-semibold">Téléphone</th>
            <th className="px-4 py-3 font-semibold">Véhicule</th>
            <th className="px-4 py-3 font-semibold">Catégorie</th>
            <th className="px-4 py-3 font-semibold">Pièce</th>
            <th className="px-4 py-3 font-semibold">Statut</th>
            <th className="px-4 py-3 font-semibold">Visite</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {items.map((r) => (
            <tr key={r.id} className="align-top hover:bg-zinc-50">
              <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{formatDateTime(r.createdAt)}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/requests/${r.id}`} className="font-semibold text-zinc-900 hover:underline">
                  {r.customer.lastName} {r.customer.firstName}
                </Link>
                <span className="block max-w-[200px] truncate text-xs text-zinc-500">{r.customer.email}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <a href={`tel:${r.customer.phone.replace(/\s/g, "")}`} className="hover:underline">{r.customer.phone}</a>
              </td>
              <td className="px-4 py-3">
                <span className="block font-semibold">{r.vehicleBrand} {r.vehicleModel}</span>
                <span className="font-mono text-xs text-zinc-500">{r.plateNumber}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{PART_CATEGORY_LABELS[r.partCategory]}</td>
              <td className="max-w-[260px] px-4 py-3">
                <span className="line-clamp-2 block text-xs text-zinc-600">{r.partDescription}</span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">{statusBadge(r.status, REQUEST_STATUS_LABELS[r.status])}</td>
              <td className="whitespace-nowrap px-4 py-3 text-xs">{r.visitDate ? formatDateTime(r.visitDate) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
