import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
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

  const { vetName, note, fileBase64, fileName, fileType, studyType } = await req.json();
  if (!fileBase64 || !fileName) return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });

  // Limit: ~10 MB base64
  if (fileBase64.length > 13_500_000) {
    return NextResponse.json({ error: "El archivo supera el limite de 10 MB" }, { status: 413 });
  }

  // Validar MIME type permitido
  const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (fileType && !ALLOWED_MIME.includes(fileType)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 415 });
  }

  // Validar magic bytes del buffer para verificar tipo real
  const buffer = Buffer.from(fileBase64, "base64");
  const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
  const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isPdf  = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;

  if (!isJpeg && !isPng && !isPdf && !isWebp) {
    return NextResponse.json({ error: "El archivo no es una imagen o PDF válido" }, { status: 415 });
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `estudios/${params.id}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await db.storage.from("comunidad").upload(path, buffer, {
    contentType: fileType || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: "Error al subir archivo: " + uploadError.message }, { status: 500 });

  const { data: urlData } = db.storage.from("comunidad").getPublicUrl(path);
  const publicUrl = urlData.publicUrl;

  // Analizar con IA si es imagen o PDF
  let aiSummary = "";
  const isImage = fileType?.startsWith("image/");
  const isPdfFile = fileType === "application/pdf";
  if ((isImage || isPdfFile) && process.env.ANTHROPIC_API_KEY) {
    try {
      const contentBlock = isImage
        ? { type: "image", source: { type: "base64", media_type: fileType, data: fileBase64 } }
        : { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2024-11-01",
          ...(isPdfFile ? { "anthropic-beta": "pdfs-2024-09-25" } : {}),
        },
        body: JSON.stringify({
          model: "claude-opus-4-6",
          max_tokens: 800,
          system: "Sos un veterinario experto analizando estudios médicos de mascotas. Extraé los datos más relevantes del estudio: tipo de estudio, hallazgos principales, valores con sus números (normales y alterados si los hay), diagnóstico o conclusión del veterinario, y cualquier indicación de seguimiento. Sé completo pero conciso. Respondé en español.",
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
        console.error("[estudio] AI analysis API error:", JSON.stringify(data.error));
      } else {
        aiSummary = data.content?.[0]?.text || "";
      }
    } catch (e) {
      console.error("[estudio] AI analysis failed:", e);
    }
  }

  // Usar tipo elegido por el vet, o auto-detectar como fallback
  const resolvedStudyType = studyType && studyType !== "Otro" ? studyType : detectStudyType(fileName, aiSummary);

  // Guardar en historial (service role bypasa RLS)
  const summaryParts = [`${fileName}::${publicUrl}`];
  if (note) summaryParts.push(`nota::${note}`);
  if (aiSummary) summaryParts.push(`ia::${aiSummary}`);

  await db.from("historial").insert({
    mascota_id: link.mascota_id,
    title: resolvedStudyType,
    summary: summaryParts.join("||"),
    date: new Date().toLocaleDateString("es-AR"),
    vet: vetName || "Veterinaria",
  });

  return NextResponse.json({ ok: true, url: publicUrl, aiSummary });
}
