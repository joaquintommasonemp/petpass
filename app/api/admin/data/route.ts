import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Verificar que el usuario sea el admin
  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Usar service role para bypassar RLS y leer todos los datos
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const [
    { data: mascotas },
    { data: profiles },
    { data: perdidas },
    { data: historial },
  ] = await Promise.all([
    admin.from("mascotas").select("*").order("created_at", { ascending: false }),
    admin.from("profiles").select("*"),
    admin.from("perdidas").select("*").eq("active", true),
    admin.from("historial").select("id, mascota_id"),
  ]);

  return NextResponse.json({ mascotas, profiles, perdidas, historial });
}
