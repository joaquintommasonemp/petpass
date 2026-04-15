"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

const MAX_WAIT_MS = 90_000;   // 90 segundos máximo
const POLL_INTERVAL = 4_000;  // cada 4 segundos

export default function PremiumExitoPage() {
  const [status, setStatus] = useState<"checking" | "active" | "pending">("checking");
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const supabase = createClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function check() {
      const now = Date.now();
      const ms = now - startRef.current;
      setElapsed(ms);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", session.user.id)
        .single();

      if (profile?.is_premium) {
        setStatus("active");
        return;
      }

      if (ms >= MAX_WAIT_MS) {
        setStatus("pending");
        return;
      }

      timer = setTimeout(check, POLL_INTERVAL);
    }

    check();
    return () => clearTimeout(timer);
  }, []);

  const progressPct = Math.min(100, (elapsed / MAX_WAIT_MS) * 100);
  const secondsLeft = Math.max(0, Math.ceil((MAX_WAIT_MS - elapsed) / 1000));

  if (status === "checking") return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <div style={{ width: 52, height: 52, border: "4px solid #E2E8F0", borderTopColor: "#2CB8AD", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#1C3557", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Confirmando tu suscripción...</p>
        <p style={{ color: "#94A3B8", fontSize: 13 }}>Puede demorar hasta {secondsLeft}s</p>
      </div>
      {/* Barra de progreso */}
      <div style={{ width: 200, height: 4, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progressPct}%`, background: "#2CB8AD", borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #E5F7F6 0%, #F4F6FB 60%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>

        <div style={{ fontSize: 72, marginBottom: 16 }}>{status === "active" ? "✨" : "⏳"}</div>

        {status === "active" ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1C3557", marginBottom: 10, letterSpacing: "-0.5px" }}>
              ¡Bienvenido a Premium!
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
              Tu suscripción está activa. Ahora tenés acceso a la Vet IA ilimitada, análisis de fotos, recordatorios automáticos y todos los beneficios Premium.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {["🤖 Vet IA sin límite", "📷 Análisis de fotos y estudios", "💊 Recordatorios de vacunas", "🎁 Descuentos exclusivos"].map(b => (
                <div key={b} style={{ background: "#fff", border: "1px solid #B2E8E5", borderRadius: 12, padding: "12px 16px", fontSize: 14, color: "#1C3557", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#2CB8AD", fontWeight: 900 }}>✓</span> {b}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1C3557", marginBottom: 10 }}>
              Pago recibido
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>
              Estamos procesando tu suscripción. En unos minutos tu cuenta se actualizará a Premium automáticamente.
            </p>
            <p style={{ color: "#94A3B8", fontSize: 13, marginBottom: 32 }}>
              Si en las próximas horas no se activa, contactanos a{" "}
              <a href="mailto:petpass.app@gmail.com" style={{ color: "#2CB8AD" }}>petpass.app@gmail.com</a>.
            </p>
          </>
        )}

        <Link href={status === "active" ? "/dashboard/chat" : "/dashboard"} style={{
          display: "block", background: "linear-gradient(135deg, #2CB8AD, #229E94)",
          color: "#fff", borderRadius: 14, padding: "16px 20px",
          fontWeight: 900, fontSize: 16, textDecoration: "none",
          boxShadow: "0 4px 20px rgba(44,184,173,0.35)", marginBottom: 12,
        }}>
          {status === "active" ? "Ir al Vet IA →" : "Ir al dashboard →"}
        </Link>

        <Link href="/dashboard" style={{ color: "#94A3B8", fontSize: 13, textDecoration: "none" }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
