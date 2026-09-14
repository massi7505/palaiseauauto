import Link from "next/link";
import { getAllSettings, getActiveAds, parseOpeningHoursJson, formatOpeningHours } from "@/lib/settings";
import { CommandeBlocks } from "@/components/commande/CommandeBlocks";
import { AdSlotView } from "@/components/ads/AdSlotView";

export const dynamic = "force-dynamic";

export default async function CommandePage() {
  // Toujours frais : logo et pubs modifiés dans /admin/settings visibles aussitôt.
  const settings = await getAllSettings();
  const ads = settings.ads_enabled === "true" ? await getActiveAds() : null;
  const garagePhone = settings.garage_phone;
  const whatsappPhone = settings.whatsapp_phone;
  const brandName = settings.company_name?.trim() || settings.brand_name;
  const logoRaw = settings.logo_url?.trim();
  const logoUrl = logoRaw && !logoRaw.startsWith("data:") ? logoRaw : "";
  const address = settings.address;
  const contactEmail = settings.contact_email?.trim();
  const openingHoursText = formatOpeningHours(
    parseOpeningHoursJson(settings.opening_hours_json ?? ""),
    settings.opening_hours,
  );
  const customMessage = settings.custom_message;
  const brandInitial = (brandName || "P").charAt(0).toUpperCase();
  const blocks = (
    <CommandeBlocks
      ads={ads}
      garagePhone={garagePhone}
      whatsappPhone={whatsappPhone}
      address={address}
      contactEmail={contactEmail}
      openingHoursText={openingHoursText}
      customMessage={customMessage}
    />
  );

  return (
    <div className="min-h-full bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={`Logo ${brandName}`} className="h-9 w-auto max-w-36 shrink-0 object-contain" />
            ) : (
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-base font-bold text-white">
                {brandInitial}
              </span>
            )}
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-base font-bold text-zinc-900">{brandName}</span>
              <span className="block text-xs text-zinc-500">Palaiseau — Pièces détachées</span>
            </span>
          </Link>
          <Link href="/admin/login" className="shrink-0 text-xs font-semibold text-zinc-500 hover:text-zinc-900 hover:underline">
            Espace garage
          </Link>
        </div>
      </header>

      {ads?.leaderboard_top ? (
        <div className="mx-auto hidden w-full max-w-6xl px-4 pt-4 sm:px-6 md:block">
          <AdSlotView ad={ads.leaderboard_top} />
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 pb-24 md:pb-16">
        {ads?.sidebar_right ? (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">{blocks}</div>
            <div className="hidden min-w-0 lg:block">
              <div className="sticky top-4">
                <AdSlotView ad={ads.sidebar_right} />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl">{blocks}</div>
        )}

        <p className="mt-6 text-center text-xs text-zinc-500">
          {brandName} — Palaiseau. Vos données servent uniquement au traitement de votre demande.
        </p>
      </main>

      {ads?.mobile_sticky ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
          <AdSlotView ad={ads.mobile_sticky} className="border-0" />
        </div>
      ) : null}
    </div>
  );
}
