import { NextResponse, type NextRequest } from "next/server";

function getSessionCookie(request: NextRequest): string | undefined {
  // NextAuth v5 (Auth.js) : noms de cookies réels.
  // Dev (http) : "authjs.session-token"
  // Prod (https) : "__Secure-authjs.session-token"
  // Legacy : "next-auth.session-token" / "__Secure-next-auth.session-token"
  const names = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
  ];
  for (const name of names) {
    const value = request.cookies.get(name)?.value;
    if (value) return value;
  }
  return undefined;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Toujours accessibles : login + API auth (sinon boucle infinie).
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Garde légère : présence d'une session. La vérification du rôle
  // est faite côté serveur dans AdminShell via auth().
  const token = getSessionCookie(request);
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
