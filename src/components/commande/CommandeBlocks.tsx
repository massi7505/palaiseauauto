import { Suspense } from "react";
import { OrderForm } from "@/components/forms/OrderForm";
import { AdSlotView } from "@/components/ads/AdSlotView";
import type { AdSlotKey } from "@/lib/settings";
import type { AdSlotData } from "@/lib/settings";

export function CommandeBlocks(p: {
  ads: Record<AdSlotKey, AdSlotData | null> | null;
  garagePhone: string;
  whatsappPhone: string;
  address: string;
  contactEmail: string;
  openingHoursText: string;
  customMessage: string;
}) {
  const telHref = `tel:${p.garagePhone.replace(/[\s.]/g, "")}`;
  return (
    <>
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Demande de pièce détachée
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Remplissez le formulaire ci-dessous. Votre demande est enregistrée par le garage,
          puis WhatsApp s&apos;ouvre avec votre message prêt à envoyer.
        </p>
      </div>
      <section aria-label="Formulaire de demande" className="min-w-0 border border-zinc-200 bg-white p-5 sm:p-8">
        <Suspense fallback={<div className="h-40 animate-pulse bg-zinc-100" />}>
          <OrderForm />
        </Suspense>
      </section>

      {p.ads?.in_feed ? (
        <div className="mt-4">
          <AdSlotView ad={p.ads.in_feed} />
        </div>
      ) : null}

      <section aria-label="Coordonnées du garage" className="mt-4 min-w-0 border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-bold text-zinc-900">Contacter le garage</h2>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a href={telHref} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700">
            Appeler le {p.garagePhone}
          </a>
          <a href={`https://api.whatsapp.com/send?phone=${p.whatsappPhone}`} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100">
            WhatsApp direct
          </a>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-zinc-600 sm:grid-cols-2">
          {p.address ? (
            <div className="min-w-0"><dt className="text-xs font-semibold text-zinc-500">Adresse</dt><dd className="break-words">{p.address}</dd></div>
          ) : null}
          {p.contactEmail ? (
            <div className="min-w-0"><dt className="text-xs font-semibold text-zinc-500">E-mail</dt><dd className="break-all"><a href={`mailto:${p.contactEmail}`} className="underline hover:text-zinc-900">{p.contactEmail}</a></dd></div>
          ) : null}
          {p.openingHoursText ? (
            <div className="min-w-0 sm:col-span-2"><dt className="text-xs font-semibold text-zinc-500">Horaires</dt><dd className="whitespace-pre-line">{p.openingHoursText}</dd></div>
          ) : null}
        </dl>
        {p.customMessage ? (
          <p className="mt-3 border-t border-zinc-200 pt-3 text-sm break-words text-zinc-600">{p.customMessage}</p>
        ) : null}
      </section>
    </>
  );
}
