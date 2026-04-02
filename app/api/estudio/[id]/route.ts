import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function detectStudyType(fileName: string, aiSummary: string): string {
  const text = (fileName + " " + aiSummary).toLowerCase();
  if (/radiograf|placa|rx\b|rayos[\s_-]?x|xray/.test(text)) return "🩻 Radiografía";
  if (/ecograf|ecogra|ultraso|ecosonogr/.test(text)) return "🔊 Ecografía";
  if (/hemograma|laboratorio|lab\b|sangre|blood|bioquim|analisis|análisis|orina|urin/.test(text)) return "🔬 Laboratorio";
  if (/tomograf|tac\b|\bct\b/.test(text)) return "🏥 Tomografía";
  if (/biopsia/.test(text)) return "🔬 Biopsia";
  if (/electrocardiog|ecg\b|\bekg\b/.test(text)) return "❤️ Electrocardiograma";
  if (/resonancia|mri\b|rmn\b/.test(text)) return "🏥 Resonancia";
  return "📄 Documento";
}

// GET — cargar info del link (público, para la página del veterinario)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = admin();
  const { data: link } = await db.from("estudio_links").select("*").eq("id", params.id).single();
  if (!link || !link.active) return NextResponse.json({ error: "Link no válido o expirado" }, { status: 404 });

  const { data: mascota } = await db.from("mascotas").select("name, breed, age, photo_url").eq("id", link.mascota_id).single();
  return NextResponse.json({ link, mascota });
}

// POST — veterinaria sube un estudio
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = admin();

  const { data: link } = await db.from("estudio_links").select("*").eq("id", params.id).single();
  if (!link || !link.active) return NextResponse.json({ error: "Link inválido" }, { status: 404 });

  const { vetName, note, fileBase64, fileName, fileType } = await req.json();
  if (!fileBase64 || !fileName) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  // Limit: ~10 MB base64
  if (fileBase64.length > 13_500_000) {
    return NextResponse.json({ error: "El archivo supera el limite de 10 MB" }, { status: 413 });
  }

  // Subir archivo al bucket
  const buffer = Buffer.from(fileBase64, "base64");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `estudios/${params.id}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await db.storage.from("comunidad").upload(path, buffer, {
    contentType: fileType || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: "Error al subir archivo: " + uploadError.message }, { status: 500 });

  const { data: urlData } = db.storage.from("comunidad").getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Analizar con IA si es imagen
  let aiSummary = "";
  const isImage = fileType?.startsWith("image/");
  if (isImage && process.env.ANTHROPIC_API_KEY) {
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 600,
          system: "Sos un veterinario experto analizando estudios médicos de mascotas. Extraé los datos más relevantes del estudio: tipo de estudio, hallazgos principales, valores alterados (si los hay), y cualquier indicación o diagnóstico. Sé conciso y estructurado. Respondé en español.",
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: fileType, data: fileBase64 } },
              { type: "text", text: "Analizá este estudio médico veterinario y extraé los datos más relevantes." },
            ],
          }],
        }),
      });
      const data = await res.json();
      if (!data.error) aiSummary = data.content?.[0]?.text || "";
    } catch (e) {
      console.error("[estudio] AI analysis failed:", e);
    }
  }

  // Detectar tipo de estudio
  const studyType = detectStudyType(fileName, aiSummary);

  // Guardar en historial (service role bypasa RLS)
  const summaryParts = [`${fileName}::${publicUrl}`];
  if (note) summaryParts.push(`nota::${note}`);
  if (aiSummary) summaryParts.push(`ia::${aiSummary}`);

  await db.from("historial").insert({
    mascota_id: link.mascota_id,
    title: studyType,
    summary: summaryParts.join("||"),
    date: new Date().toLocaleDateString("es-AR"),
    vet: vetName || "Veterinaria",
  });

  return NextResponse.json({ ok: true, url: publicUrl, aiSummary });
}
