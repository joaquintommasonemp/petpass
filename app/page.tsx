"use client";
import Link from "next/link";

const FEATURES = [
  { icon: "🤖", title: "Vet IA 24/7", desc: "Consultá síntomas, mandá fotos y recibí orientación instantánea con el historial de tu mascota como contexto.", color: "#4ade80" },
  { icon: "🏥", title: "Historia clínica digital", desc: "Vacunas, consultas, peso, documentos y citas — todo organizado y accesible desde tu celular.", color: "#60a5fa" },
  { icon: "⬛", title: "QR de identificación", desc: "Generá un QR para el collar. Si tu mascota se pierde, cualquiera puede ver sus datos y contactarte.", color: "#a78bfa" },
  { icon: "🐕", title: "Paseos y guarderías", desc: "Compartí un link con el cuidador para que te mande fotos y novedades en tiempo real.", color: "#fb923c" },
  { icon: "📍", title: "Mascotas perdidas", desc: "Publicá alertas con foto, ubicación y contacto directo por WhatsApp en segundos.", color: "#f87171" },
  { icon: "❤️", title: "Adopciones y comunidad", desc: "Encontrá o publicá mascotas en adopción, descuentos veterinarios y conectate con otros dueños.", color: "#f472b6" },
];

const TESTIMONIALS = [
  { texto: "Nunca más me olvidé de una vacuna. La IA me avisa antes que el vet.", nombre: "Valentina M.", mascota: "Luna · Beagle 2 años" },
  { texto: "Gracias a PetPass encontré a mi perro en 3 horas. Lo vieron en el barrio con el QR.", nombre: "Matías R.", mascota: "Thor · Husky 4 años" },
  { texto: "La uso cuando me da cosa llamar al vet de noche. Siempre responde bien.", nombre: "Carolina G.", mascota: "Michi · Gato 5 años" },
];

export default function Home() {
  return (
    <main className="landing-wrapper">

      {/* HERO */}
      <div style={{
        background: "linear-gradient(160deg, #0f2a1a 0%, #0f1117 65%)",
        padding: "52px 24px 40px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, #4ade8025, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #22c55e15, transparent 70%)", pointerEvents: "none" }} />

        <div className="landing-hero-inner">
          <div style={{ fontSize: 52, marginBottom: 16 }}>🐾</div>

          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 16 }}>
            <span style={{ color: "#f0f4ff" }}>Todo lo que tu mascota</span>
            <br />
            <span style={{
              background: "linear-gradient(90deg, #4ade80, #22d3ee)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>necesita, en un solo lugar.</span>
          </h1>

          <p style={{ color: "#94a3b8", fontSize: 15, lineHeight: 1.7, marginBottom: 28, maxWidth: 420, margin: "0 auto 28px" }}>
            Historia clínica digital, IA veterinaria 24/7, QR de identificación, alertas de pérdida y comunidad. Todo gratis.
          </p>

          <Link href="/registro" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#000", borderRadius: 14, padding: "16px 24px",
            fontWeight: 900, fontSize: 16, textDecoration: "none",
            boxShadow: "0 8px 32px #4ade8050", marginBottom: 12,
          }}>
            {"🐾"} Registrá tu mascota gratis
          </Link>

          <Link href="/login" style={{
            display: "block", textAlign: "center",
            color: "#64748b", fontSize: 13, textDecoration: "none", padding: "8px",
          }}>
            Ya tengo cuenta {">"}
          </Link>
        </div>
      </div>

      {/* MOCKUP */}
      <div className="landing-mockup-wrap">
        <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ background: "#181c27", borderBottom: "1px solid #252a3a", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#4ade80" }}>PetPass 🐾</span>
            <span style={{ background: "#4ade8022", color: "#4ade80", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>+ Mascota</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #4ade8033, #22c55e22)", border: "2px solid #4ade8044", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🐶</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "Georgia, serif" }}>Rocky</div>
                <div style={{ color: "#7a8299", fontSize: 12 }}>Labrador · 3 años · Macho</div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  <span style={{ background: "#4ade8022", color: "#4ade80", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>Chip: ...4821</span>
                  <span style={{ background: "#fb923c22", color: "#fb923c", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>24 kg</span>
                </div>
              </div>
            </div>
            <div style={{ background: "#0f1117", borderRadius: 12, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, marginBottom: 6 }}>🤖 Vet IA · Respuesta instantánea</div>
              <div style={{ background: "#181c27", borderRadius: "10px 10px 10px 2px", padding: "8px 12px", fontSize: 12, color: "#f0f4ff", lineHeight: 1.5, border: "1px solid #252a3a" }}>
                Rocky está al día con sus vacunas 💉 La próxima dosis es en <strong style={{ color: "#4ade80" }}>Marzo 2026</strong>. ¿Hay algo que te preocupe?
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 8, borderTop: "1px solid #252a3a" }}>
              {[["🐾","Perfil"],["🏥","Historial"],["🤖","Vet IA"],["🐕","Paseos"],["👥","Comunidad"]].map(([icon, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14 }}>{icon}</div>
                  <div style={{ fontSize: 9, color: label === "Perfil" ? "#4ade80" : "#7a8299", fontWeight: 700 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="landing-stats-row">
        {[
          ["🐾", "+5.000", "mascotas"],
          ["🤖", "24/7", "Vet IA"],
          ["💚", "100%", "gratis"],
        ].map(([icon, val, label]) => (
          <div key={label} style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 14, padding: "14px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 2 }}>{icon}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>{val}</div>
            <div style={{ fontSize: 10, color: "#7a8299", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div className="landing-section">
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Todo incluido, todo gratis</div>
          <div style={{ fontSize: 14, color: "#94a3b8" }}>Una app pensada para el día a día de tu mascota</div>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "#181c27", border: `1px solid ${f.color}20`,
              borderRadius: 16, padding: "16px",
              display: "flex", gap: 14, alignItems: "flex-start",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "#7a8299", lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIOS */}
      <div className="landing-section">
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Lo que dicen los dueños</div>
        </div>
        <div className="landing-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 20, marginBottom: 8, color: "#4ade80" }}>★★★★★</div>
              <div style={{ fontSize: 13, color: "#f0f4ff", lineHeight: 1.6, marginBottom: 10 }}>"{t.texto}"</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #4ade8033, #60a5fa33)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🙂</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{t.nombre}</div>
                  <div style={{ fontSize: 11, color: "#7a8299" }}>{t.mascota}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="landing-cta">
        <div style={{
          background: "linear-gradient(135deg, #0f2a1a, #0f1a2a)",
          border: "1px solid #4ade8030", borderRadius: 20, padding: "32px 24px", textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, lineHeight: 1.3 }}>
            ¿Tu mascota ya tiene su PetPass?
          </h2>
          <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
            Más de 5.000 mascotas ya tienen su perfil digital.<br />Registrá a la tuya en menos de 2 minutos.
          </p>
          <Link href="/registro" style={{
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#000", borderRadius: 14, padding: "16px 32px",
            fontWeight: 900, fontSize: 15, textDecoration: "none",
            display: "inline-block", boxShadow: "0 8px 32px #4ade8050",
          }}>
            Empezar gratis →
          </Link>
          <div style={{ marginTop: 16, color: "#7a8299", fontSize: 11 }}>Sin tarjeta · Sin costo · Para siempre</div>
        </div>
      </div>

    </main>
  );
}
