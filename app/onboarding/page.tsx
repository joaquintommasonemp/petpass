"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [activating, setActivating] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      supabase.from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) setUserName(data.full_name.split(" ")[0]);
        });
    });
  }, []);

  async function finish() {
    localStorage.setItem("pp_onboarding_done", "1");
    window.location.href = "/mascota/nueva";
  }

  function skip() {
    localStorage.setItem("pp_onboarding_done", "1");
    window.location.href = "/dashboard";
  }

  return (
    <main style={{
      minHeight: "100dvh",
      background: "linear-gradient(160deg, #F0FDF9 0%, #F4F6FB 60%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 24,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 460,
        boxShadow: "0 8px 48px rgba(28,53,87,0.10)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/">
            <Image src="/logo-brand-official.png" alt="PetPass" width={140} height={40} priority style={{ height: 40, width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              height: 4,
              borderRadius: 2,
              transition: "all 0.3s",
              background: i <= step ? "#2CB8AD" : "#E2E8F0",
              width: i === step ? 32 : 16,
            }} />
          ))}
        </div>

        {/* ── Step 0: Bienvenida ── */}
        {step === 0 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>🐾</div>

            <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1C3557", marginBottom: 10, letterSpacing: "-0.5px" }}>
              {userName ? `¡Hola, ${userName}!` : "¡Bienvenido a PetPass!"}
            </h1>

            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              La app para el cuidado diario de tu mascota.<br />
              Historial clínico, IA veterinaria y mucho más.
            </p>

            {/* Free trial badge */}
            <div style={{
              background: "linear-gradient(135deg, #1C3557 0%, #2CB8AD 100%)",
              borderRadius: 16,
              padding: "16px 20px",
              marginBottom: 28,
              textAlign: "center",
            }}>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginBottom: 4 }}>Tu plan de bienvenida</div>
              <div style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>
                🎁 Gratis hasta el 31/05
              </div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                Sin tarjeta · Sin compromiso · Acceso completo
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "15px 20px",
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
                marginBottom: 10,
              }}
            >
              Empezar →
            </button>
            <button
              onClick={skip}
              style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}
            >
              Explorar primero
            </button>
          </div>
        )}

        {/* ── Step 1: Registrar mascota ── */}
        {step === 1 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>🐶</div>

            <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1C3557", marginBottom: 8, letterSpacing: "-0.3px" }}>
              Registrá a tu mascota
            </h2>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              En 2 minutos queda lista con su perfil completo.<br />
              El historial lo podés ir completando después.
            </p>

            {/* Feature pills */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {[
                { icon: "🤖", title: "Vet IA 24/7", desc: "Consultá síntomas al instante" },
                { icon: "📋", title: "Historial clínico", desc: "Vacunas y consultas ordenadas" },
                { icon: "📱", title: "Carnet QR", desc: "Sus datos siempre a mano" },
                { icon: "🔔", title: "Recordatorios", desc: "Vacunas próximas a vencer" },
              ].map(f => (
                <div key={f.title} style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "14px 12px",
                  textAlign: "left",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#1C3557", marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            <button
              onClick={finish}
              disabled={activating}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "15px 20px",
                fontWeight: 900,
                fontSize: 15,
                cursor: activating ? "not-allowed" : "pointer",
                opacity: activating ? 0.8 : 1,
                boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
                marginBottom: 10,
              }}
            >
              {activating ? "Activando tu mes gratis..." : "Registrar mi mascota →"}
            </button>

            <button
              onClick={() => setStep(0)}
              style={{ background: "none", border: "none", color: "#94A3B8", fontSize: 13, cursor: "pointer" }}
            >
              ← Atrás
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
