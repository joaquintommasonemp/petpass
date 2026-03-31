"use client";
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ maxWidth: 440, margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🐾</div>
      <h1 style={{
        fontFamily: "Georgia, serif",
        fontSize: 36,
        fontWeight: 800,
        color: "#4ade80",
        marginBottom: 8,
      }}>PetPass</h1>
      <p style={{ color: "#7a8299", fontSize: 15, marginBottom: 40, lineHeight: 1.6 }}>
        El documento de identidad digital de tu mascota.<br />
        Historia clínica, vacunas, IA veterinaria y más.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Link href="/registro" style={{
          background: "#4ade80",
          color: "#000",
          borderRadius: 12,
          padding: "14px",
          fontWeight: 800,
          fontSize: 15,
          textDecoration: "none",
          display: "block",
        }}>Crear cuenta gratis</Link>

        <Link href="/login" style={{
          background: "#181c27",
          color: "#f0f4ff",
          border: "1px solid #252a3a",
          borderRadius: 12,
          padding: "14px",
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
          display: "block",
        }}>Ya tengo cuenta</Link>
      </div>

      <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { icon: "🤖", title: "IA Veterinaria", desc: "Consultá con IA que conoce a tu mascota" },
          { icon: "🏥", title: "Historia clínica", desc: "Todo el historial en un solo lugar" },
          { icon: "📍", title: "Mascotas perdidas", desc: "Alertas geolocalrizadas en tu zona" },
          { icon: "💉", title: "Recordatorios", desc: "Nunca más olvidés una vacuna" },
        ].map((f, i) => (
          <div key={i} style={{
            background: "#181c27",
            border: "1px solid #252a3a",
            borderRadius: 14,
            padding: 16,
            textAlign: "left",
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#f0f4ff", marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "#7a8299", lineHeight: 1.4 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
