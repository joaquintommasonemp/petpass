import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = admin();

  const { data: mascota, error } = await db
    .from("mascotas")
    .select("id, name, breed, age, sex, chip, photo_url, weight, castrado, user_id")
    .eq("id", params.id)
    .eq("active", true)
    .single();

  if (error || !mascota) {
    return NextResponse.json({ error: "Mascota no encontrada" }, { status: 404 });
  }

  // Nombre del tutor (solo el primero)
  const { data: profile } = await db
    .from("profiles")
    .select("full_name")
    .eq("id", mascota.user_id)
    .single();

  const tutorName = profile?.full_name?.split(" ")[0] || null;

  // Última vacuna aplicada
  const { data: vacunas } = await db
    .from("vacunas")
    .select("name, date, next_date")
    .eq("mascota_id", params.id)
    .order("date", { ascending: false })
    .limit(5);

  return NextResponse.json({
    mascota: {
      id: mascota.id,
      name: mascota.name,
      breed: mascota.breed,
      age: mascota.age,
      sex: mascota.sex,
      chip: mascota.chip,
      photo_url: mascota.photo_url,
      weight: mascota.weight,
      castrado: mascota.castrado,
    },
    tutorName,
    vacunas: vacunas || [],
  });
}
