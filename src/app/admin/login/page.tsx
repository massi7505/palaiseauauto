import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSettingsCached } from "@/lib/settings";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user && session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const settings = await getSettingsCached();
  const garagePhone = settings.garage_phone;
  const brandName = settings.brand_name;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-950 px-4 py-10 text-white">
      <div className="flex w-full max-w-md flex-col items-center gap-2 text-center">
        <p className="text-lg font-bold">{brandName}</p>
        <p className="text-xs text-zinc-500">Espace garage — Palaiseau</p>
        <h1 className="mt-3 text-2xl font-bold">Connexion garage</h1>
        <p className="text-sm text-zinc-400">Identifiez-vous pour gérer les demandes de pièces.</p>
      </div>

      <Suspense fallback={<p className="text-sm text-zinc-400">Chargement…</p>}>
        <LoginForm />
      </Suspense>

      <p className="text-xs text-zinc-500">Téléphone garage : {garagePhone}</p>
      <Link href="/commande" className="text-xs text-zinc-400 hover:text-white hover:underline">
        Retour à la page de commande
      </Link>
    </div>
  );
}