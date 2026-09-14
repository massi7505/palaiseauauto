import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  PART_CATEGORY_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/validations/order.schema";
import { formatDateTime } from "@/lib/utils";
import { statusBadge } from "@/components/admin/RequestsTable";
import { getCustomerGroups } from "@/lib/customers";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { requests: { orderBy: { createdAt: "desc" } } },
  });
  if (!customer) notFound();

  // Regroupement : toutes les fiches partageant le même e-mail ou téléphone,
  // donc toutes les demandes du client même s'il a commandé plusieurs fois.
  const groups = await getCustomerGroups();
  const group = groups.find((g) => g.customerIds.includes(customer.id));
  const siblings = group
    ? await prisma.customer.findMany({
        where: { id: { in: group.customerIds.filter((cid) => cid !== customer.id) } },
        include: { requests: { orderBy: { createdAt: "desc" } } },
      })
    : [];
  const allRequests = [...customer.requests];
  for (const s of siblings) allRequests.push(...s.requests);
  allRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/requests" className="text-sm font-semibold text-zinc-300 hover:text-white hover:underline">
        Retour aux demandes
      </Link>
      <section aria-label="Fiche client" className="border border-zinc-800 bg-zinc-900 p-5">
        <h1 className="text-xl font-bold text-white">
          {customer.lastName} {customer.firstName}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {customer.email} — {customer.phone} — {allRequests.length} demande(s)
        </p>
        {group && group.customerIds.length > 1 ? (
          <p className="mt-2 text-xs text-zinc-500">
            Regroupé avec {group.customerIds.length - 1} autre(s) fiche(s) : {group.emails.join(" / ")} — {group.phones.join(" / ")}
          </p>
        ) : null}
      </section>
      <div className="flex flex-col gap-3">
        {allRequests.map((r) => (
          <Link
            key={r.id}
            href={`/admin/requests/${r.id}`}
            className="flex flex-wrap items-center justify-between gap-2 border border-zinc-800 bg-zinc-900 p-4 hover:bg-zinc-800"
          >
            <span>
              <span className="block text-sm font-semibold text-white">{r.vehicleBrand} {r.vehicleModel} — {r.plateNumber}</span>
              <span className="block text-xs text-zinc-400">{PART_CATEGORY_LABELS[r.partCategory]} — {r.partDescription.slice(0, 80)}</span>
            </span>
            <span className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">{formatDateTime(r.createdAt)}</span>
              {statusBadge(r.status, REQUEST_STATUS_LABELS[r.status])}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
