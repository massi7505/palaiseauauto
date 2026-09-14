import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAdSlots } from "@/lib/settings";
import { getCustomerGroups } from "@/lib/customers";
import { IdentityForm } from "@/components/admin/IdentityForm";
import { ContactForm } from "@/components/admin/ContactForm";
import { LogoForm } from "@/components/admin/LogoForm";
import { FaviconForm } from "@/components/admin/FaviconForm";
import { AccentForm } from "@/components/admin/AccentForm";
import { MessageForm } from "@/components/admin/MessageForm";
import { RecaptchaForm } from "@/components/admin/RecaptchaForm";
import { WhatsAppForm } from "@/components/admin/WhatsAppForm";
import { OpeningHoursForm } from "@/components/admin/OpeningHoursForm";
import { SmtpForm } from "@/components/admin/SmtpForm";
import { AdsForm } from "@/components/admin/AdsForm";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const [settings, adSlots, groups] = await Promise.all([
    prisma.setting.findMany({ orderBy: { key: "asc" } }),
    getAdSlots(),
    getCustomerGroups(),
  ]);

  const get = (key: string, fallback = ""): string =>
    (settings.find((s) => s.key === key)?.value ?? fallback) as string;

  const values = {
    whatsapp_phone: get("whatsapp_phone", "33601639959"),
    garage_phone: get("garage_phone", "06 01 63 99 59"),
    brand_name: get("brand_name", "PalpiAuto"),
    company_name: get("company_name", ""),
    contact_email: get("contact_email", ""),
    logo_url: get("logo_url", ""),
    favicon_url: get("favicon_url", ""),
    accent_color: get("accent_color", "#b91c1c"),
    opening_hours: get("opening_hours", ""),
    opening_hours_json: get("opening_hours_json", ""),
    address: get("address", ""),
    custom_message: get("custom_message", ""),
    theme: get("theme", "light"),
  };

  const recaptchaValues = {
    recaptcha_site_key: get("recaptcha_site_key", ""),
    recaptcha_secret_key: get("recaptcha_secret_key", ""),
    recaptcha_enabled: get("recaptcha_enabled", "false"),
  };

  const smtpValues = {
    smtp_host: get("smtp_host", ""),
    smtp_port: get("smtp_port", "587"),
    smtp_user: get("smtp_user", ""),
    smtp_pass: get("smtp_pass", ""),
    smtp_from: get("smtp_from", ""),
    smtp_secure: get("smtp_secure", "false"),
  };

  const adsEnabled = get("ads_enabled", "false") === "true";
  const whatsappValues = {
    whatsapp_phone_id: get("whatsapp_phone_id", ""),
    whatsapp_business_id: get("whatsapp_business_id", ""),
    whatsapp_mode: get("whatsapp_mode", "test"),
    whatsapp_ai_enabled: get("whatsapp_ai_enabled", "false"),
    whatsapp_ai_prompt: get("whatsapp_ai_prompt", ""),
  };
  const whatsappTokenConfigured = Boolean((process.env.WHATSAPP_API_TOKEN ?? "").trim());
  const repeatCustomers = groups.filter((g) => g.requestCount > 1);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Paramètres du site</h1>
        <p className="text-sm text-zinc-400">
          Chaque bloc se règle séparément : nom, coordonnées, logo, favicon, couleur,
          message, anti-robots, WhatsApp, horaires, SMTP, publicités, clients.
        </p>
      </div>

      <section aria-label="Nom du garage" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">1. Nom du garage</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Nom court affiché dans le header et nom complet utilisé dans le titre du site.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <IdentityForm brandName={values.brand_name} companyName={values.company_name} />
        </div>
      </section>

      <section aria-label="Coordonnées du garage" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">2. Coordonnées</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Téléphone, WhatsApp, e-mail et adresse affichés dans le bloc contact de /commande.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <ContactForm
            garagePhone={values.garage_phone}
            whatsappPhone={values.whatsapp_phone}
            contactEmail={values.contact_email}
            address={values.address}
          />
        </div>
      </section>

      <section aria-label="Logo" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">3. Logo</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Logo affiché dans le header de /commande. Upload puis Enregistrer.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <LogoForm logoUrl={values.logo_url} />
        </div>
      </section>

      <section aria-label="Favicon" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">4. Favicon</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Icône de l&apos;onglet du navigateur. PNG ou ICO carré, via upload.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <FaviconForm faviconUrl={values.favicon_url} />
        </div>
      </section>

      <section aria-label="Couleur du site" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">5. Couleur du site</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Couleur des boutons et liens de /commande. Rouge garage par défaut.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <AccentForm accentColor={values.accent_color} />
        </div>
      </section>

      <section aria-label="Message sous le formulaire" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">6. Message sous le formulaire</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Texte optionnel affiché sous la demande sur /commande. Laissez vide pour ne rien afficher.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <MessageForm customMessage={values.custom_message} />
        </div>
      </section>

      <section aria-label="Protection anti-robots" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">7. Protection anti-robots (reCAPTCHA)</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Bloque les spams sur le formulaire. Clés gratuites sur google.com/recaptcha/admin (v3 invisible).
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <RecaptchaForm values={recaptchaValues} />
        </div>
      </section>

      <section aria-label="WhatsApp et réponse auto IA" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">8. WhatsApp et réponse auto (IA)</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Compte test Meta : numéro +1 (555) 181-0387. Le token secret reste dans .env
          (WHATSAPP_API_TOKEN), jamais affiché ici. Webhook : {"{URL_PUBLIQUE}"}/api/webhooks/whatsapp.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <WhatsAppForm values={whatsappValues} tokenConfigured={whatsappTokenConfigured} />
        </div>
      </section>

      <section aria-label="Horaires du garage" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">9. Horaires du garage</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Exemple : lundi 08h-12h puis 13h-17h, jeudi matin 08h-12h puis fermé, dimanche fermé.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <OpeningHoursForm initialJson={values.opening_hours_json} fallbackText={values.opening_hours} />
        </div>
      </section>

      <section aria-label="Configuration SMTP" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">10. E-mails (SMTP)</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Serveur utilisé pour les notifications e-mail du garage.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <SmtpForm values={smtpValues} />
        </div>
      </section>

      <section aria-label="Espaces publicitaires" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">11. Espaces publicitaires</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Comme sur palpiauto.com/contact : un bandeau haut et une colonne latérale sur ordinateur,
          un encart au milieu de page et un bandeau collé en bas sur mobile.
          Activez l&apos;interrupteur global, cochez l&apos;emplacement, uploadez l&apos;image puis Enregistrer.
        </p>
        <div className="border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
          <AdsForm slots={adSlots} adsEnabled={adsEnabled} />
        </div>
      </section>

      <section aria-label="Clients récurrents" className="border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="font-bold text-white">12. Clients récurrents</h2>
        <p className="mb-5 text-sm text-zinc-400">
          Les demandes faites plusieurs fois avec le même e-mail ou le même téléphone sont regroupées ici.
          {repeatCustomers.length === 0
            ? " Aucun doublon pour le moment."
            : ` ${repeatCustomers.length} client(s) avec plusieurs demandes.`}
        </p>
        {repeatCustomers.length === 0 ? null : (
          <ul className="flex flex-col gap-3">
            {repeatCustomers.slice(0, 50).map((g) => (
              <li key={g.key} className="border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">
                      {g.lastName} {g.firstName} — {g.requestCount} demande(s)
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {g.emails.join(" / ")} — {g.phones.join(" / ")}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Dernière demande : {formatDateTime(g.lastRequestAt)}
                    </p>
                  </div>
                  <Link
                    href={`/admin/customers/${g.primaryCustomerId}`}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                  >
                    Voir la fiche
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
