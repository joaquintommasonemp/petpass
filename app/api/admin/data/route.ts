import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
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
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: mascotas },
    { data: profiles },
    { data: perdidas },
    { data: historial },
    { data: solDescuento },
    { data: solPremium },
    { data: sugerencias },
    { data: iaUsageRecent },
    { count: iaTotal },
  ] = await Promise.all([
    admin.from("mascotas").select("*").order("created_at", { ascending: false }),
    admin.from("profiles").select("id, full_name, phone, is_admin, is_premium, created_at"),
    admin.from("perdidas").select("*").eq("active", true),
    admin.from("historial").select("id, mascota_id"),
    admin.from("solicitudes_descuento").select("*").order("created_at", { ascending: false }),
    admin.from("solicitudes_premium").select("*").order("created_at", { ascending: false }),
    admin.from("comunidad_mensajes").select("*")
      .eq("author_name", "SUGERENCIA")
      .order("created_at", { ascending: false }),
    admin.from("ia_usage")
      .select("user_id, is_premium, input_tokens, output_tokens, created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true }),
    admin.from("ia_usage").select("*", { count: "exact", head: true }),
  ]);

  // Normalizar al mismo shape que espera admin/page.tsx
  // { id, author_name, mascota_name (= estado), message (JSON string), created_at }
  const solicitudes = [
    ...(solDescuento || []).map((s: any) => ({
      id: s.id,
      author_name: "SOLICITUD:descuento",
      mascota_name: s.estado,
      message: JSON.stringify({ nombre: s.nombre, rubro: s.rubro, email: s.email, descuento: s.descuento }),
      created_at: s.created_at,
    })),
    ...(solPremium || []).map((s: any) => ({
      id: s.id,
      author_name: "SOLICITUD:premium",
      mascota_name: s.estado,
      message: JSON.stringify({ email: s.email, userId: s.user_id }),
      created_at: s.created_at,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json({
    mascotas,
    profiles,
    perdidas,
    historial,
    solicitudes,
    sugerencias,
    iaUsageRecent: iaUsageRecent || [],
    iaTotal: iaTotal || 0,
  });
}
