"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";

const PRESETS = ["#b91c1c", "#1d4ed8", "#047857", "#b45309", "#6d28d9", "#0f172a"];

export function AccentForm({ accentColor }: { accentColor: string }) {
  const [color, setColor] = useState(/^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#b91c1c");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!/^#[0-9a-fA-F]{6}$/.test(color.trim())) {
      toast.error("Couleur invalide (format #rrggbb).");
      return;
    }
    setSaving(true);
    try {
      const res = await updateSettingsAction({ accent_color: color.trim() });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("Couleur enregistrée.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Couleur d'accent"
          className="h-11 w-16 cursor-pointer rounded-lg border border-zinc-300 bg-white p-1"
        />
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#b91c1c"
          aria-label="Code couleur hexadécimal"
          className="w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-900"
        />
        <span
          aria-hidden
          className="rounded-lg px-4 py-2 text-sm font-bold text-white"
          style={{ backgroundColor: color }}
        >
          Aperçu bouton
        </span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Couleurs prédéfinies">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setColor(p)}
            aria-label={`Choisir ${p}`}
            className={`h-8 w-8 rounded-full border-2 ${p === color ? "border-zinc-900" : "border-white shadow"}`}
            style={{ backgroundColor: p }}
          />
        ))}
      </div>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer la couleur"}
        </button>
      </div>
      <p className="px-1 text-xs text-zinc-500">
        Utilisée pour le bouton principal et les liens de /commande (défaut : rouge garage #b91c1c).
      </p>
    </form>
  );
}
