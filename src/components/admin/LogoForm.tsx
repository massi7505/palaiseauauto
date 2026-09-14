"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";
import { uploadImageFile } from "@/lib/upload";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

export function LogoForm({ logoUrl }: { logoUrl: string }) {
  const [url, setUrl] = useState(logoUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const legacy = url.startsWith("data:");

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo trop lourd (2 Mo max).");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadImageFile(file);
      setUrl(uploaded);
      toast.success("Logo envoyé, pensez à Enregistrer.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'envoi du logo.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({ logo_url: url });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("Logo enregistré. Rechargez /commande pour vérifier.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="logo-url" className="px-1 text-sm font-semibold text-zinc-700">
          Logo (URL ou upload)
        </label>
        <input
          id="logo-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/logo.png ou /uploads/logo.png"
          className={inputClass}
        />
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          aria-label="Uploader un logo"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="text-xs text-zinc-600"
        />
        {uploading ? <p className="px-1 text-xs text-zinc-500">Envoi en cours…</p> : null}
        {url && !legacy ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Aperçu du logo" className="mt-1 h-12 w-auto self-start object-contain" />
        ) : null}
        {legacy ? (
          <p className="px-1 text-xs font-semibold text-amber-600">
            Ancien format trop lourd : re-uploadez le fichier via le bouton ci-dessus.
          </p>
        ) : null}
      </div>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer le logo"}
        </button>
      </div>
    </form>
  );
}
