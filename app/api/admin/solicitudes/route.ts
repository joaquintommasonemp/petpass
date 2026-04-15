import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, accion, tipo } = body;

  if (!id || !accion || !tipo) return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });

  const tabla = tipo === "premium" ? "solicitudes_premium" : "solicitudes_descuento";
  const now = new Date().toISOString();

  if (accion === "rechazar") {
    await admin.from(tabla).update({ estado: "rechazado", updated_at: now }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (accion === "revocar") {
    if (tipo === "premium") {
      const { data: sol } = await admin.from("solicitudes_premium").select("user_id").eq("id", id).single();
      if (sol?.user_id) {
        await admin.from("profiles").update({ is_premium: false }).eq("id", sol.user_id);
      }
    }
    await admin.from(tabla).update({ estado: "rechazado", updated_at: now }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (accion === "aprobar") {
    if (tipo === "premium") {
      const { data: sol } = await admin.from("solicitudes_premium").select("user_id").eq("id", id).single();
      if (!sol) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
      await admin.from("profiles").update({ is_premium: true }).eq("id", sol.user_id);
    }
    await admin.from(tabla).update({ estado: "aprobado", updated_at: now }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
}
