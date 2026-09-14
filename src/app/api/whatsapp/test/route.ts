import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  buildAutoReply,
  formatOpeningHours,
  getAllSettings,
  getWhatsAppApiConfig,
  parseOpeningHoursJson,
  sendWhatsAppTextMessage,
} from "@/lib/settings";

const TEMPLATE_NAME_MAX = 512;
const LANG_MAX = 16;

function isAuthorized(errorDetail: string): boolean {
  // Meta renvoie 401/403 quand le token est absent, expiré ou révoqué.
  return !/(^|[^0-9])(401|403)([^0-9]|$)/.test(errorDetail) && !/OAuthException/i.test(errorDetail);
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Non autorisé." }, { status: 401 });
  }
  let body: { to?: string; template?: string; language?: string };
  try {
    body = (await req.json()) as { to?: string; template?: string; language?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Corps JSON invalide." }, { status: 400 });
  }
  // Numéro E.164 sans "+" : 8 à 15 chiffres (recommandation Meta).
  const to = (body.to ?? "").replace(/[^0-9]/g, "");
  if (!/^[0-9]{8,15}$/.test(to)) {
    return NextResponse.json({ ok: false, error: "Numéro destinataire invalide (8 à 15 chiffres)." }, { status: 400 });
  }
  const template = (body.template ?? "").trim().slice(0, TEMPLATE_NAME_MAX);
  const language = (body.language ?? "fr").trim().slice(0, LANG_MAX) || "fr";

  const [settings, cfg] = await Promise.all([getAllSettings(), getWhatsAppApiConfig()]);
  if (!cfg.token) {
    return NextResponse.json(
      { ok: false, error: "Token WhatsApp manquant : renseignez WHATSAPP_API_TOKEN dans Vercel > Settings > Environment Variables puis redéployez." },
      { status: 500 }
    );
  }
  if (!cfg.phoneId) {
    return NextResponse.json(
      { ok: false, error: "Phone Number ID manquant : renseignez-le dans /admin/settings > WhatsApp (section 5)." },
      { status: 500 }
    );
  }

  // 1) Le client a écrit dans les dernières 24h ? Alors texte libre OK (test de connexion).
  const brandName = settings.company_name?.trim() || settings.brand_name;
  const reply = buildAutoReply("Bonjour, je teste la connexion WhatsApp.", {
    brandName,
    garagePhone: settings.garage_phone,
    address: settings.address,
    openingHoursText: formatOpeningHours(
      parseOpeningHoursJson(settings.opening_hours_json ?? ""),
      settings.opening_hours
    ),
    customPrompt: cfg.aiPrompt,
  });
  const textResult = await sendWhatsAppTextMessage({
    to,
    body: `[TEST ${cfg.mode.toUpperCase()}] ${reply}`,
  });
  if (textResult.ok) return NextResponse.json({ ok: true, kind: "text" });

  // 2) Fenêtre 24h fermée (erreur 131047) : on bascule sur le template Meta.
  // Sans template approuvé dans le compte, Meta renvoie 132000 : message explicite.
  if (!isAuthorized(textResult.error ?? "") && template) {
    return NextResponse.json({ ok: false, error: textResult.error }, { status: 502 });
  }
  if (!template) {
    return NextResponse.json(
      {
        ok: false,
        error: `${textResult.error ?? "Envoi texte refusé."} Hors fenêtre 24h : renseignez un nom de template approuvé (ex : hello_world) dans le formulaire puis renvoyez.`,
      },
      { status: 502 }
    );
  }
  try {
    const url = `https://graph.facebook.com/v25.0/${encodeURIComponent(cfg.phoneId)}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: { name: template, language: { code: language } },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        { ok: false, error: `Template refusé par Meta (${res.status}) : ${detail.slice(0, 300)}` },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, kind: "template" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Envoi WhatsApp impossible." },
      { status: 502 }
    );
  }
}
