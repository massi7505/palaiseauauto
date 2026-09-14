import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/admin/login" });
      }}
    >
      <button
        type="submit"
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-zinc-700"
      >
        Déconnexion
      </button>
    </form>
  );
}

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/requests", label: "Demandes" },
  { href: "/admin/settings", label: "Paramètres" },
];

export async function AdminShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-700 text-sm font-black text-white"
            >
              P
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-extrabold tracking-tight text-white">PalpiAuto</span>
              <span className="block text-[11px] text-zinc-500">Garage — Admin</span>
            </span>
          </Link>

          <nav aria-label="Administration" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-44 truncate text-xs text-zinc-400 lg:block">
              {session.user.email}
            </span>
            <Link
              href="/commande"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white sm:block"
            >
              Voir le site
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="border-t border-zinc-800 md:hidden">
          <nav aria-label="Administration mobile" className="mx-auto flex h-11 max-w-6xl items-center justify-start gap-1 overflow-x-auto px-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-3 text-center text-xs text-zinc-500 sm:px-6">
          PalpiAuto — Administration
        </div>
      </footer>
    </div>
  );
}

