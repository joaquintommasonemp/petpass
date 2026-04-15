import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const RATE_LIMIT = 5;       // máx avistamientos por perdida por minuto
const RATE_WINDOW_MS = 60_000;

// Rate limiting persistente: cuenta avistamientos recientes en DB para esta perdida.
// Resiste cold starts de Vercel (a diferencia de un Map en memoria).
async function isRateLimited(perdidaId: string): Promise<boolean> {
  try {
    const admin = adminClient();
    const since = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
    const { count } = await admin
      .from("comunidad_mensajes")
      .select("id", { count: "exact", head: true })
      .eq("author_name", "AVISTAMIENTO")
      .eq("mascota_name", perdidaId)
      .gte("created_at", since);

    return (count ?? 0) >= RATE_LIMIT;
  } catch {
    // Si falla la consulta, dejamos pasar (no bloquear por error interno)
    return false;
  }
}

// GET — datos públicos de la perdida (sin exponer teléfono)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = adminClient();
  const { data, error } = await admin
    .from("perdidas")
    .select("id, pet_name, breed, color, zone, description, photo_url, created_at, active")
    .eq("id", params.id)
    .eq("active", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  return NextResponse.json(data);
}

// POST — avistamiento anónimo
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (await isRateLimited(params.id)) {
    return NextResponse.json(
      { error: "Demasiados avistamientos recientes. Esperá un minuto." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { nombre, mensaje, ubicacion } = body;

  if (!mensaje?.trim()) return NextResponse.json({ error: "El mensaje es obligatorio" }, { status: 400 });

  if (mensaje.trim().length > 500) {
    return NextResponse.json({ error: "El mensaje es demasiado largo" }, { status: 400 });
  }

  const admin = adminClient();

  const { data: perdida } = await admin
    .from("perdidas")
    .select("id, user_id, pet_name")
    .eq("id", params.id)
    .eq("active", true)
    .single();

  if (!perdida) return NextResponse.json({ error: "Alerta no encontrada" }, { status: 404 });

  await admin.from("comunidad_mensajes").insert({
    author_name: "AVISTAMIENTO",
    mascota_name: params.id,
    message: JSON.stringify({
      perdida_id: params.id,
      pet_name: perdida.pet_name,
      nombre: nombre?.trim().slice(0, 100) || "Anónimo",
      mensaje: mensaje.trim().slice(0, 500),
      ubicacion: ubicacion?.trim().slice(0, 200) || null,
    }),
  });

  return NextResponse.json({ ok: true });
}
