import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  PART_CATEGORY_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/validations/order.schema";
import { formatDateTime } from "@/lib/utils";
import { statusBadge } from "@/components/admin/RequestsTable";
import { RequestEditor } from "@/components/admin/RequestEditor";

function toLocalInput(d: Date | null): string | null {
  if (!d) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const req = await prisma.request.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!req) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/requests" className="text-sm font-semibold text-zinc-300 hover:text-white hover:underline">
        Retour aux demandes
      </Link>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section aria-label="Détail de la demande" className="border border-zinc-800 bg-zinc-900 p-5 lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-bold text-white">
              {req.customer.lastName} {req.customer.firstName}
            </h1>
            {statusBadge(req.status, REQUEST_STATUS_LABELS[req.status])}
          </div>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-zinc-500">Téléphone</dt><dd className="font-semibold text-white"><a className="hover:underline" href={`tel:${req.customer.phone.replace(/\s/g, "")}`}>{req.customer.phone}</a></dd></div>
            <div><dt className="text-xs text-zinc-500">E-mail</dt><dd className="font-semibold text-white"><a className="hover:underline" href={`mailto:${req.customer.email}`}>{req.customer.email}</a></dd></div>
            <div><dt className="text-xs text-zinc-500">Véhicule</dt><dd className="font-semibold text-white">{req.vehicleBrand} {req.vehicleModel}</dd></div>
            <div><dt className="text-xs text-zinc-500">Immatriculation</dt><dd className="font-mono font-semibold text-white">{req.plateNumber}</dd></div>
            <div><dt className="text-xs text-zinc-500">Catégorie</dt><dd className="font-semibold text-white">{PART_CATEGORY_LABELS[req.partCategory]}</dd></div>
            <div><dt className="text-xs text-zinc-500">Reçue le</dt><dd className="font-semibold text-white">{formatDateTime(req.createdAt)}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-zinc-500">Pièce recherchée</dt><dd className="mt-1 border border-zinc-800 bg-zinc-950 p-3 text-zinc-200">{req.partDescription}</dd></div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`https://api.whatsapp.com/send?phone=${req.customer.phone.replace(/\D/g, "").replace(/^0/, "33")}`} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200">
              WhatsApp client
            </a>
            <Link href={`/admin/customers/${req.customer.id}`} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800">
              Fiche client
            </Link>
          </div>
        </section>
        <div className="lg:col-span-2">
          <RequestEditor
            id={req.id}
            status={req.status}
            visitDate={toLocalInput(req.visitDate)}
            internalNote={req.internalNote}
          />
        </div>
      </div>
    </div>
  );
}
