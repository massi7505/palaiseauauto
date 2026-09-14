"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none focus:border-zinc-900";

export function IdentityForm({ brandName, companyName }: { brandName: string; companyName: string }) {
  const [brand_name, setBrandName] = useState(brandName);
  const [company_name, setCompanyName] = useState(companyName);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({ brand_name, company_name });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("Identité enregistrée.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identity-brand" className="px-1 text-sm font-semibold text-zinc-700">
            Nom court (header)
          </label>
          <input
            id="identity-brand"
            value={brand_name}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="PalpiAuto"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="identity-company" className="px-1 text-sm font-semibold text-zinc-700">
            Nom de l&apos;entreprise
          </label>
          <input
            id="identity-company"
            value={company_name}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Palaiseau Pièces Auto"
            className={inputClass}
          />
          <p className="px-1 text-xs text-zinc-500">Utilisé dans le titre du site et le header.</p>
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer l'identité"}
        </button>
      </div>
    </form>
  );
}
