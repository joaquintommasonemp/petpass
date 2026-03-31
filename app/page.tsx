"use client";
import Link from "next/link";

const FEATURES = [
  { icon: "🤖", title: "IA Veterinaria 24/7", desc: "Consultá síntomas, mandá fotos y recibí orientación al instante", color: "#4ade80" },
  { icon: "🏥", title: "Historia clínica", desc: "Vacunas, consultas y documentos siempre a mano", color: "#60a5fa" },
  { icon: "👥", title: "Comunidad", desc: "Adopciones, mascotas perdidas y descuentos exclusivos", color: "#f472b6" },
  { icon: "🔔", title: "Recordatorios", desc: "Nunca más olvidés una vacuna o desparasitación", color: "#fb923c" },
];

const STEPS = [
  { n: "1", title: "Creá tu cuenta", desc: "Gratis, en menos de un minuto" },
  { n: "2", title: "Registrá tu mascota", desc: "Nombre, raza, edad, foto y más" },
  { n: "3", title: "Accedé a todo", desc: "IA, historial, comunidad y más desde tu celu" },
];

const STATS = [
  { value: "+5.000", label: "mascotas registradas" },
  { value: "24/7", label: "IA veterinaria" },
  { value: "100%", label: "gratuito" },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 440, margin: "0 auto", minHeight: "100vh", overflow: "hidden" }}>

      {/* Hero */}
      <div style={{ padding: "48px 24px 32px", textAlign: "center", position: "relative" }}>
        {/* Blob decoration */}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, #4ade8015 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#4ade8015", border: "1px solid #4ade8030",
          borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700,
          color: "#4ade80", marginBottom: 24,
        }}>
          🐾 La app de mascotas de Argentina
        </div>

        <div style={{ fontSize: 72, marginBottom: 16, lineHeight: 1 }}>🐶🐱</div>

        <h1 style={{
          fontSize: 34, fontWeight: 900, lineHeight: 1.15, marginBottom: 16,
          background: "linear-gradient(135deg, #f0f4ff 0%, #4ade80 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          El pasaporte digital de tu mascota
        </h1>

        <p style={{ color: "#7a8299", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Historia clínica, IA veterinaria, alertas de mascotas perdidas y comunidad — todo en un solo lugar.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/registro" style={{
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#000", borderRadius: 14, padding: "16px",
            fontWeight: 800, fontSize: 16, textDecoration: "none",
            display: "block", boxShadow: "0 4px 24px #4ade8040",
          }}>
            Crear cuenta gratis →
          </Link>
          <Link href="/login" style={{
            background: "#181c27", color: "#f0f4ff",
            border: "1px solid #252a3a", borderRadius: 14, padding: "15px",
            fontWeight: 600, fontSize: 15, textDecoration: "none", display: "block",
          }}>
            Ya tengo cuenta
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", margin: "0 24px 32px", background: "#181c27", border: "1px solid #252a3a", borderRadius: 16 }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            flex: 1, textAlign: "center", padding: "16px 8px",
            borderRight: i < STATS.length - 1 ? "1px solid #252a3a" : "none",
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#4ade80" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#7a8299", marginTop: 2, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          Todo lo que necesitás
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "#181c27",
              border: `1px solid ${f.color}22`,
              borderRadius: 16, padding: "18px 14px",
            }}>
              <div style={{
                fontSize: 28, marginBottom: 10, width: 48, height: 48,
                background: f.color + "18", borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{f.icon}</div>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#f0f4ff", marginBottom: 5 }}>{f.title}</div>
              <div style={{ fontSize: 11, color: "#7a8299", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{ padding: "0 24px 32px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
          Empezá en 3 pasos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              background: "#181c27", border: "1px solid #252a3a",
              borderRadius: 14, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #4ade80, #22c55e)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 900, fontSize: 16, color: "#000",
              }}>{s.n}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: "#7a8299", marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA final */}
      <div style={{ margin: "0 24px 48px" }}>
        <div style={{
          background: "linear-gradient(135deg, #181c27, #1a2535)",
          border: "1px solid #4ade8030", borderRadius: 20,
          padding: "28px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🐾</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
            Tu mascota merece lo mejor
          </h2>
          <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
            Sumá a tu compañero en segundos.<br />Sin costo, sin complicaciones.
          </p>
          <Link href="/registro" style={{
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#000", borderRadius: 12, padding: "14px 32px",
            fontWeight: 800, fontSize: 15, textDecoration: "none",
            display: "inline-block", boxShadow: "0 4px 20px #4ade8035",
          }}>
            Registrar mi mascota gratis
          </Link>
        </div>
      </div>

    </main>
  );
}
