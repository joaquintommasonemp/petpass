"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  {
    icon: "🤖",
    title: "Vet IA 24/7",
    desc: "Consultá síntomas, medicamentos y cuidados con IA entrenada en veterinaria.",
  },
  {
    icon: "📋",
    title: "Historia clínica digital",
    desc: "Vacunas, diagnósticos, estudios y citas en un solo lugar, siempre disponibles.",
  },
  {
    icon: "📱",
    title: "QR de identificación",
    desc: "Carnet digital con QR para que cualquier persona pueda ver los datos de tu mascota.",
  },
  {
    icon: "🔔",
    title: "Recordatorios automáticos",
    desc: "Recibís emails cuando vencen las vacunas de tu mascota.",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = "/login"; return; }
      supabase.from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setUserName(data.full_name.split(" ")[0]);
          }
        });
    });
  }, []);

  function finish() {
    localStorage.setItem("pp_onboarding_done", "1");
    window.location.href = "/mascota/nueva";
  }

  function skip() {
    localStorage.setItem("pp_onboarding_done", "1");
    window.location.href = "/dashboard";
  }

  const steps = [
    // ── Step 0: Bienvenida ──
    <div key="welcome" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🎉</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1C3557", marginBottom: 10, letterSpacing: "-0.5px" }}>
        {userName ? `¡Hola, ${userName}!` : "¡Bienvenido a PetPass!"}
      </h1>
      <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, maxWidth: 380, margin: "0 auto 32px" }}>
        Sos parte de la comunidad que cuida mejor a sus mascotas.<br />
        En 2 minutos te mostramos todo lo que podés hacer.
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
        {["🐶", "🐱", "🐦", "🐠", "🐇"].map(e => (
          <span key={e} style={{ fontSize: 28 }}>{e}</span>
        ))}
      </div>
    </div>,

    // ── Step 1: Features ──
    <div key="features">
      <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 6, textAlign: "center" }}>
        Todo lo que tiene PetPass
      </h2>
      <p style={{ color: "#64748B", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
        Diseñado para simplificar el cuidado de tu mascota
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{
            display: "flex", alignItems: "flex-start", gap: 14,
            background: "#F8FAFC", border: "1px solid #E2E8F0",
            borderRadius: 14, padding: "14px 16px",
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg, #E5F7F6, #B2E8E5)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>{f.icon}</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#1C3557", marginBottom: 3 }}>{f.title}</div>
              <div style={{ color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // ── Step 2: CTA registrar mascota ──
    <div key="cta" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🐾</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: "#1C3557", marginBottom: 10, letterSpacing: "-0.3px" }}>
        Registrá tu primera mascota
      </h2>
      <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 28px" }}>
        Nombre, foto, raza, vacunas... todo en un formulario simple.
        Después podés completar el historial clínico cuando quieras.
      </p>
      <div style={{
        background: "linear-gradient(135deg, #F0FDF9, #E5F7F6)",
        border: "1px solid #B2E8E5", borderRadius: 16, padding: "16px 20px",
        marginBottom: 24, display: "inline-block", width: "100%", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {[["📋", "Historia clínica"], ["💉", "Vacunas"], ["📱", "Carnet QR"]].map(([icon, label]) => (
            <div key={label as string} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#2CB8AD" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
  ];

  const isLast = step === steps.length - 1;

  return (
    <main style={{
      minHeight: "100vh", background: "#F4F6FB",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, padding: "40px 36px",
        width: "100%", maxWidth: 480,
        boxShadow: "0 4px 40px rgba(28,53,87,0.12)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/">
            <Image src="/logo-brand-official.png" alt="PetPass" width={160} height={44} priority style={{ height: 44, width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 32 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2, transition: "all 0.3s",
              background: i <= step ? "#2CB8AD" : "#E2E8F0",
              width: i === step ? 28 : 16,
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ minHeight: 280 }}>
          {steps[step]}
        </div>

        {/* Actions */}
        <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
          {isLast ? (
            <>
              <button onClick={finish} style={{
                background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff", border: "none", borderRadius: 14,
                padding: "15px 20px", fontWeight: 900, fontSize: 15,
                boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
                cursor: "pointer", width: "100%",
              }}>
                Agregar mi primera mascota →
              </button>
              <button onClick={skip} style={{
                background: "none", border: "1px solid #E2E8F0",
                borderRadius: 14, padding: "12px 20px",
                color: "#94A3B8", fontSize: 14, cursor: "pointer", width: "100%",
              }}>
                Explorar primero
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep(s => s + 1)} style={{
                background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff", border: "none", borderRadius: 14,
                padding: "15px 20px", fontWeight: 900, fontSize: 15,
                boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
                cursor: "pointer", width: "100%",
              }}>
                {step === 0 ? "Comenzar →" : "Siguiente →"}
              </button>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  background: "none", border: "none",
                  color: "#94A3B8", fontSize: 14, cursor: "pointer",
                }}>
                  ← Atrás
                </button>
              )}
              {step === 0 && (
                <button onClick={skip} style={{
                  background: "none", border: "none",
                  color: "#94A3B8", fontSize: 13, cursor: "pointer",
                }}>
                  Saltar introducción
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
