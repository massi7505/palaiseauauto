"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  orderSchema,
  updateRequestSchema,
  type OrderFormValues,
} from "@/lib/validations/order.schema";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  getWhatsAppPhone,
} from "@/lib/whatsapp";
import { PART_CATEGORY_LABELS, FUEL_LABELS } from "@/lib/validations/order.schema";
import { normalizeEmail, normalizePhone } from "@/lib/customers";
import { verifyRecaptchaToken } from "@/lib/settings";

export interface SubmitOrderResult {
  ok: boolean;
  message: string;
  whatsappUrl?: string;
  requestId?: string;
  fieldErrors?: Partial<Record<keyof OrderFormValues, string>>;
}

export async function submitOrderAction(
  input: OrderFormValues,
): Promise<SubmitOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof OrderFormValues, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof OrderFormValues | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: "Veuillez corriger les champs en rouge.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const categoryLabel = PART_CATEGORY_LABELS[data.partCategory];

  // Anti-robot : vérifié côté serveur uniquement si activé dans /admin/settings.
  const captcha = await verifyRecaptchaToken(data.recaptchaToken, {
    minScore: 0.4,
    expectedAction: "order",
  });
  if (!captcha.ok) {
    return { ok: false, message: captcha.error ?? "Vérification anti-robot échouée." };
  }

  // Anti-spam : max 3 demandes / heure pour le même e-mail OU téléphone.
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.request.count({
      where: {
        createdAt: { gte: oneHourAgo },
        OR: [
          { customer: { email: { equals: data.email } } },
          { customer: { phone: { equals: data.phone } } },
        ],
      },
    });
    if (recent >= 3) {
      return {
        ok: false,
        message: "Vous avez déjà envoyé plusieurs demandes. Réessayez dans une heure ou appelez le garage.",
      };
    }
  } catch {
    // Si le comptage échoue, on continue (mieux que bloquer un vrai client).
  }

  try {
    // Client récurrent : on regroupe par e-mail normalisé OU téléphone normalisé.
    // Plusieurs fiches peuvent exister (ex : faute de frappe) : on rattache à la
    // fiche existante et la page /admin/settings > Clients regroupe l'affichage.
    const emailNorm = normalizeEmail(data.email);
    const phoneNorm = normalizePhone(data.phone);
    const allCustomers = await prisma.customer.findMany({
      select: { id: true, email: true, phone: true },
    });
    const existing = allCustomers.find(
      (c) => normalizeEmail(c.email) === emailNorm || normalizePhone(c.phone) === phoneNorm,
    );
    let customer = existing
      ? await prisma.customer.findUniqueOrThrow({ where: { id: existing.id } })
      : null;

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
        },
      });
    }

    const request = await prisma.request.create({
      data: {
        customerId: customer.id,
        vehicleBrand: data.vehicleBrand,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear ?? "",
        mileage: data.mileage ?? "",
        fuel: data.fuel ?? "",
        urgency: data.urgency,
        plateNumber: data.plateNumber,
        partCategory: data.partCategory,
        partDescription: data.partDescription,
        status: "NOUVEAU",
      },
    });

    const message = buildWhatsAppMessage({
      lastName: data.lastName,
      firstName: data.firstName,
      phone: data.phone,
      email: data.email,
      vehicleBrand: data.vehicleBrand,
      vehicleModel: data.vehicleModel,
      vehicleYear: data.vehicleYear || undefined,
      mileage: data.mileage || undefined,
      fuelLabel: data.fuel ? FUEL_LABELS[data.fuel] : undefined,
      urgent: data.urgency === "URGENTE",
      plateNumber: data.plateNumber,
      partCategoryLabel: categoryLabel,
      partDescription: data.partDescription,
    });
    const whatsappUrl = buildWhatsAppUrl(message, getWhatsAppPhone());

    revalidatePath("/admin");
    revalidatePath("/admin/requests");

    return {
      ok: true,
      message: "Votre demande a été envoyée, nous vous recontactons rapidement.",
      whatsappUrl,
      requestId: request.id,
    };
  } catch (error) {
    console.error("[submitOrderAction]", error);
    return {
      ok: false,
      message: "Une erreur est survenue. Réessayez dans un instant.",
    };
  }
}

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return !!session?.user && session.user.role === "ADMIN";
}

export async function updateRequestAction(input: {
  id: string;
  status?: "NOUVEAU" | "EN_COURS" | "TRAITE" | "ANNULE";
  visitDate?: string | null;
  internalNote?: string | null;
}): Promise<{ ok: boolean; message: string }> {
  if (!(await requireAdmin())) {
    return { ok: false, message: "Non autorisé." };
  }
  const parsed = updateRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Données invalides." };
  }
  const { id, status, visitDate, internalNote } = parsed.data;
  try {
    await prisma.request.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(visitDate !== undefined
          ? { visitDate: visitDate ? new Date(visitDate) : null }
          : {}),
        ...(internalNote !== undefined
          ? { internalNote: internalNote ?? "" }
          : {}),
      },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    revalidatePath(`/admin/requests/${id}`);
    return { ok: true, message: "Demande mise à jour." };
  } catch (error) {
    console.error("[updateRequestAction]", error);
    return { ok: false, message: "Mise à jour impossible." };
  }
}

export async function updateSettingsAction(values: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const allowedKeys = [
    "whatsapp_phone",
    "garage_phone",
    "brand_name",
    "company_name",
    "contact_email",
    "logo_url",
    "favicon_url",
    "opening_hours",
    "opening_hours_json",
    "address",
    "custom_message",
    "theme",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "smtp_from",
    "smtp_secure",
    "ads_enabled",
    "accent_color",
    "recaptcha_site_key",
    "recaptcha_secret_key",
    "recaptcha_enabled",
    "whatsapp_phone_id",
    "whatsapp_business_id",
    "whatsapp_mode",
    "whatsapp_ai_enabled",
    "whatsapp_ai_prompt",
  ] as const;

  for (const [key, value] of Object.entries(values)) {
    if (!allowedKeys.includes(key as (typeof allowedKeys)[number])) {
      return { ok: false, error: `Clé non autorisée : ${key}` };
    }
    if (typeof value !== "string") {
      return { ok: false, error: `Valeur invalide pour ${key}` };
    }
    if (value.startsWith("data:")) {
      return { ok: false, error: "Image en base64 refusee : re-uploadez via le bouton (fichier /uploads/)." };
    }
    if (value.length > 8000) {
      return { ok: false, error: `Valeur trop longue pour ${key}` };
    }
  }

  // Validation spécifique
  if (values.opening_hours_json !== undefined && values.opening_hours_json.trim() !== "") {
    try {
      JSON.parse(values.opening_hours_json);
    } catch {
      return { ok: false, error: "Horaires par jour : JSON invalide." };
    }
  }
  if (values.smtp_port !== undefined && values.smtp_port.trim() !== "") {
    const port = Number(values.smtp_port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return { ok: false, error: "Port SMTP invalide." };
    }
  }
  if (values.whatsapp_mode !== undefined && values.whatsapp_mode !== "test" && values.whatsapp_mode !== "prod") {
    return { ok: false, error: "Mode WhatsApp invalide (test ou prod)." };
  }
  if (values.whatsapp_phone_id !== undefined && values.whatsapp_phone_id !== "" && !/^[0-9]{5,30}$/.test(values.whatsapp_phone_id.trim())) {
    return { ok: false, error: "Phone Number ID WhatsApp invalide (chiffres uniquement)." };
  }
  if (values.accent_color !== undefined && !/^#[0-9a-fA-F]{6}$/.test(values.accent_color.trim())) {
    return { ok: false, error: "Couleur d'accent invalide (format #rrggbb)." };
  }
  if (values.contact_email !== undefined && values.contact_email.trim() !== "") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.contact_email.trim())) {
      return { ok: false, error: "E-mail de contact invalide." };
    }
  }

  try {
    await Promise.all(
      Object.entries(values).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    revalidatePath("/admin/settings");
    revalidatePath("/commande");
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erreur lors de la sauvegarde en base." };
  }
}

const AD_SLOT_KEYS = ["leaderboard_top", "sidebar_right", "in_feed", "mobile_sticky"] as const;

export async function updateAdSlotAction(input: {
  slot: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  enabled: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  if (!AD_SLOT_KEYS.includes(input.slot as (typeof AD_SLOT_KEYS)[number])) {
    return { ok: false, error: "Emplacement publicitaire inconnu." };
  }
  for (const v of [input.title, input.imageUrl, input.linkUrl]) {
    if (typeof v !== "string" || v.length > 5000) {
      return { ok: false, error: "Valeur publicitaire trop longue." };
    }
    if (v.startsWith("data:")) {
      return { ok: false, error: "Image en base64 refusee : re-uploadez via le bouton (fichier /uploads/)." };
    }
  }
  try {
    await prisma.adSlot.upsert({
      where: { slot: input.slot },
      update: {
        title: input.title.trim(),
        imageUrl: input.imageUrl.trim(),
        linkUrl: input.linkUrl.trim(),
        enabled: input.enabled,
      },
      create: {
        slot: input.slot,
        title: input.title.trim(),
        imageUrl: input.imageUrl.trim(),
        linkUrl: input.linkUrl.trim(),
        enabled: input.enabled,
      },
    });
    revalidatePath("/admin/settings");
    revalidatePath("/commande");
    return { ok: true };
  } catch (error) {
    console.error("[updateAdSlotAction]", error);
    return { ok: false, error: "Sauvegarde impossible." };
  }
}

export async function testSmtpAction(): Promise<{ ok: boolean; message: string }> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  const stored = await prisma.setting.findMany({
    where: { key: { in: ["smtp_host", "smtp_port", "smtp_user", "smtp_from"] } },
  });
  const map = new Map(stored.map((s) => [s.key, s.value]));
  const host = (map.get("smtp_host") ?? "").trim();
  const port = (map.get("smtp_port") ?? "").trim();
  const user = (map.get("smtp_user") ?? "").trim();
  const from = (map.get("smtp_from") ?? "").trim();
  if (!host || !port || !user || !from) {
    return { ok: false, message: "SMTP incomplet : renseignez hôte, port, utilisateur et expéditeur." };
  }
  // Pas d'envoi réel ici (pas de dépendance nodemailer) : on valide la config.
  return { ok: true, message: `Configuration SMTP lue : ${user}@${host}:${port} (expéditeur ${from}).` };
}
