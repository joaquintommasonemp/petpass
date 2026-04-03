import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verificar identidad del token y rol admin con un solo cliente
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const [
    { data: mascotas },
    { data: profiles },
    { data: perdidas },
    { data: historial },
    { data: solicitudes },
    { data: sugerencias },
  ] = await Promise.all([
    admin.from("mascotas").select("*").order("created_at", { ascending: false }),
    admin.from("profiles").select("*"),
    admin.from("perdidas").select("*").eq("active", true),
    admin.from("historial").select("id, mascota_id"),
    admin.from("comunidad_mensajes").select("*")
      .like("author_name", "SOLICITUD:%")
      .order("created_at", { ascending: false }),
    admin.from("comunidad_mensajes").select("*")
      .eq("author_name", "SUGERENCIA")
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({ mascotas, profiles, perdidas, historial, solicitudes, sugerencias });
}
