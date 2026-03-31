import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { system, messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ reply: "⚠️ API key de Anthropic no configurada. Agregá ANTHROPIC_API_KEY en las variables de entorno de Vercel." });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
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
    return NextResponse.json({ reply });
  } catch (e: any) {
    console.error("Chat route error:", e);
    return NextResponse.json({ reply: `⚠️ Error interno: ${e.message}` });
  }
}
