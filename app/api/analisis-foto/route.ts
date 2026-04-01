import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: "⚠️ API key de Anthropic no configurada." });
  }

  // Verificar que el usuario esté autenticado
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ reply: "⚠️ No autorizado." }, { status: 401 });
  }
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ reply: "⚠️ Sesión inválida." }, { status: 401 });
  }

  const { imageBase64, mediaType, mascotaNombre, mascotaEspecie } = await req.json();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      system: `Sos un veterinario experto en análisis visual. Analizás fotos de mascotas para detectar posibles problemas de salud visibles.
Observá con atención: pelaje, ojos, piel, postura, signos de malestar, heridas, inflamaciones, u otras anomalías.
Sé concreto, empático y siempre recomendá consultar al veterinario ante cualquier duda.
Respondé siempre en español, estructurando tu respuesta en tres partes:
1. **Lo que observo**: descripción breve de lo que ves en la foto.
2. **¿Hay algo preocupante?**: indicá si detectás algo que amerite atención.
3. **Recomendación**: consejo concreto para el dueño.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Esta es una foto de ${mascotaNombre || "mi mascota"}${mascotaEspecie ? ` (${mascotaEspecie})` : ""}. ¿Ves algo que deba revisar o consultar con un veterinario?`,
            },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    const msg = data.error?.message || `Error HTTP ${res.status}`;
    return NextResponse.json({ reply: `⚠️ No pude analizar la imagen (${msg}).` });
  }
  const reply = data.content?.[0]?.text || "No pude analizar la imagen.";
  return NextResponse.json({ reply });
}
