"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  PART_CATEGORIES,
  PART_CATEGORY_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  VEHICLE_BRANDS,
} from "@/lib/validations/order.schema";

function useFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();

  function set(patch: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    start(() => router.push(`?${next.toString()}`));
  }
  return { params, set, pending };
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

const selectClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

export function FiltersBar({ total }: { total: number }) {
  const { params, set, pending } = useFilters();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <div className="flex flex-col gap-3 border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <form
          className="flex gap-2 sm:col-span-2"
          onSubmit={(e) => { e.preventDefault(); set({ q }); }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, téléphone, e-mail, immatriculation…"
            aria-label="Recherche"
            className={inputClass}
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            OK
          </button>
        </form>
        <select aria-label="Statut" value={params.get("status") ?? ""} onChange={(e) => set({ status: e.target.value })} className={selectClass}>
          <option value="">Tous statuts</option>
          {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{REQUEST_STATUS_LABELS[s]}</option>)}
        </select>
        <select aria-label="Catégorie" value={params.get("category") ?? ""} onChange={(e) => set({ category: e.target.value })} className={selectClass}>
          <option value="">Toutes catégories</option>
          {PART_CATEGORIES.map((c) => <option key={c} value={c}>{PART_CATEGORY_LABELS[c]}</option>)}
        </select>
        <select aria-label="Marque" value={params.get("brand") ?? ""} onChange={(e) => set({ brand: e.target.value })} className={selectClass}>
          <option value="">Toutes marques</option>
          {VEHICLE_BRANDS.filter((b) => b !== "Autre").map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setQ(""); set({ q: "" }); }}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            Réinitialiser
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
        <label className="flex items-center gap-1.5">
          Du <input type="date" aria-label="Date de début" value={params.get("from") ?? ""} onChange={(e) => set({ from: e.target.value })} className={inputClass} />
        </label>
        <label className="flex items-center gap-1.5">
          Au <input type="date" aria-label="Date de fin" value={params.get("to") ?? ""} onChange={(e) => set({ to: e.target.value })} className={inputClass} />
        </label>
        <span className="ml-auto font-semibold">
          {pending ? "Chargement…" : `${total} résultat${total > 1 ? "s" : ""}`}
        </span>
      </div>
    </div>
  );
}

