import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Rutas que requieren sesión activa
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/mascota",
  "/onboarding",
  "/perfil",
  "/premium",
];

// Rutas públicas (accesibles sin sesión)
const PUBLIC_PREFIXES = [
  "/login",
  "/registro",
  "/carnet",
  "/estudio",
  "/perdida",
  "/historial",
  "/acceso",
  "/paseo",
  "/terminos",
  "/privacidad",
  "/reset-password",
  "/api",
  "/_next",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
}

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(p => pathname.startsWith(p));
}

function safeRedirect(next: string | null): string {
  if (!next) return "/dashboard";
  // Solo permitir rutas relativas para evitar open redirect
  if (next.startsWith("/") && !next.startsWith("//")) return next;
  return "/dashboard";
}

export async function middleware(req: NextRequest) {
  // La autenticación de rutas protegidas se maneja client-side en cada layout.
  // El middleware solo pasa requests — la validación real ocurre en cada API route.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|icon|og-image|manifest|sw\\.js|apple-touch).*)",
  ],
};
