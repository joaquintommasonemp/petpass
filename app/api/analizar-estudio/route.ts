import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  // Verificar autenticación
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = admin();
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { historialId, publicUrl, fileName, fileType } = await req.json();
  if (!historialId || !publicUrl || !fileName) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  // Verificar que el historialId pertenece al usuario autenticado
  const { data: histEntry } = await db
    .from("historial")
    .select("id, mascota_id, mascotas!inner(user_id)")
    .eq("id", historialId)
    .single();

  if (!histEntry || (histEntry.mascotas as any)?.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Sin API key" }, { status: 500 });
  }

  const isImage = fileType?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(fileName);
  const isPdf = fileType === "application/pdf" || /\.pdf$/i.test(fileName);
  if (!isImage && !isPdf) {
    return NextResponse.json({ ok: false, reason: "Tipo no analizable" });
  }

  // Validar que publicUrl apunte al storage de Supabase (evitar SSRF)
  const supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname;
  try {
    const parsedUrl = new URL(publicUrl);
    if (parsedUrl.hostname !== supabaseHost) {
      return NextResponse.json({ error: "URL no permitida" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 });
  }

  // Descargar archivo desde Supabase Storage
  let fileBase64: string;
  let detectedType: string;
  try {
    const res = await fetch(publicUrl);
    if (!res.ok) return NextResponse.json({ error: "No se pudo descargar el archivo" }, { status: 400 });
    const buffer = await res.arrayBuffer();
    fileBase64 = Buffer.from(buffer).toString("base64");
    detectedType = isPdf ? "application/pdf" : (fileType || "image/jpeg");
  } catch {
    return NextResponse.json({ error: "Error descargando archivo" }, { status: 500 });
  }

  // Analizar con Anthropic
  let aiSummary = "";
  try {
    const contentBlock = isImage
      ? { type: "image", source: { type: "base64", media_type: detectedType, data: fileBase64 } }
      : { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 800,
        system: "Sos un veterinario experto analizando estudios médicos de mascotas. Extraé los datos más relevantes: tipo de estudio, hallazgos principales, todos los valores numéricos con sus rangos normales, diagnóstico o conclusión, e indicaciones de seguimiento. Sé completo y estructurado. Respondé en español.",
        messages: [{
          role: "user",
          content: [
            contentBlock,
            { type: "text", text: "Analizá este estudio médico veterinario y extraé todos los datos relevantes incluyendo valores numéricos." },
          ],
        }],
      }),
    });

    const data = await res.json();
    if (data.error) {
      console.error("[analizar-estudio] Anthropic error:", JSON.stringify(data.error));
      return NextResponse.json({ error: "Error de análisis IA: " + data.error.message }, { status: 500 });
    }
    aiSummary = data.content?.[0]?.text || "";
  } catch (e) {
    console.error("[analizar-estudio] fetch error:", e);
    return NextResponse.json({ error: "Error llamando a la IA" }, { status: 500 });
  }

  if (!aiSummary) {
    return NextResponse.json({ error: "La IA no devolvió análisis" }, { status: 500 });
  }

  // Actualizar el registro de historial agregando ia:: al summary
  const { data: entry } = await db.from("historial").select("summary").eq("id", historialId).single();
  if (!entry) return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 });

  // Quitar ia:: viejo si existía y agregar el nuevo
  const parts = (entry.summary || "").split("||").filter((p: string) => !p.startsWith("ia::"));
  parts.push(`ia::${aiSummary}`);
  const newSummary = parts.join("||");

  await db.from("historial").update({ summary: newSummary }).eq("id", historialId);

  return NextResponse.json({ ok: true, aiSummary });
}
