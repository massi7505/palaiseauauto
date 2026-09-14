"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";
import { uploadImageFile } from "@/lib/upload";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none focus:border-zinc-900";

function isLegacyDataUrl(v: string): boolean {
  return v.startsWith("data:");
}

export function BrandingForm({ logoUrl, faviconUrl }: { logoUrl: string; faviconUrl: string }) {
  const [logo_url, setLogoUrl] = useState(logoUrl);
  const [favicon_url, setFaviconUrl] = useState(faviconUrl);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({ logo_url, favicon_url });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("Logo et favicon enregistrés. Rechargez la page /commande pour vérifier.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogoFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo trop lourd (2 Mo max).");
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadImageFile(file);
      setLogoUrl(url);
      toast.success("Logo envoyé, pensez à Enregistrer.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi du logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onFaviconFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Favicon trop lourd (2 Mo max).");
      return;
    }
    setUploadingFavicon(true);
    try {
      const url = await uploadImageFile(file);
      setFaviconUrl(url);
      toast.success("Favicon envoyé, pensez à Enregistrer.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de l'envoi du favicon.");
    } finally {
      setUploadingFavicon(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="branding-logo" className="px-1 text-sm font-semibold text-zinc-700">
            Logo (URL ou upload)
          </label>
          <input
            id="branding-logo"
            value={logo_url}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://…/logo.png ou /uploads/logo.png"
            className={inputClass}
          />
          <input
            type="file"
            accept="image/*"
            disabled={uploadingLogo}
            aria-label="Uploader un logo"
            onChange={(e) => onLogoFile(e.target.files?.[0])}
            className="text-xs text-zinc-600"
          />
          {uploadingLogo ? <p className="px-1 text-xs text-zinc-500">Envoi en cours…</p> : null}
          {logo_url && !isLegacyDataUrl(logo_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo_url} alt="Aperçu du logo" className="mt-1 h-10 w-auto self-start object-contain" />
          ) : null}
          {logo_url && isLegacyDataUrl(logo_url) ? (
            <p className="px-1 text-xs font-semibold text-amber-600">
              Ancien format trop lourd : re-uploadez le fichier via le bouton ci-dessus.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="branding-favicon" className="px-1 text-sm font-semibold text-zinc-700">
            Favicon (URL ou upload)
          </label>
          <input
            id="branding-favicon"
            value={favicon_url}
            onChange={(e) => setFaviconUrl(e.target.value)}
            placeholder="https://…/favicon.ico ou /uploads/favicon.png"
            className={inputClass}
          />
          <input
            type="file"
            accept="image/*,.ico"
            disabled={uploadingFavicon}
            aria-label="Uploader un favicon"
            onChange={(e) => onFaviconFile(e.target.files?.[0])}
            className="text-xs text-zinc-600"
          />
          {uploadingFavicon ? <p className="px-1 text-xs text-zinc-500">Envoi en cours…</p> : null}
          <p className="px-1 text-xs text-zinc-500">PNG ou ICO carré, via upload (2 Mo max).</p>
          {favicon_url && isLegacyDataUrl(favicon_url) ? (
            <p className="px-1 text-xs font-semibold text-amber-600">
              Ancien format trop lourd : re-uploadez le fichier via le bouton ci-dessus.
            </p>
          ) : null}
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer le logo et le favicon"}
        </button>
      </div>
    </form>
  );
}
