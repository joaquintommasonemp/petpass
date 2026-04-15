import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getUserFromToken(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  return user;
}

// POST — crear link compartido
export async function POST(req: NextRequest) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { mascota_id, days = 7, label } = body;
  if (!mascota_id) return NextResponse.json({ error: "Falta mascota_id" }, { status: 400 });

  // Verificar que la mascota pertenece al usuario
  const { data: mascota } = await admin
    .from("mascotas")
    .select("id, user_id")
    .eq("id", mascota_id)
    .single();

  if (!mascota || mascota.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const expires_at = new Date();
  expires_at.setDate(expires_at.getDate() + days);

  const { data, error } = await admin
    .from("historial_compartidos")
    .insert({
      mascota_id,
      user_id: user.id,
      expires_at: expires_at.toISOString(),
      label: label || null,
      active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, expires_at: data.expires_at });
}

// GET — obtener historial completo por token (sin auth)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Falta token" }, { status: 400 });

  const { data: link, error: linkError } = await admin
    .from("historial_compartidos")
    .select("*")
    .eq("id", token)
    .eq("active", true)
    .single();

  if (linkError || !link) return NextResponse.json({ error: "Link inválido o expirado" }, { status: 404 });
  if (new Date(link.expires_at) < new Date()) return NextResponse.json({ error: "Link expirado" }, { status: 410 });

  const mascota_id = link.mascota_id;

  const [mascotaRes, historialRes, vacunasRes, alimentRes] = await Promise.all([
    admin.from("mascotas").select("*").eq("id", mascota_id).single(),
    admin.from("historial").select("*").eq("mascota_id", mascota_id).order("date", { ascending: false }),
    admin.from("vacunas").select("*").eq("mascota_id", mascota_id).order("date", { ascending: false }),
    admin.from("alimentacion").select("*").eq("mascota_id", mascota_id).order("created_at", { ascending: false }).limit(1),
  ]);

  return NextResponse.json({
    mascota: mascotaRes.data,
    historial: historialRes.data || [],
    vacunas: vacunasRes.data || [],
    alimentacion: alimentRes.data?.[0] || null,
    expires_at: link.expires_at,
    label: link.label,
  });
}

// DELETE — revocar link
export async function DELETE(req: NextRequest) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Falta token" }, { status: 400 });

  const { error } = await admin
    .from("historial_compartidos")
    .update({ active: false })
    .eq("id", token)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
