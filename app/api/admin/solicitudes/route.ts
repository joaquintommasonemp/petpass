import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data: profile } = await admin.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json();
  const { id, accion, tipo } = body;

  if (!id || !accion) return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });

  if (accion === "rechazar") {
    await admin.from("comunidad_mensajes").update({ mascota_name: "rechazado" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  if (accion === "aprobar") {
    const { data: sol } = await admin.from("comunidad_mensajes").select("*").eq("id", id).single();
    if (!sol) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    let datos: any;
    try {
      datos = JSON.parse(sol.message);
    } catch {
      return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const tipoSol = tipo || (sol.author_name === "SOLICITUD:profesional" ? "profesional" : "descuento");
    const jsonFile = tipoSol === "profesional" ? "profesionales.json" : "descuentos.json";
    const storageUrl = SUPABASE_URL + "/storage/v1/object/public/comunidad/" + jsonFile;

    let current: any[] = [];
    try {
      const res = await fetch(storageUrl);
      if (res.ok) current = await res.json();
    } catch {}

    if (!Array.isArray(current)) current = [];
    current.push({ ...datos, active: true });

    const bodyBlob = JSON.stringify(current);
    const putRes = await fetch(SUPABASE_URL + "/storage/v1/object/comunidad/" + jsonFile, {
      method: "PUT",
      headers: {
        Authorization: "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "x-upsert": "true",
      },
      body: bodyBlob,
    });

    if (!putRes.ok) {
      return NextResponse.json({ error: "Error al guardar en storage" }, { status: 500 });
    }

    await admin.from("comunidad_mensajes").update({ mascota_name: "aprobado" }).eq("id", id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
}
