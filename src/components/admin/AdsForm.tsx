"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateAdSlotAction, updateSettingsAction } from "@/app/actions";
import { uploadImageFile } from "@/lib/upload";
import { AD_SLOTS, type AdSlotData } from "@/lib/settings";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

function AdRow({ initial, globalEnabled }: { initial: AdSlotData; globalEnabled: boolean }) {
  const def = AD_SLOTS.find((d) => d.slot === initial.slot);
  const [title, setTitle] = useState(initial.title);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [linkUrl, setLinkUrl] = useState(initial.linkUrl);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await updateAdSlotAction({ slot: initial.slot, title, imageUrl, linkUrl, enabled });
      if (!res.ok) {
        toast.error(res.error ?? "Erreur.");
        return;
      }
      toast.success("Emplacement enregistré.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde (2 Mo max).");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImageFile(file);
      setImageUrl(url);
      toast.success("Image envoyée, pensez à Enregistrer cet emplacement.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'envoi de l'image.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <li className="border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-zinc-900">{def?.label ?? initial.slot}</p>
          <p className="text-xs text-zinc-500">{def?.hint}</p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-zinc-700">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Activé
        </label>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-600">
          Titre (alt)
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo pneus…" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-zinc-600">
          Lien au clic (optionnel)
          <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" className={inputClass} />
        </label>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs font-semibold text-zinc-600">
        Image (URL ou upload)
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…/pub.png ou /pubs/pub.png" className={inputClass} />
      </label>
      {imageUrl && !globalEnabled ? (
        <p className="mt-1 px-1 text-xs font-semibold text-amber-600">
          Image prête, mais les publicités sont désactivées globalement : cochez l&apos;interrupteur ci-dessus.
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <input type="file" accept="image/*" disabled={uploading} aria-label={`Image ${initial.slot}`} onChange={(e) => onFile(e.target.files?.[0])} className="text-xs text-zinc-600" />
        {uploading ? <span className="text-xs text-zinc-500">Envoi en cours…</span> : null}
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={`Aperçu ${initial.slot}`} className="h-12 w-auto object-contain" />
        ) : null}
        <button type="button" onClick={save} disabled={saving} className="ml-auto rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-60">
          {saving ? "…" : "Enregistrer cet emplacement"}
        </button>
      </div>
    </li>
  );
}

export function AdsForm({ slots, adsEnabled }: { slots: AdSlotData[]; adsEnabled: boolean }) {
  const [enabled, setEnabled] = useState(adsEnabled);
  const [saving, setSaving] = useState(false);

  async function toggle(value: boolean) {
    setEnabled(value);
    setSaving(true);
    try {
      const res = await updateSettingsAction({ ads_enabled: value ? "true" : "false" });
      if (!res.ok) toast.error(res.error ?? "Erreur.");
      else toast.success(value ? "Publicités activées." : "Publicités désactivées.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2 text-sm font-bold text-zinc-900">
        <input type="checkbox" checked={enabled} disabled={saving} onChange={(e) => toggle(e.target.checked)} />
        Afficher les publicités sur /commande
      </label>
      <ul className="flex flex-col gap-3">
        {slots.map((s) => (
          <AdRow key={s.slot} initial={s} globalEnabled={enabled} />
        ))}
      </ul>
      <p className="text-xs text-zinc-500">
        Desktop : bandeau haut sous le header + colonne latérale à droite. Mobile : encart milieu de page + bandeau bas collé.
      </p>
    </div>
  );
}
