import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FREE_LIMIT = 5;

function makeAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Parsea "archivo.pdf::url||nota::texto||ia::resumen"
function parseDocSummary(raw: string) {
  const segments = raw.split("||");
  const firstSep = segments[0].indexOf("::");
  const fileName = firstSep >= 0 ? segments[0].slice(0, firstSep) : segments[0];
  let nota = "", ia = "";
  for (let i = 1; i < segments.length; i++) {
    const sep = segments[i].indexOf("::");
    if (sep < 0) continue;
    const key = segments[i].slice(0, sep);
    const val = segments[i].slice(sep + 2);
    if (key === "nota") nota = val;
    if (key === "ia") ia = val;
  }
  return { fileName, nota, ia };
}

// Construye el system prompt completamente server-side desde datos de BD.
// El cliente nunca puede inyectar instrucciones en este prompt.
function buildSystemPrompt(mascota: any, historial: any[], vacunas: any[], alimentacion: any[]): string {
  const consultas = historial.filter((h: any) =>
    h.title &&
    !["Actualizacion de peso", "Peso inicial", "📅 Cita"].includes(h.title) &&
    !(typeof h.summary === "string" && h.summary.includes("::"))
  );
  const docItems = historial.filter((h: any) =>
    typeof h.summary === "string" && h.summary.includes("::")
  );
  const citas = historial.filter((h: any) => h.title === "📅 Cita");

  const vacsText = vacunas.length > 0
    ? vacunas.map((v: any) => {
        const next = v.next_date ? `, proxima ${v.next_date}` : "";
        return `- ${v.name}: aplicada ${v.date}${next}, estado: ${v.status || "ok"}`;
      }).join("\n")
    : "- Sin vacunas registradas";

  const consultasText = consultas.length > 0
    ? consultas.slice(0, 8).map((h: any) => {
        const sum = h.summary ? ` - ${h.summary}` : "";
        const vet = h.vet ? ` (Vet: ${h.vet})` : "";
        return `- ${h.date || "sin fecha"}: ${h.title}${sum}${vet}`;
      }).join("\n")
    : "- Sin consultas registradas";

  const alimentText = alimentacion.length > 0
    ? alimentacion.map((a: any) => {
        const notas = a.notas ? ` (${a.notas})` : "";
        return `- ${a.marca || a.tipo || "alimento"}: ${a.frecuencia || ""}${notas}`;
      }).join("\n")
    : "- No registrada";

  const docsText = docItems.length > 0
    ? docItems.map((d: any) => {
        const { fileName, nota, ia } = parseDocSummary(d.summary);
        const lines = [`- ${fileName} (${d.date || "sin fecha"}) — ${d.title || "Documento"}`];
        if (nota) lines.push(`  Notas del veterinario: ${nota}`);
        if (ia) lines.push(`  Análisis IA del archivo: ${ia}`);
        return lines.join("\n");
      }).join("\n\n")
    : "- Sin documentos";

  const citasText = citas.length > 0
    ? citas.map((c: any) => {
        const vet = c.vet ? ` con ${c.vet}` : "";
        return `- ${c.date}: ${c.summary}${vet}`;
      }).join("\n")
    : "- Sin citas agendadas";

  const castrado = mascota.castrado ? ` | Castrado/a: ${mascota.castrado}` : "";

  return [
    `Sos VetIA, el veterinario digital de PetPass. Tenes acceso al perfil medico COMPLETO de ${mascota.name} y debes usarlo en cada respuesta.`,
    "",
    `PERFIL DE ${mascota.name.toUpperCase()}:`,
    `- Especie/Raza: ${mascota.breed || "N/A"} | Edad: ${mascota.age || "N/A"} | Peso: ${mascota.weight || "N/A"} | Sexo: ${mascota.sex || "N/A"}`,
    `- Color: ${mascota.color || "N/A"} | Chip: ${mascota.chip || "N/A"} | Zona: ${mascota.location || "N/A"}${castrado}`,
    "",
    "VACUNAS Y DESPARASITACIONES:",
    vacsText,
    "",
    "HISTORIAL CLINICO:",
    consultasText,
    "",
    "ALIMENTACION:",
    alimentText,
    "",
    "ESTUDIOS Y DOCUMENTOS MEDICOS:",
    "IMPORTANTE: Cuando un estudio tiene 'Análisis IA', ese texto ES el contenido completo del archivo — usalo para responder con precisión. Cuando el campo de análisis está vacío, decile al usuario que ese estudio aún no fue procesado y que puede usar el botón 'Re-analizar' en el tab Estudios. NUNCA inventes que el PDF es ilegible, escaneado o protegido — eso no lo podés saber.",
    docsText,
    "",
    "PROXIMAS CITAS:",
    citasText,
    "",
    "INSTRUCCIONES DE RESPUESTA:",
    `1. Usa SIEMPRE el nombre ${mascota.name} y los datos del perfil para personalizar cada respuesta.`,
    "2. Estructura tus respuestas con secciones claras cuando sea necesario (que pasa, que hacer, cuando ir al vet).",
    "3. Si el sintoma puede ser urgente, marcalo claramente con 'ATENCION URGENTE' al principio.",
    "4. Si la pregunta es vaga o necesitas mas datos, hace UNA pregunta puntual y concisa.",
    "5. Cuando analices fotos o documentos medicos: describe detalladamente lo que ves, valores importantes y recomendaciones.",
    "6. Si te mandan imagenes de estudios (radiografia, ecografia, analisis): interpreta los valores, compara con rangos normales para la especie/raza/edad y explica en terminos simples.",
    "7. Menciona cuando algo puede estar relacionado con su historial, vacunas o alimentacion registrada.",
    "8. Siempre termina con una linea breve sobre cuando consultar al veterinario presencialmente.",
    "9. Responde en espanol rioplatense, tono calido y profesional. Maximo 300 palabras salvo que sea un analisis de documento complejo.",
    "10. Tu orientacion no reemplaza la consulta veterinaria presencial.",
    "11. Si un estudio no tiene análisis IA, decile al usuario: 'Este estudio todavía no fue procesado. Podés re-analizarlo desde el tab Estudios con el botón Re-analizar.' NUNCA inventes razones técnicas (PDF escaneado, protegido, ilegible) porque no tenés forma de saberlo.",
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mascotaId, messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ reply: "Solicitud inválida." }, { status: 400 });
    }
    if (messages.length > 40) {
      return NextResponse.json({ reply: "Conversación demasiado larga. Iniciá una nueva." }, { status: 400 });
    }
    if (!mascotaId || typeof mascotaId !== "string") {
      return NextResponse.json({ reply: "Solicitud inválida." }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ reply: "⚠️ API key de Anthropic no configurada. Agregá ANTHROPIC_API_KEY en Vercel." });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ reply: "No autorizado." }, { status: 401 });

    const admin = makeAdmin();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ reply: "No autorizado." }, { status: 401 });

    // Verificar que la mascota pertenece al usuario autenticado
    const { data: mascota } = await admin
      .from("mascotas")
      .select("*")
      .eq("id", mascotaId)
      .eq("user_id", user.id)
      .eq("active", true)
      .single();

    if (!mascota) return NextResponse.json({ reply: "Mascota no encontrada." }, { status: 404 });

    // Verificar límite freemium
    const { data: profile } = await admin
      .from("profiles")
      .select("is_premium, is_admin")
      .eq("id", user.id)
      .single();

    const isPremium = profile?.is_premium === true || profile?.is_admin === true;
    let usedCount = 0;

    if (!isPremium) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: result, error: rpcError } = await admin.rpc("increment_ia_usage", {
        p_user_id: user.id,
        p_month: currentMonth,
        p_limit: FREE_LIMIT,
      });
      if (rpcError) console.error("Error en increment_ia_usage:", rpcError.message);
      if (!result?.allowed) {
        return NextResponse.json({
          reply: null,
          limitReached: true,
          used: result?.count ?? FREE_LIMIT,
          limit: FREE_LIMIT,
        });
      }
      usedCount = result.count;
    }

    // Construir system prompt desde BD — el cliente no puede inyectar instrucciones
    const [{ data: historial }, { data: vacunas }, { data: alimentacion }] = await Promise.all([
      admin.from("historial").select("*").eq("mascota_id", mascotaId).order("created_at", { ascending: false }),
      admin.from("vacunas").select("*").eq("mascota_id", mascotaId),
      admin.from("alimentacion").select("*").eq("mascota_id", mascotaId),
    ]);

    const systemPrompt = buildSystemPrompt(
      mascota,
      historial || [],
      vacunas || [],
      alimentacion || []
    );

    // Llamar a Anthropic
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "pdfs-2024-09-25",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      const msg = data.error?.message || `Error HTTP ${res.status}`;
      console.error("Anthropic API error:", data.error || res.status);
      return NextResponse.json({ reply: `⚠️ La IA no está disponible (${msg}). Revisá la API key en Vercel.` });
    }

    const reply = data.content?.[0]?.text || "Respuesta vacía.";

    // Loggear uso
    try {
      await admin.from("ia_usage").insert({
        user_id: user.id,
        is_premium: isPremium,
        input_tokens: data.usage?.input_tokens ?? null,
        output_tokens: data.usage?.output_tokens ?? null,
      });
    } catch {}

    return NextResponse.json({ reply, used: usedCount, limit: FREE_LIMIT });
  } catch (e: any) {
    console.error("Chat route error:", e);
    return NextResponse.json({ reply: `⚠️ Error interno: ${e.message}` });
  }
}
