import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  buildAutoReply,
  formatOpeningHours,
  getAllSettings,
  getWhatsAppApiConfig,
  parseOpeningHoursJson,
  parseWebhookMessages,
  sendWhatsAppTextMessage,
} from "@/lib/settings";

// Vérification du webhook par Meta (GET avec hub.mode / hub.verify_token / hub.challenge).
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  const cfg = await getWhatsAppApiConfig();
  if (mode === "subscribe" && token && challenge && token === cfg.verifyToken && cfg.verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ ok: false, error: "Vérification refusée." }, { status: 403 });
}

function isValidMetaSignature(raw: string, signature: string | null, appSecret: string): boolean {
  // Sans APP_SECRET configuré on accepte (mode test / dev local).
  if (!appSecret) return true;
  if (!signature || !signature.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", appSecret).update(raw, "utf8").digest("hex");
  const a = Buffer.from(signature.slice("sha256=".length), "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// Réception des messages clients (POST Meta) + réponse auto IA si activée.
export async function POST(req: Request): Promise<NextResponse> {
  // On lit le corps brut pour vérifier la signature Meta avant de parser.
  const raw = await req.text().catch(() => "");
  const appSecret = (process.env.WHATSAPP_APP_SECRET ?? "").trim();
  const signature = req.headers.get("x-hub-signature-256");
  if (!isValidMetaSignature(raw, signature, appSecret)) {
    return NextResponse.json({ ok: false, error: "Signature invalide." }, { status: 403 });
  }
  let payload: unknown = null;
  try {
    payload = raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return NextResponse.json({ ok: true });
  }
  const incoming = parseWebhookMessages(payload);
  if (incoming.length === 0) return NextResponse.json({ ok: true });

  const [settings, cfg] = await Promise.all([getAllSettings(), getWhatsAppApiConfig()]);
  if (!cfg.aiEnabled) return NextResponse.json({ ok: true });

  const brandName = settings.company_name?.trim() || settings.brand_name;
  const openingHoursText = formatOpeningHours(
    parseOpeningHoursJson(settings.opening_hours_json ?? ""),
    settings.opening_hours
  );
  for (const msg of incoming) {
    // Anti-boucle : on ne répond jamais deux fois au même message Meta.
    try {
      const { prisma } = await import("@/lib/prisma");
      const already = await prisma.setting.findUnique({
        where: { key: `wa_replied_${msg.messageId}` },
      });
      if (already) continue;
      const reply = buildAutoReply(msg.text, {
        brandName,
        garagePhone: settings.garage_phone,
        address: settings.address,
        openingHoursText,
        customPrompt: cfg.aiPrompt,
      });
      const sent = await sendWhatsAppTextMessage({ to: msg.from, body: reply });
      if (sent.ok && msg.messageId) {
        await prisma.setting.upsert({
          where: { key: `wa_replied_${msg.messageId}` },
          update: { value: new Date().toISOString() },
          create: { key: `wa_replied_${msg.messageId}`, value: new Date().toISOString() },
        });
      }
    } catch {
      // En cas de souci DB on tente quand même l'envoi (mode dégradé).
      const reply = buildAutoReply(msg.text, {
        brandName,
        garagePhone: settings.garage_phone,
        address: settings.address,
        openingHoursText,
        customPrompt: cfg.aiPrompt,
      });
      await sendWhatsAppTextMessage({ to: msg.from, body: reply });
    }
  }
  return NextResponse.json({ ok: true });
}
