import { prisma } from "@/lib/prisma";

const DEFAULTS = {
  whatsapp_phone: "33601639959",
  garage_phone: "06 01 63 99 59",
  brand_name: "PalpiAuto",
  // Couleur d'accent du site (boutons, liens) — hexadécimal, ex : #b91c1c.
  accent_color: "#b91c1c",
  // reCAPTCHA v3 (Google) : clés + interrupteur.
  recaptcha_site_key: "",
  recaptcha_secret_key: "",
  recaptcha_enabled: "false",
  opening_hours: "",
  address: "",
  custom_message: "",
  theme: "light",
  // Identité
  logo_url: "",
  favicon_url: "",
  company_name: "",
  contact_email: "",
  // SMTP (envoi d'e-mails)
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  smtp_secure: "false",
  // Horaires par jour : JSON { "lundi": [{"open":"08:00","close":"12:00"}, ...] | "closed", ... }
  // Exemple jeudi : matin 08:00-12:00 puis fermé l'après-midi. Dimanche : "closed".
  opening_hours_json: "",
  // Publicités : interrupteur global + HTML/image par emplacement
  ads_enabled: "false",
  // WhatsApp Cloud API (Meta) : IDs modifiables depuis /admin/settings.
  // Le token secret reste dans .env (WHATSAPP_API_TOKEN), jamais en base.
  whatsapp_phone_id: "",
  whatsapp_business_id: "",
  whatsapp_mode: "test",
  whatsapp_ai_enabled: "false",
  whatsapp_ai_prompt: "",
} as const;

export type SettingKey = keyof typeof DEFAULTS;

export async function getAllSettings() {
  const stored = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });
  const map = new Map(stored.map(s => [s.key, s.value]));
  const result = { ...DEFAULTS } as Record<string, string>;
  for (const key of Object.keys(DEFAULTS)) {
    if (map.has(key)) {
      result[key] = map.get(key)!;
    }
  }
  // Anciennes clés éventuelles encore en base (sidebar_ads_html, etc.)
  for (const [key, value] of map) {
    if (!(key in result)) result[key] = value;
  }
  return result;
}

export async function getSetting(key: SettingKey, fallback?: string) {
  const stored = await prisma.setting.findUnique({ where: { key } });
  return stored?.value ?? fallback ?? DEFAULTS[key];
}

export async function updateSetting(key: SettingKey, value: string) {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

// Lecture directe (sans cache persistant) : les réglages changent souvent
// (logo, pubs) et doivent être visibles immédiatement sur /commande après Enregistrer.
export async function getSettingsCached() {
  return getAllSettings();
}

export const DAY_KEYS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export interface DaySlot {
  open: string;
  close: string;
}

export type OpeningHoursMap = Record<DayKey, DaySlot[] | "closed">;

export function parseOpeningHoursJson(raw: string): OpeningHoursMap | null {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Record<string, unknown>>;
    const out = {} as OpeningHoursMap;
    for (const day of DAY_KEYS) {
      const v = parsed[day];
      if (v === "closed" || v === "ferme" || v === "fermé") {
        out[day] = "closed";
        continue;
      }
      if (!Array.isArray(v)) return null;
      const slots: DaySlot[] = [];
      for (const s of v) {
        if (
          typeof s !== "object" ||
          s === null ||
          typeof (s as DaySlot).open !== "string" ||
          typeof (s as DaySlot).close !== "string"
        ) {
          return null;
        }
        slots.push({
          open: (s as DaySlot).open,
          close: (s as DaySlot).close,
        });
      }
      out[day] = slots;
    }
    return out;
  } catch {
    return null;
  }
}

function fmtHour(h: string): string {
  const m = h.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return h;
  return `${m[1].padStart(2, "0")}h${m[2] === "00" ? "" : m[2]}`;
}

export function formatOpeningHours(map: OpeningHoursMap | null, fallback: string): string {
  if (!map) return fallback;
  const lines: string[] = [];
  for (const day of DAY_KEYS) {
    const v = map[day];
    const label = day.charAt(0).toUpperCase() + day.slice(1);
    if (v === "closed" || v.length === 0) {
      lines.push(`${label} : fermé`);
    } else {
      lines.push(`${label} : ${v.map((s) => `${fmtHour(s.open)} - ${fmtHour(s.close)}`).join(" puis ")}`);
    }
  }
  return lines.join("\n");
}

// ============================================================
// WhatsApp Cloud API (Meta) + réponse automatique "IA"
// ------------------------------------------------------------
// Le token Meta (WHATSAPP_API_TOKEN) et le token de vérification
// (WHATSAPP_VERIFY_TOKEN) restent dans `.env` et ne sont JAMAIS
// stockés en base ni affichés dans l'admin.
// Les réglages non secrets (IDs, mode test/prod, prompt) sont en base.
// ============================================================

export interface WhatsAppApiConfig {
  token: string;
  phoneId: string;
  businessId: string;
  verifyToken: string;
  mode: "test" | "prod";
  aiEnabled: boolean;
  aiPrompt: string;
}

export async function getWhatsAppApiConfig(): Promise<WhatsAppApiConfig> {
  const s = await getAllSettings();
  const mode = s.whatsapp_mode === "prod" ? "prod" : "test";
  return {
    token: (process.env.WHATSAPP_API_TOKEN ?? "").trim(),
    phoneId: (s.whatsapp_phone_id ?? "").trim(),
    businessId: (s.whatsapp_business_id ?? "").trim(),
    verifyToken: (process.env.WHATSAPP_VERIFY_TOKEN ?? "").trim(),
    mode,
    aiEnabled: s.whatsapp_ai_enabled === "true",
    aiPrompt: (s.whatsapp_ai_prompt ?? "").trim(),
  };
}

/** Construit la réponse automatique à partir du message client (règles garage + prompt admin). */
export function buildAutoReply(
  incoming: string,
  settings: {
    brandName: string;
    garagePhone: string;
    address: string;
    openingHoursText: string;
    customPrompt: string;
  }
): string {
  const text = incoming.toLowerCase();
  const lines = [
    `Bonjour, ici ${settings.brandName}. Merci pour votre message.`,
  ];

  const wantsHours = /horaire|ouvert|ferm|heure|quand|disponib/.test(text);
  const wantsAddress = /adresse|où|ou |situ|venir|plan|palaiseau/.test(text);
  const wantsPrice = /prix|tarif|combien|coût|cout|devis/.test(text);
  const wantsPart = /pièce|piece|pneu|frein|moteur|commande|stock|dispo/.test(text);

  if (wantsHours && settings.openingHoursText) {
    lines.push(`Nos horaires :\n${settings.openingHoursText}`);
  }
  if (wantsAddress && settings.address) {
    lines.push(`Adresse : ${settings.address}`);
  }
  if (wantsPrice) {
    lines.push(
      "Pour un tarif précis, indiquez marque, modèle, immatriculation et la pièce recherchée : on vous répond avec le prix et le délai."
    );
  }
  if (wantsPart) {
    lines.push(
      "Pour vérifier la disponibilité, envoyez-nous : marque + modèle + immatriculation + pièce recherchée (ou faites la demande sur /commande)."
    );
  }
  if (lines.length === 1) {
    lines.push(
      "Dites-nous : marque, modèle, immatriculation et pièce recherchée, et on vous répond vite avec prix et délai."
    );
  }
  if (settings.customPrompt) {
    lines.push(settings.customPrompt);
  }
  lines.push(`Tél : ${settings.garagePhone} — réponse humaine aux heures d'ouverture.`);
  return lines.join("\n\n");
}

export async function sendWhatsAppTextMessage(opts: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; error?: string }> {
  const cfg = await getWhatsAppApiConfig();
  if (!cfg.token) {
    return { ok: false, error: "Token WhatsApp manquant : renseignez WHATSAPP_API_TOKEN dans .env puis redémarrez." };
  }
  if (!cfg.phoneId) {
    return { ok: false, error: "Phone Number ID manquant : renseignez-le dans /admin/settings > WhatsApp." };
  }
  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(cfg.phoneId)}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: opts.to,
        type: "text",
        text: { body: opts.body.slice(0, 4000), preview_url: false },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { ok: false, error: `Meta a refusé l'envoi (${res.status}) : ${detail.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Envoi WhatsApp impossible." };
  }
}

export interface IncomingWhatsAppMessage {
  from: string;
  text: string;
  messageId: string;
}

/** Extrait les messages texte entrants d'un payload webhook Meta. */
export function parseWebhookMessages(payload: unknown): IncomingWhatsAppMessage[] {
  const out: IncomingWhatsAppMessage[] = [];
  try {
    const p = payload as {
      entry?: Array<{
        changes?: Array<{ value?: { messages?: Array<{ from?: string; id?: string; type?: string; text?: { body?: string } }> } }>;
      }>;
    };
    for (const entry of p.entry ?? []) {
      for (const change of entry.changes ?? []) {
        for (const msg of change.value?.messages ?? []) {
          if (msg.type === "text" && msg.from && msg.text?.body) {
            out.push({ from: msg.from, text: msg.text.body, messageId: msg.id ?? "" });
          }
        }
      }
    }
  } catch {
    // payload inattendu : on ignore
  }
  return out;
}

/** Vérifie un token reCAPTCHA (v2 ou v3) côté serveur via Google. */
export async function verifyRecaptchaToken(
  token: string,
  opts?: { minScore?: number; expectedAction?: string }
): Promise<{ ok: boolean; error?: string }> {
  const s = await getAllSettings();
  const enabled = s.recaptcha_enabled === "true";
  // La clé secrète peut venir de la base (/admin/settings) ou de l'env (Vercel).
  const secret = (s.recaptcha_secret_key ?? "").trim() || (process.env.RECAPTCHA_SECRET_KEY ?? "").trim();
  // Si le captcha est désactivé ou non configuré, on laisse passer (mode dev).
  if (!enabled || !secret) return { ok: true };
  if (!token) return { ok: false, error: "Vérification anti-robot manquante, veuillez réessayer." };
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });
    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      score?: number;
      action?: string;
      hostname?: string;
      ["error-codes"]?: string[];
    } | null;
    if (!data?.success) {
      const codes = (data?.["error-codes"] ?? []).join(", ");
      return { ok: false, error: `Échec de la vérification anti-robot${codes ? ` (${codes})` : ""}.` };
    }
    // reCAPTCHA v3 : on exige un score suffisant + la bonne action si fournis.
    if (typeof data.score === "number" && data.score < (opts?.minScore ?? 0.4)) {
      return { ok: false, error: "Activité suspecte détectée, veuillez réessayer." };
    }
    if (opts?.expectedAction && data.action && data.action !== opts.expectedAction) {
      return { ok: false, error: "Vérification anti-robot invalide, veuillez réessayer." };
    }
    return { ok: true };
  } catch {
    // Google injoignable : on laisse passer pour ne pas bloquer les clients.
    return { ok: true };
  }
}

export interface AdSlotData {
  id: string;
  slot: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  enabled: boolean;
}
export const AD_SLOTS = [
  {
    slot: "leaderboard_top",
    label: "Bandeau haut (desktop)",
    hint: "Sous le header de /commande, masqué sur mobile. Format conseillé : 970x90 ou 728x90.",
  },
  {
    slot: "sidebar_right",
    label: "Colonne latérale (desktop)",
    hint: "À droite du formulaire sur grand écran. Format conseillé : 300x250 ou 300x600.",
  },
  {
    slot: "in_feed",
    label: "Encart milieu de page (ordi + mobile)",
    hint: "Entre le formulaire et le bloc contact. Visible partout.",
  },
  {
    slot: "mobile_sticky",
    label: "Bandeau bas (mobile uniquement)",
    hint: "Collé en bas de l'écran sur téléphone. Format conseillé : 320x50 ou 320x100.",
  },
] as const;

export type AdSlotKey = (typeof AD_SLOTS)[number]["slot"];

export async function getAdSlots(): Promise<AdSlotData[]> {
  const rows = await prisma.adSlot.findMany({ orderBy: { slot: "asc" } });
  const bySlot = new Map(rows.map((r) => [r.slot, r]));
  return AD_SLOTS.map((def) => {
    const row = bySlot.get(def.slot);
    return {
      id: row?.id ?? "",
      slot: def.slot,
      title: row?.title ?? "",
      imageUrl: row?.imageUrl ?? "",
      linkUrl: row?.linkUrl ?? "",
      enabled: row?.enabled ?? false,
    };
  });
}

export async function getActiveAds(): Promise<Record<AdSlotKey, AdSlotData | null>> {
  const rows = await prisma.adSlot.findMany({ where: { enabled: true } });
  const out = {
    leaderboard_top: null,
    sidebar_right: null,
    in_feed: null,
    mobile_sticky: null,
  } as Record<AdSlotKey, AdSlotData | null>;
  for (const r of rows) {
    if (r.slot in out && (r.imageUrl || r.title)) {
      (out as Record<string, AdSlotData | null>)[r.slot] = {
        id: r.id,
        slot: r.slot,
        title: r.title,
        imageUrl: r.imageUrl,
        linkUrl: r.linkUrl,
        enabled: r.enabled,
      };
    }
  }
  return out;
}

