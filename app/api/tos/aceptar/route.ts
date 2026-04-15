import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // Extraer usuario del JWT — nunca confiar en userId del body
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const db = admin();
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { version } = await req.json().catch(() => ({}));

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "desconocida";

    const { error } = await db
      .from("profiles")
      .update({
        tos_accepted_at: new Date().toISOString(),
        tos_ip: ip,
        tos_version: version || "1.0",
      })
      .eq("id", user.id);

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
