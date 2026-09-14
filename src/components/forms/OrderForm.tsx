"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { submitOrderAction } from "@/app/actions";
import { orderSchema, type OrderFormValues } from "@/lib/validations/order.schema";
import { BrandField, CategoryField, TextFieldWrapper, inputClass } from "./fields";
import { cn } from "@/lib/utils";

export function OrderForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      lastName: "", firstName: "", email: "", phone: "",
      vehicleBrand: "", vehicleModel: "", plateNumber: "",
      partCategory: undefined as unknown as OrderFormValues["partCategory"],
      partDescription: "",
    },
  });
  const { register, control, handleSubmit, setError, reset } = form;
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: OrderFormValues): Promise<void> {
    const result = await submitOrderAction(values);
    if (!result.ok) {
      if (result.fieldErrors) {
        for (const [f, msg] of Object.entries(result.fieldErrors)) {
          if (msg) setError(f as keyof OrderFormValues, { type: "server", message: msg });
        }
      }
      toast.error(result.message);
      return;
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Commande de pièce" className="flex flex-col gap-5">
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
      <button type="submit" disabled={isSubmitting} className="mt-1 w-full rounded-lg bg-zinc-900 px-6 py-3.5 text-base font-bold text-white hover:bg-zinc-700 disabled:opacity-60">
        {isSubmitting ? "Envoi en cours…" : "Envoyer ma demande"}
      </button>
      <p className="text-center text-xs text-zinc-500">
        Votre demande est enregistrée par le garage, puis WhatsApp s&apos;ouvre avec le message prêt à envoyer.
      </p>
    </form>
  );
}


