
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none focus:border-zinc-900";

export interface WhatsAppFormValues {
  whatsapp_phone_id: string;
  whatsapp_business_id: string;
  whatsapp_mode: string;
  whatsapp_ai_enabled: string;
  whatsapp_ai_prompt: string;
}

export function WhatsAppForm({
  values,
  tokenConfigured,
}: {
  values: WhatsAppFormValues;
  tokenConfigured: boolean;
}) {
  const [phoneId, setPhoneId] = useState(values.whatsapp_phone_id);
  const [businessId, setBusinessId] = useState(values.whatsapp_business_id);
  const [mode, setMode] = useState(values.whatsapp_mode === "prod" ? "prod" : "test");
  const [aiEnabled, setAiEnabled] = useState(values.whatsapp_ai_enabled === "true");
  const [prompt, setPrompt] = useState(values.whatsapp_ai_prompt);
  const [templateName, setTemplateName] = useState("hello_world");
  const [templateLang, setTemplateLang] = useState("en_US");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({
        whatsapp_phone_id: phoneId.trim(),
        whatsapp_business_id: businessId.trim(),
        whatsapp_mode: mode,
        whatsapp_ai_enabled: aiEnabled ? "true" : "false",
        whatsapp_ai_prompt: prompt,
      });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("WhatsApp enregistré.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    const dest = to.replace(/[^0-9]/g, "");
    if (!/^[0-9]{8,15}$/.test(dest)) {
      toast.error("Numéro invalide : 8 à 15 chiffres (ex : 33783304901).");
      return;
    }
    setTesting(true);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: dest, template: templateName.trim(), language: templateLang.trim() || "en_US" }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; kind?: string; error?: string } | null;
      if (!res.ok || !data?.ok) toast.error(data?.error ?? "Échec de l'envoi test.");
      else if (data.kind === "template") toast.success("Template envoyé via l'API Meta (hors fenêtre 24h).");
      else toast.success("Message test envoyé via l'API Meta.");
    } catch {
      toast.error("Échec de l'envoi test.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className={`rounded-lg border px-3 py-2 text-xs font-semibold ${tokenConfigured ? "border-green-300 bg-green-50 text-green-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
        {tokenConfigured
          ? "Token Meta détecté dans .env (WHATSAPP_API_TOKEN). Prêt pour le mode test."
          : "Token Meta manquant : ajoutez WHATSAPP_API_TOKEN dans .env puis redémarrez. Sans token, seul le bouton WhatsApp du site fonctionne."}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wa-phone-id" className="px-1 text-sm font-semibold text-zinc-700">
            Phone Number ID (test)
          </label>
          <input
            id="wa-phone-id"
            value={phoneId}
            onChange={(e) => setPhoneId(e.target.value)}
            placeholder="1286370141229167"
            inputMode="numeric"
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wa-business-id" className="px-1 text-sm font-semibold text-zinc-700">
            WhatsApp Business Account ID
          </label>
          <input
            id="wa-business-id"
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            placeholder="1592890272109517"
            inputMode="numeric"
            autoComplete="off"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <input
            type="checkbox"
            checked={mode === "test"}
            onChange={(e) => setMode(e.target.checked ? "test" : "prod")}
          />
          Mode test (numéro +1 555 181-0387)
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
          <input
            type="checkbox"
            checked={aiEnabled}
            onChange={(e) => setAiEnabled(e.target.checked)}
          />
          Réponse automatique IA activée
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="wa-prompt" className="px-1 text-sm font-semibold text-zinc-700">
          Consigne ajoutée à chaque réponse auto (optionnel)
        </label>
        <textarea
          id="wa-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex : propose un créneau de rappel le matin…"
          rows={2}
          className={inputClass + " min-h-16 resize-y"}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wa-to" className="px-1 text-sm font-semibold text-zinc-700">
            Destinataire test
          </label>
          <input
            id="wa-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="33783304901"
            inputMode="numeric"
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wa-template" className="px-1 text-sm font-semibold text-zinc-700">
            Template (si hors fenêtre 24h)
          </label>
          <input
            id="wa-template"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="hello_world"
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wa-lang" className="px-1 text-sm font-semibold text-zinc-700">
            Langue du template
          </label>
          <input
            id="wa-lang"
            value={templateLang}
            onChange={(e) => setTemplateLang(e.target.value)}
            placeholder="en_US"
            autoComplete="off"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving ? "Enregistrement…" : "Enregistrer WhatsApp"}
        </button>
        <button
          type="button"
          onClick={sendTest}
          disabled={testing}
          className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60"
        >
          {testing ? "Envoi…" : "Envoyer un message test"}
        </button>
      </div>
      <p className="px-1 text-xs text-zinc-500">
        Webhook Meta : {"{URL_PUBLIQUE}"}/api/webhooks/whatsapp (événement messages).
        En local, exposez le port 3000 (ngrok) car Meta ne joint pas localhost.
      </p>
    </form>
  );
}
