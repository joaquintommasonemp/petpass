import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { userId, version } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "desconocida";

    const db = admin();

    const { error } = await db
      .from("profiles")
      .update({
        tos_accepted_at: new Date().toISOString(),
        tos_ip: ip,
        tos_version: version || "1.0",
      })
      .eq("id", userId);

    if (error) {
      console.error("[tos/aceptar] error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[tos/aceptar] unexpected:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
