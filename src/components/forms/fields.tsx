"use client";

import type { ReactNode } from "react";
import {
  PART_CATEGORIES,
  PART_CATEGORY_LABELS,
  VEHICLE_BRANDS,
} from "@/lib/validations/order.schema";
import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900";

export function TextFieldWrapper(p: { label: string; error?: string; name: string; children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label className="px-1 text-sm font-semibold text-zinc-700">
        {p.label} <span aria-hidden className="text-red-600">*</span>
      </label>
      {p.children}
      {p.error ? <p className="px-1 text-xs font-medium text-red-600">{p.error}</p> : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BrandField(p: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor="vehicleBrand" className="px-1 text-sm font-semibold text-zinc-700">
        Marque du véhicule <span aria-hidden className="text-red-600">*</span>
      </label>
      <div className="relative">
        <input
          id="vehicleBrand"
          list="vehicle-brands"
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
          placeholder="Renault, Peugeot…"
          autoComplete="off"
          aria-label="Marque du véhicule"
          className={cn(inputClass, "pr-10", p.error && "border-red-500")}
        />
        <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400">
          <Chevron />
        </span>
      </div>
      <datalist id="vehicle-brands">
        {VEHICLE_BRANDS.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      {p.error ? <span className="px-1 text-xs font-medium text-red-600">{p.error}</span> : null}
    </div>
  );
}

export function CategoryField(p: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor="partCategory" className="px-1 text-sm font-semibold text-zinc-700">
        Catégorie de pièce <span aria-hidden className="text-red-600">*</span>
      </label>
      <div className="relative">
        <select
          id="partCategory"
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
          aria-label="Catégorie de pièce recherchée"
          className={cn(inputClass, "appearance-none pr-10", !p.value && "text-zinc-400", p.error && "border-red-500")}
        >
          <option value="">Choisir une catégorie…</option>
          {PART_CATEGORIES.map((c) => (
            <option key={c} value={c}>{PART_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400">
          <Chevron />
        </span>
      </div>
      {p.error ? <span className="px-1 text-xs font-medium text-red-600">{p.error}</span> : null}
    </div>
  );
}
