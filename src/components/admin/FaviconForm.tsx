"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";
import { uploadImageFile } from "@/lib/upload";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

export function FaviconForm({ faviconUrl }: { faviconUrl: string }) {
  const [url, setUrl] = useState(faviconUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const legacy = url.startsWith("data:");

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Favicon trop lourd (2 Mo max).");
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadImageFile(file);
      setUrl(uploaded);
      toast.success("Favicon envoyé, pensez à Enregistrer.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l'envoi du favicon.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({ favicon_url: url });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("Favicon enregistré. Rechargez l'onglet /commande pour vérifier.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="favicon-url" className="px-1 text-sm font-semibold text-zinc-700">
          Favicon (URL ou upload)
        </label>
        <input
          id="favicon-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/favicon.ico ou /uploads/favicon.png"
          className={inputClass}
        />
        <input
          type="file"
          accept="image/*,.ico"
          disabled={uploading}
          aria-label="Uploader un favicon"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="text-xs text-zinc-600"
        />
        {uploading ? <p className="px-1 text-xs text-zinc-500">Envoi en cours…</p> : null}
        <p className="px-1 text-xs text-zinc-500">PNG ou ICO carré, via upload (2 Mo max).</p>
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
          {saving ? "Enregistrement…" : "Enregistrer le favicon"}
        </button>
      </div>
    </form>
  );
}
