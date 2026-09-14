"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction, testSmtpAction } from "@/app/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900";

export interface SmtpValues {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  smtp_secure: string;
}

export function SmtpForm({ values }: { values: SmtpValues }) {
  const [local, setLocal] = useState(values);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  function set<K extends keyof SmtpValues>(key: K, value: string) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await updateSettingsAction({ ...local });
      if (!res.ok) {
        toast.error(res.error ?? "Erreur.");
        return;
      }
      toast.success("SMTP enregistré.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      await save();
      const res = await testSmtpAction();
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
          Hôte SMTP
          <input value={local.smtp_host} onChange={(e) => set("smtp_host", e.target.value)} placeholder="ssl0.ovh.net" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
          Port
          <input value={local.smtp_port} onChange={(e) => set("smtp_port", e.target.value)} placeholder="587" inputMode="numeric" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
          Utilisateur
          <input value={local.smtp_user} onChange={(e) => set("smtp_user", e.target.value)} placeholder="contact@palpiauto.com" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
          Mot de passe
          <input type="password" value={local.smtp_pass} onChange={(e) => set("smtp_pass", e.target.value)} placeholder="••••••••" autoComplete="new-password" className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-zinc-700">
          Expéditeur (From)
          <input value={local.smtp_from} onChange={(e) => set("smtp_from", e.target.value)} placeholder="contact@palpiauto.com" className={inputClass} />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <input type="checkbox" checked={local.smtp_secure === "true"} onChange={(e) => set("smtp_secure", e.target.checked ? "true" : "false")} />
          Connexion sécurisée (SSL/TLS)
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60">
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button type="button" onClick={test} disabled={testing} className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60">
          {testing ? "Vérification…" : "Enregistrer et tester"}
        </button>
      </div>
    </div>
  );
}
