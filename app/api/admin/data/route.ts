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

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);

  const [
    { count: totalUsers },
    { count: totalMascotasActivas },
    { count: totalMascotasInactivas },
    { count: totalHistorial },
    { count: totalPremium },
    { count: conFoto },
    { count: conChip },
    { count: publicos },
    { data: perdidas },
    { data: solDescuento },
    { data: solPremium },
    { data: sugerencias },
    { data: iaUsageRecent },
    { count: iaTotal },
    { data: profileDates },
    { data: mascotaDates },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("mascotas").select("*", { count: "exact", head: true }).eq("active", true),
    admin.from("mascotas").select("*", { count: "exact", head: true }).eq("active", false),
    admin.from("historial").select("*", { count: "exact", head: true }),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("is_premium", true),
    admin.from("mascotas").select("*", { count: "exact", head: true }).eq("active", true).not("photo_url", "is", null),
    admin.from("mascotas").select("*", { count: "exact", head: true }).eq("active", true).not("chip", "is", null),
    admin.from("mascotas").select("*", { count: "exact", head: true }).eq("active", true).eq("is_public", true),
    admin.from("perdidas").select("*").eq("active", true),
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
    admin.from("profiles").select("created_at").gte("created_at", sixMonthsAgo.toISOString()),
    admin.from("mascotas").select("created_at").gte("created_at", sixMonthsAgo.toISOString()),
  ]);

  // Calcular gráficos mensuales server-side
  function getLast6Months() {
    const out = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("es-AR", { month: "short" }),
      });
    }
    return out;
  }

  const months = getLast6Months();
  const usersByMonth = months.map(m => ({
    label: m.label,
    count: (profileDates || []).filter((p: any) => p.created_at?.startsWith(m.key)).length,
  }));
  const mascotasByMonth = months.map(m => ({
    label: m.label,
    count: (mascotaDates || []).filter((d: any) => d.created_at?.startsWith(m.key)).length,
  }));

  // Perfiles para top usuarios de IA (máximo 10 IDs)
  const userCountsMap: Record<string, number> = {};
  for (const r of (iaUsageRecent || [])) {
    if (!r.user_id) continue;
    userCountsMap[r.user_id] = (userCountsMap[r.user_id] || 0) + 1;
  }
  const topUserIds = Object.keys(userCountsMap)
    .sort((a, b) => userCountsMap[b] - userCountsMap[a])
    .slice(0, 10);

  const { data: iaProfiles } = topUserIds.length > 0
    ? await admin.from("profiles").select("id, full_name, is_premium").in("id", topUserIds)
    : { data: [] };

  // Normalizar solicitudes
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
    perdidas: perdidas || [],
    solicitudes,
    sugerencias: sugerencias || [],
    iaUsageRecent: iaUsageRecent || [],
    iaTotal: iaTotal || 0,
    iaProfiles: iaProfiles || [],
    stats: {
      totalUsers: totalUsers || 0,
      totalMascotasActivas: totalMascotasActivas || 0,
      totalMascotasInactivas: totalMascotasInactivas || 0,
      totalHistorial: totalHistorial || 0,
      totalPremium: totalPremium || 0,
      conFoto: conFoto || 0,
      conChip: conChip || 0,
      publicos: publicos || 0,
      totalPerdidas: (perdidas || []).length,
      usersByMonth,
      mascotasByMonth,
    },
  });
}
