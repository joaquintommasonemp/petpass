import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Rate limiting en memoria (por IP, se resetea en cold starts)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;      // máx 5 avistamientos
const RATE_WINDOW = 60_000; // por minuto

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
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
  // Rate limiting por IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { nombre, mensaje, ubicacion } = body;

  if (!mensaje?.trim()) return NextResponse.json({ error: "El mensaje es obligatorio" }, { status: 400 });

  // Limitar longitud para evitar spam
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
