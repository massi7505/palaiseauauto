"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submitOrderAction } from "@/app/actions";
import {
  orderSchema,
  FUEL_LABELS,
  fuelEnum,
  type OrderFormValues,
} from "@/lib/validations/order.schema";
import { BrandField, CategoryField, TextFieldWrapper, inputClass } from "./fields";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "palpiauto-order-draft-v2";

function loadDraft(): Partial<OrderFormValues> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<OrderFormValues>;
    // Jamais de token captcha restauré : il expire en 2 minutes.
    const { recaptchaToken: _t, ...rest } = parsed;
    void _t;
    return rest;
  } catch {
    return {};
  }
}

/** Charge le script reCAPTCHA v3 de Google (une seule fois). */
function loadRecaptchaScript(siteKey: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector('script[data-recaptcha="v3"]')) {
      resolve(true);
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    s.async = true;
    s.defer = true;
    s.dataset.recaptcha = "v3";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

export function OrderForm({ recaptchaSiteKey, accentColor }: { recaptchaSiteKey?: string; accentColor?: string }) {
  const [sent, setSent] = useState(false);
  const accent = accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : "#b91c1c";
  const captchaReady = useRef(false);
  const form = useForm<OrderFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      lastName: "", firstName: "", email: "", phone: "",
      vehicleBrand: "", vehicleModel: "", plateNumber: "",
      fuel: undefined,
      partCategory: undefined,
      partDescription: "",
      consent: false,
      recaptchaToken: "",
      ...loadDraft(),
    },
  });
  const { register, control, handleSubmit, setError, reset, watch } = form;
  const { errors, isSubmitting } = form.formState;

  // Brouillon auto : le client ne perd rien s'il recharge la page.
  useEffect(() => {
    const sub = watch((values) => {
      try {
        const { recaptchaToken: _t, ...rest } = values as Partial<OrderFormValues>;
        void _t;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      } catch {
        // stockage indisponible : on ignore
      }
    });
    return () => sub.unsubscribe();
  }, [watch]);

  // Pré-charge reCAPTCHA v3 si une clé est configurée.
  useEffect(() => {
    if (!recaptchaSiteKey) return;
    loadRecaptchaScript(recaptchaSiteKey).then((ok) => {
      captchaReady.current = ok;
    });
  }, [recaptchaSiteKey]);

  async function getCaptchaToken(): Promise<string> {
    if (!recaptchaSiteKey || !captchaReady.current || !window.grecaptcha) return "";
    try {
      const token = await new Promise<string>((resolve, reject) => {
        window.grecaptcha!.ready(() => {
          window.grecaptcha!.execute(recaptchaSiteKey, { action: "order" }).then(resolve, reject);
        });
      });
      return token;
    } catch {
      return "";
    }
  }

  async function onSubmit(values: OrderFormValues): Promise<void> {
    const recaptchaToken = await getCaptchaToken();
    const result = await submitOrderAction({ ...values, recaptchaToken });
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [f, msg] of Object.entries(result.fieldErrors)) {
          if (msg) setError(f as keyof OrderFormValues, { type: "server", message: msg });
        }
      }
      toast.error(result.message);
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSent(true);
    toast.success(result.message);
    reset();
    if (result.whatsappUrl) window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
  }

  if (sent) {
    return (
      <div className="w-full border border-zinc-200 bg-zinc-50 p-8 text-center">
        <p className="text-lg font-bold text-zinc-900">Demande envoyée</p>
        <p className="mt-1 text-sm text-zinc-600">
          Votre demande a bien été enregistrée. Le garage vous recontacte rapidement.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Faire une autre demande
        </button>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitHandler = handleSubmit(onSubmit as any);

  return (
    <form onSubmit={submitHandler} noValidate aria-label="Commande de pièce" className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-bold text-zinc-900">Vos coordonnées</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextFieldWrapper label="Nom" error={errors.lastName?.message} name="lastName">
            <input {...register("lastName")} placeholder="Dupont" autoComplete="family-name" aria-label="Nom" className={cn(inputClass, errors.lastName && "border-red-500")} />
          </TextFieldWrapper>
          <TextFieldWrapper label="Prénom" error={errors.firstName?.message} name="firstName">
            <input {...register("firstName")} placeholder="Jean" autoComplete="given-name" aria-label="Prénom" className={cn(inputClass, errors.firstName && "border-red-500")} />
          </TextFieldWrapper>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextFieldWrapper label="E-mail" error={errors.email?.message} name="email">
            <input {...register("email")} type="email" inputMode="email" placeholder="jean.dupont@email.fr" autoComplete="email" aria-label="E-mail" className={cn(inputClass, errors.email && "border-red-500")} />
          </TextFieldWrapper>
          <TextFieldWrapper label="Téléphone" error={errors.phone?.message} name="phone">
            <input {...register("phone")} type="tel" inputMode="tel" placeholder="06 12 34 56 78" autoComplete="tel" aria-label="Téléphone" className={cn(inputClass, errors.phone && "border-red-500")} />
          </TextFieldWrapper>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-3 border-t border-zinc-200 pt-5">
        <legend className="text-sm font-bold text-zinc-900">Votre véhicule</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Controller control={control} name="vehicleBrand" render={({ field }) => (
            <BrandField value={field.value ?? ""} onChange={field.onChange} error={errors.vehicleBrand?.message} />
          )} />
          <TextFieldWrapper label="Modèle du véhicule" error={errors.vehicleModel?.message} name="vehicleModel">
            <input {...register("vehicleModel")} placeholder="Clio 4, 208, Golf 7…" aria-label="Modèle du véhicule" className={cn(inputClass, errors.vehicleModel && "border-red-500")} />
          </TextFieldWrapper>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextFieldWrapper label="Immatriculation" error={errors.plateNumber?.message} name="plateNumber">
            <input
              {...register("plateNumber")}
              placeholder="AB-123-CD"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Immatriculation"
              onChange={(e) => { e.target.value = e.target.value.toUpperCase(); void register("plateNumber").onChange(e); }}
              className={cn(inputClass, "font-mono font-semibold tracking-wider uppercase", errors.plateNumber && "border-red-500")}
            />
          </TextFieldWrapper>
          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="fuel" className="px-1 text-sm font-semibold text-zinc-700">
              Carburant <span className="font-normal text-zinc-400">(optionnel)</span>
            </label>
            <Controller control={control} name="fuel" render={({ field }) => (
              <select
                id="fuel"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? undefined : e.target.value)}
                aria-label="Carburant"
                className={cn(inputClass, !field.value && "text-zinc-400")}
              >
                <option value="">Non précisé</option>
                {fuelEnum.options.map((f) => (
                  <option key={f} value={f}>{FUEL_LABELS[f]}</option>
                ))}
              </select>
            )} />
          </div>
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-3 border-t border-zinc-200 pt-5">
        <legend className="text-sm font-bold text-zinc-900">La pièce recherchée</legend>
        <Controller control={control} name="partCategory" render={({ field }) => (
          <CategoryField value={(field.value as string) ?? ""} onChange={field.onChange} error={errors.partCategory?.message} />
        )} />
        <TextFieldWrapper label="Description de la pièce" error={errors.partDescription?.message} name="partDescription">
          <textarea {...register("partDescription")} placeholder="Précisez la pièce, le côté, vos symptômes…" rows={4} aria-label="Description de la pièce" className={cn(inputClass, "min-h-28 resize-y", errors.partDescription && "border-red-500")} />
        </TextFieldWrapper>
      </fieldset>
      <button type="submit" disabled={isSubmitting} style={{ backgroundColor: accent }} className="mt-1 w-full rounded-lg px-6 py-3.5 text-base font-bold text-white hover:opacity-90 disabled:opacity-60">
        {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande"}
      </button>
      <Controller control={control} name="consent" render={({ field }) => (
        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-zinc-600">
          <input
            type="checkbox"
            checked={field.value}
            onChange={(e) => field.onChange(e.target.checked)}
            aria-label="Consentement données personnelles"
            className="mt-0.5 h-4 w-4 shrink-0 accent-zinc-900"
          />
          <span>
            J&apos;accepte que mes données soient utilisées uniquement pour traiter ma demande de pièce.
          </span>
        </label>
      )} />
      {errors.consent?.message ? <p className="-mt-3 text-xs font-medium text-red-600">{errors.consent.message}</p> : null}
      {recaptchaSiteKey ? (
        <p className="text-center text-[11px] leading-relaxed text-zinc-400">
          Protégé par reCAPTCHA —{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">Confidentialité</a>{" "}
          ·{" "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">Conditions</a>
        </p>
      ) : null}
      <p className="text-center text-xs text-zinc-500">
        Votre demande est enregistrée par le garage, puis WhatsApp s&apos;ouvre avec le message prêt à envoyer.
      </p>
    </form>
  );
}


