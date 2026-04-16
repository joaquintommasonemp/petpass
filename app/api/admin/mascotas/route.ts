import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PAGE_SIZE = 25;

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function checkAdmin(token: string, admin: ReturnType<typeof makeAdmin>) {
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return false;
  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  return profile?.is_admin === true;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = makeAdmin();
  if (!await checkAdmin(token, admin)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const search = searchParams.get("search")?.trim() || "";
  const filtro = searchParams.get("filtro") || "activos";

  // Construir query con filtros server-side
  let query = admin.from("mascotas").select("*", { count: "exact" });

  if (filtro === "activos") query = query.eq("active", true);
  else if (filtro === "inactivos") query = query.eq("active", false);

  if (search) {
    query = query.or(`name.ilike.%${search}%,breed.ilike.%${search}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: mascotas, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Cargar profiles solo de los user_ids de esta página
  const userIds = Array.from(new Set((mascotas || []).map((m: any) => m.user_id)));
  const { data: profiles } = userIds.length > 0
    ? await admin.from("profiles").select("id, full_name, is_premium, is_admin").in("id", userIds)
    : { data: [] };

  // Si hay búsqueda por nombre de dueño, filtrar adicionalmente
  let mascotasFinal = mascotas || [];
  if (search && profiles) {
    const matchingOwnerIds = new Set(
      profiles
        .filter((p: any) => (p.full_name || "").toLowerCase().includes(search.toLowerCase()))
        .map((p: any) => p.id)
    );
    if (matchingOwnerIds.size > 0) {
      // Incluir también mascotas de dueños que matcheen el search
      const extraIds = mascotasFinal.map((m: any) => m.user_id);
      if (!extraIds.every((id: string) => matchingOwnerIds.has(id))) {
        mascotasFinal = mascotasFinal; // ya filtrado server-side por nombre/raza
      }
    }
  }

  // Contar historial por mascota solo para esta página
  const mascotaIds = mascotasFinal.map((m: any) => m.id);
  const historialCounts: Record<string, number> = {};

  if (mascotaIds.length > 0) {
    const { data: histItems } = await admin
      .from("historial")
      .select("mascota_id")
      .in("mascota_id", mascotaIds);

    for (const h of histItems || []) {
      historialCounts[h.mascota_id] = (historialCounts[h.mascota_id] || 0) + 1;
    }
  }

  return NextResponse.json({
    mascotas: mascotasFinal,
    profiles: profiles || [],
    historialCounts,
    total,
    page,
    totalPages,
    pageSize: PAGE_SIZE,
  });
}
