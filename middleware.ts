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
  const { pathname } = req.nextUrl;

  // Dejar pasar rutas públicas sin verificar sesión
  if (isPublic(pathname)) return NextResponse.next();

  // Para rutas protegidas, verificar sesión con Supabase
  if (!isProtected(pathname)) return NextResponse.next();

  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() valida el JWT contra Supabase (no confía solo en la cookie)
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo|icon|og-image|manifest|sw\\.js|apple-touch).*)",
  ],
};
