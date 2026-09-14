import Link from "next/link";
import { getAdminStats, getPaginatedRequests } from "@/lib/requests";
import { WeeklyChart } from "@/components/admin/WeeklyChart";
import { formatDateTime } from "@/lib/utils";

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([
    getAdminStats(),
    getPaginatedRequests({
      page: 1, pageSize: 5, q: "",
      status: undefined, category: undefined,
      sort: "createdAt", dir: "desc",
    }),
  ]);

  const cards = [
    { label: "Total demandes", value: stats.total, hint: "Toutes périodes" },
    { label: "Demandes du jour", value: stats.today, hint: "Reçues aujourd'hui" },
    { label: "En attente", value: stats.pending, hint: "Statut Nouveau" },
    { label: "Taux traité", value: `${stats.processedRate}%`, hint: "Demandes traitées" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tableau de bord</h1>
          <p className="text-sm text-zinc-400">Activité des demandes de pièces.</p>
        </div>
        <Link href="/admin/requests" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-200">
          Voir toutes les demandes
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <section key={c.label} aria-label={c.label} className="border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs font-semibold text-zinc-400">{c.label}</p>
            <p className="mt-1 text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-zinc-500">{c.hint}</p>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section aria-label="Demandes des 7 derniers jours" className="border border-zinc-800 bg-zinc-900 p-5 lg:col-span-3">
          <h2 className="mb-3 text-sm font-bold text-white">Demandes — 7 derniers jours</h2>
          <WeeklyChart data={stats.byDay} />
        </section>
        <section aria-label="Dernières demandes" className="border border-zinc-800 bg-zinc-900 p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Dernières demandes</h2>
            <Link href="/admin/requests" className="text-xs font-semibold text-zinc-300 hover:text-white hover:underline">Tout voir</Link>
          </div>
          {recent.items.length === 0 ? (
            <p className="text-sm text-zinc-400">Aucune demande pour le moment.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-800">
              {recent.items.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-zinc-800">
                    <span>
                      <span className="block text-sm font-semibold text-white">{r.customer.lastName} {r.customer.firstName}</span>
                      <span className="block text-xs text-zinc-400">{r.vehicleBrand} {r.vehicleModel} — {r.plateNumber}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-zinc-500">{formatDateTime(r.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
