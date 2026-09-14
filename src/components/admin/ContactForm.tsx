"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/app/actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-[15px] text-zinc-900 outline-none focus:border-zinc-900";

export function ContactForm({
  garagePhone,
  whatsappPhone,
  contactEmail,
  address,
}: {
  garagePhone: string;
  whatsappPhone: string;
  contactEmail: string;
  address: string;
}) {
  const [garage_phone, setGaragePhone] = useState(garagePhone);
  const [whatsapp_phone, setWhatsappPhone] = useState(whatsappPhone);
  const [contact_email, setContactEmail] = useState(contactEmail);
  const [addressValue, setAddressValue] = useState(address);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettingsAction({
        garage_phone,
        whatsapp_phone,
        contact_email,
        address: addressValue,
      });
      if (!res.ok) toast.error(res.error ?? "Erreur lors de la sauvegarde.");
      else toast.success("Coordonnées enregistrées.");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-garage" className="px-1 text-sm font-semibold text-zinc-700">
            Téléphone affiché
          </label>
          <input
            id="contact-garage"
            value={garage_phone}
            onChange={(e) => setGaragePhone(e.target.value)}
            placeholder="06 01 63 99 59"
            autoComplete="tel"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-wa" className="px-1 text-sm font-semibold text-zinc-700">
            Numéro WhatsApp
          </label>
          <input
            id="contact-wa"
            value={whatsapp_phone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            placeholder="33601639959"
            inputMode="tel"
            autoComplete="off"
            className={inputClass}
          />
          <p className="px-1 text-xs text-zinc-500">Chiffres uniquement, sans + ni espace (ex : 33601639959).</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-email" className="px-1 text-sm font-semibold text-zinc-700">
            E-mail de contact
          </label>
          <input
            id="contact-email"
            type="email"
            value={contact_email}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="contact@palpiauto.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="contact-address" className="px-1 text-sm font-semibold text-zinc-700">
            Adresse du garage
          </label>
          <input
            id="contact-address"
            value={addressValue}
            onChange={(e) => setAddressValue(e.target.value)}
            placeholder="5 Av. du Général de Gaulle, 91120 Palaiseau"
            autoComplete="street-address"
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
          {saving ? "Enregistrement…" : "Enregistrer les coordonnées"}
        </button>
      </div>
    </form>
  );
}
