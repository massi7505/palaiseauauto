"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none focus:border-zinc-900";

export function MessageForm({ customMessage }: { customMessage: string }) {
  const [custom_message, setCustomMessage] = useState(customMessage);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({ custom_message });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("Message enregistré.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message-custom" className="px-1 text-sm font-semibold text-zinc-700">
          Message affiché sous le formulaire
        </label>
        <textarea
          id="message-custom"
          value={custom_message}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Message optionnel pour les clients"
          rows={3}
          className={inputClass + " min-h-20 resize-y"}
        />
        <p className="px-1 text-xs text-zinc-500">Laissez vide pour ne rien afficher.</p>
      </div>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer le message"}
        </button>
      </div>
    </form>
  );
}
