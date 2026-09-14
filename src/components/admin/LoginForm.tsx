"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("E-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type Values = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-[15px] text-white outline-none placeholder:text-zinc-500 focus:border-red-500";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: Values): Promise<void> {
    setLoading(true);
    try {
      const res = await signIn("credentials", { ...values, redirect: false });
      if (res?.error) {
        toast.error("Identifiants incorrects.");
        return;
      }
      toast.success("Bienvenue !");
      router.push(params.get("callbackUrl") || "/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8">
      <div className="mb-5 text-center">
        <p className="text-xl font-bold text-white">Espace garage</p>
        <p className="mt-1 text-sm text-zinc-400">
          Connectez-vous pour gérer les demandes.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="px-1 text-sm font-semibold text-zinc-200">
            E-mail
          </label>
          <input
            id="login-email"
            {...register("email")}
            type="email"
            autoComplete="username"
            placeholder="admin@palpiauto.fr"
            className={cn(inputClass, errors.email && "border-red-500")}
          />
          {errors.email ? (
            <p className="px-1 text-xs text-red-400">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="px-1 text-sm font-semibold text-zinc-200">
            Mot de passe
          </label>
          <input
            id="login-password"
            {...register("password")}
            type="password"
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            className={cn(inputClass, errors.password && "border-red-500")}
          />
          {errors.password ? (
            <p className="px-1 text-xs text-red-400">{errors.password.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-lg bg-red-600 py-3 font-bold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
