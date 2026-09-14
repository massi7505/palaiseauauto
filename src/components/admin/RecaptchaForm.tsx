"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

export interface RecaptchaValues {
  recaptcha_site_key: string;
  recaptcha_secret_key: string;
  recaptcha_enabled: string;
}

export function RecaptchaForm({ values }: { values: RecaptchaValues }) {
  const [siteKey, setSiteKey] = useState(values.recaptcha_site_key);
  const [secretKey, setSecretKey] = useState(values.recaptcha_secret_key);
  const [enabled, setEnabled] = useState(values.recaptcha_enabled === "true");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({
        recaptcha_site_key: siteKey.trim(),
        recaptcha_secret_key: secretKey,
        recaptcha_enabled: enabled ? "true" : "false",
      });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("reCAPTCHA enregistré.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className={`rounded-lg border px-3 py-2 text-xs font-semibold ${enabled ? "border-green-300 bg-green-50 text-green-800" : "border-zinc-300 bg-zinc-50 text-zinc-600"}`}>
        {enabled
          ? "Protection activée : chaque demande est vérifiée côté serveur avant enregistrement."
          : "Protection désactivée : activez-la après avoir collé vos 2 clés Google."}
      </p>
      <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Activer le reCAPTCHA sur le formulaire
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rc-site" className="px-1 text-sm font-semibold text-zinc-700">
            Clé publique (site key)
          </label>
          <input
            id="rc-site"
            value={siteKey}
            onChange={(e) => setSiteKey(e.target.value)}
            placeholder="6Lc…"
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rc-secret" className="px-1 text-sm font-semibold text-zinc-700">
            Clé secrète (secret key)
          </label>
          <input
            id="rc-secret"
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="6Lc…"
            autoComplete="new-password"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer le reCAPTCHA"}
        </button>
      </div>
      <p className="px-1 text-xs text-zinc-500">
        Google reCAPTCHA : créez des clés v3 (invisible, recommandé) sur google.com/recaptcha/admin,
        type v3, domaine : votre domaine Vercel + localhost pour les tests.
      </p>
    </form>
  );
}
