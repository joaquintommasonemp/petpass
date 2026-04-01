import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FREE_LIMIT = 5;

export async function POST(req: NextRequest) {
  try {
    const { system, messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ reply: "⚠️ API key de Anthropic no configurada. Agregá ANTHROPIC_API_KEY en Vercel." });
    }

    // ── Verificar límite freemium ──────────────────────────────────────────
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    let usedCount = 0;

    if (token && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: { user } } = await admin.auth.getUser(token);

      if (user) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const { data: profile } = await admin
          .from("profiles")
          .select("ia_uses_count, ia_uses_month, is_premium, is_admin")
          .eq("id", user.id)
          .single();

        const isPremium = profile?.is_premium === true || profile?.is_admin === true;

        if (!isPremium) {
          const sameMonth = profile?.ia_uses_month === currentMonth;
          const count = sameMonth ? (profile?.ia_uses_count || 0) : 0;
          usedCount = count + 1;

          if (count >= FREE_LIMIT) {
            return NextResponse.json({
              reply: null,
              limitReached: true,
              used: count,
              limit: FREE_LIMIT,
            });
          }

          await admin.from("profiles").update({
            ia_uses_count: sameMonth ? count + 1 : 1,
            ia_uses_month: currentMonth,
          }).eq("id", user.id);
        }
      }
    }

    // ── Llamar a Anthropic ─────────────────────────────────────────────────
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
    return NextResponse.json({ reply, used: usedCount, limit: FREE_LIMIT });
  } catch (e: any) {
    console.error("Chat route error:", e);
    return NextResponse.json({ reply: `⚠️ Error interno: ${e.message}` });
  }
}
