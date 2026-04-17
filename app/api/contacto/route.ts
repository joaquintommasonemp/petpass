import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nombre, email, mensaje } = body;

  if (!mensaje?.trim()) {
    return NextResponse.json({ error: "El mensaje es obligatorio" }, { status: 400 });
  }
  if (mensaje.trim().length > 1000) {
    return NextResponse.json({ error: "Mensaje demasiado largo" }, { status: 400 });
  }

  const admin = adminClient();
  await admin.from("comunidad_mensajes").insert({
    author_name: "CONTACTO",
    mascota_name: "pendiente",
    message: JSON.stringify({
      nombre: nombre?.trim().slice(0, 100) || "Anónimo",
      email: email?.trim().slice(0, 200) || "",
      mensaje: mensaje.trim().slice(0, 1000),
    }),
  });

  return NextResponse.json({ ok: true });
}
