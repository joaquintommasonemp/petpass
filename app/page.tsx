"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CuentaEliminadaBanner() {
  const params = useSearchParams();
  if (params.get("cuenta") !== "eliminada") return null;
  return (
    <div style={{
      background: "#F0FDF4", border: "1px solid #BBF7D0",
      borderRadius: 12, padding: "14px 20px", marginBottom: 16,
      fontSize: 13, color: "#166534", display: "flex", gap: 10, alignItems: "center",
    }}>
      <span style={{ fontSize: 18 }}>✅</span>
      <span>Tu cuenta fue eliminada correctamente. Todos tus datos fueron borrados. Gracias por haber usado PetPass.</span>
    </div>
  );
}

const FEATURES = [
  { icon: "🤖", title: "Vet IA 24/7", desc: "Consultá síntomas, mandá fotos y recibí orientación instantánea con el historial de tu mascota como contexto.", color: "#2CB8AD" },
  { icon: "🏥", title: "Historia clínica digital", desc: "Vacunas, consultas, peso, documentos y citas — todo organizado y accesible desde tu celular.", color: "#3B82F6" },
  { icon: "⬛", title: "QR de identificación", desc: "Generá un QR para el collar. Si tu mascota se pierde, cualquiera puede ver sus datos y contactarte.", color: "#8B5CF6" },
  { icon: "🐕", title: "Paseos y guarderías", desc: "Compartí un link con el cuidador para que te mande fotos y novedades en tiempo real.", color: "#F97316" },
  { icon: "📍", title: "Mascotas perdidas", desc: "Publicá alertas con foto, ubicación y contacto directo por WhatsApp en segundos.", color: "#EF4444" },
  { icon: "❤️", title: "Adopciones y comunidad", desc: "Encontrá o publicá mascotas en adopción, descuentos veterinarios y conectate con otros dueños.", color: "#EC4899" },
];

const TESTIMONIALS = [
  { texto: "Nunca más me olvidé de una vacuna. La IA me avisa antes que el vet.", nombre: "Valentina M.", mascota: "Luna · Beagle 2 años" },
  { texto: "Gracias a PetPass encontré a mi perro en 3 horas. Lo vieron en el barrio con el QR.", nombre: "Matías R.", mascota: "Thor · Husky 4 años" },
  { texto: "La uso cuando me da cosa llamar al vet de noche. Siempre responde bien.", nombre: "Carolina G.", mascota: "Michi · Gato 5 años" },
];

export default function Home() {
  return (
    <main className="landing-wrapper">

      {/* Banner cuenta eliminada */}
      <Suspense fallback={null}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "12px 24px 0" }}>
          <CuentaEliminadaBanner />
        </div>
      </Suspense>

      {/* NAV */}
      <div style={{
        background: "#FFFFFFee", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E8F0",
        padding: "14px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        maxWidth: 1100, margin: "0 auto",
      }}>
        <img src="/logo.png" alt="PetPass" style={{ height: 44, width: "auto", objectFit: "contain" }} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Link href="/login" style={{
            color: "#64748B", fontSize: 13, fontWeight: 600, textDecoration: "none",
            padding: "8px 16px", borderRadius: 10, border: "1px solid #E2E8F0",
          }}>Iniciar sesión</Link>
          <Link href="/registro" style={{
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none",
            padding: "8px 18px", borderRadius: 10,
            boxShadow: "0 4px 16px rgba(44,184,173,0.3)",
          }}>Registrarse gratis</Link>
        </div>
      </div>

      {/* HERO */}
      <div style={{
        background: "linear-gradient(160deg, #F0FAFA 0%, #F4F6FB 60%, #EEF2FF 100%)",
        padding: "60px 24px 52px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
        borderBottom: "1px solid #E2E8F0",
      }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #2CB8AD18, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, #3B82F610, transparent 70%)", pointerEvents: "none" }} />

        <div className="landing-hero-inner">
          {/* Logo grande */}
          <div style={{ marginBottom: 28, display: "flex", justifyContent: "center" }}>
            <img src="/logo.png" alt="PetPass" style={{ height: 72, width: "auto", objectFit: "contain" }} />
          </div>

          <h1 style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, marginBottom: 18, color: "#1C3557" }}>
            Todo lo que tu mascota
            <br />
            <span style={{
              background: "linear-gradient(90deg, #2CB8AD, #229E94)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>necesita, en un solo lugar.</span>
          </h1>

          <p style={{ color: "#64748B", fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: "0 auto 32px" }}>
            Historia clínica digital, IA veterinaria 24/7, QR de identificación, alertas de pérdida y comunidad. Todo gratis.
          </p>

          <Link href="/registro" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff", borderRadius: 14, padding: "16px 32px",
            fontWeight: 900, fontSize: 16, textDecoration: "none",
            boxShadow: "0 8px 32px rgba(44,184,173,0.35)", marginBottom: 14,
          }}>
            🐾 Registrá tu mascota gratis
          </Link>

          <div>
            <Link href="/login" style={{
              color: "#64748B", fontSize: 13, textDecoration: "none", padding: "8px",
              display: "inline-block",
            }}>
              Ya tengo cuenta →
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 28, flexWrap: "wrap" }}>
            {["✅ Sin tarjeta de crédito", "🔒 100% seguro", "🐾 Gratis para siempre"].map(b => (
              <span key={b} style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* MOCKUP */}
      <div className="landing-mockup-wrap">
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(28,53,87,0.10)",
        }}>
          {/* App header */}
          <div style={{
            background: "#FFFFFFee", backdropFilter: "blur(12px)",
            borderBottom: "1px solid #E2E8F0",
            padding: "12px 16px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <img src="/logo.png" alt="PetPass" style={{ height: 32, width: "auto", objectFit: "contain" }} />
            <span style={{
              background: "linear-gradient(135deg, #2CB8AD, #229E94)",
              color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800,
            }}>+ Mascota</span>
          </div>
          {/* App content */}
          <div style={{ padding: 16, background: "#F4F6FB" }}>
            {/* Pet card */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 10, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "linear-gradient(135deg, #E5F7F6, #B2E8E5)",
                  border: "2px solid #B2E8E5",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
                }}>🐶</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "Georgia, serif", color: "#1C3557" }}>Rocky</div>
                  <div style={{ color: "#64748B", fontSize: 12 }}>Labrador · 3 años · Macho</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <span style={{ background: "#2CB8AD22", color: "#2CB8AD", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>Chip: ...4821</span>
                    <span style={{ background: "#F9731622", color: "#F97316", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>24 kg</span>
                  </div>
                </div>
              </div>
            </div>
            {/* AI chat */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: 12, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 10, color: "#2CB8AD", fontWeight: 800, marginBottom: 6 }}>🤖 Vet IA · Respuesta instantánea</div>
              <div style={{
                background: "#F0FAFA",
                borderRadius: "10px 10px 10px 2px",
                padding: "8px 12px", fontSize: 12, color: "#1C3557",
                lineHeight: 1.5, border: "1px solid #B2E8E5",
              }}>
                Rocky está al día con sus vacunas 💉 La próxima dosis es en <strong style={{ color: "#2CB8AD" }}>Marzo 2026</strong>. ¿Hay algo que te preocupe?
              </div>
            </div>
            {/* Bottom nav */}
            <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 10, marginTop: 10, borderTop: "1px solid #E2E8F0", background: "#FFFFFF", borderRadius: "0 0 8px 8px", margin: "10px -16px -16px", padding: "10px 0 6px" }}>
              {[["🐾","Perfil",true],["🏥","Historial",false],["🤖","Vet IA",false],["🐕","Paseos",false],["👥","Comunidad",false]].map(([icon, label, active]) => (
                <div key={String(label)} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 14 }}>{icon}</div>
                  <div style={{ fontSize: 9, color: active ? "#2CB8AD" : "#64748B", fontWeight: 700 }}>{String(label)}</div>
                  {active && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2CB8AD", margin: "2px auto 0" }} />}
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
          <div key={String(label)} style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 14, padding: "16px 8px", textAlign: "center",
            boxShadow: "0 2px 8px rgba(28,53,87,0.06)",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#2CB8AD" }}>{val}</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <div className="landing-section">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#2CB8AD", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Todo incluido, todo gratis</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 6 }}>Una app pensada para el día a día</h2>
          <p style={{ fontSize: 13, color: "#64748B" }}>de tu mascota</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 16, padding: "18px",
              display: "flex", gap: 14, alignItems: "flex-start",
              boxShadow: "0 2px 8px rgba(28,53,87,0.05)",
              borderTop: `3px solid ${f.color}`,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: f.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: "#1C3557" }}>{f.title}</div>
                <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIOS */}
      <div className="landing-section" style={{ marginTop: 8 }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#2CB8AD", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Lo que dicen los dueños</div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: "#1C3557" }}>Miles de mascotas ya lo usan</h2>
        </div>
        <div className="landing-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 16, padding: 18,
              boxShadow: "0 2px 8px rgba(28,53,87,0.05)",
            }}>
              <div style={{ fontSize: 18, marginBottom: 10, color: "#F59E0B", letterSpacing: 1 }}>★★★★★</div>
              <div style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.7, marginBottom: 14 }}>"{t.texto}"</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "linear-gradient(135deg, #E5F7F6, #B2E8E5)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>🙂</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3557" }}>{t.nombre}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{t.mascota}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="landing-cta">
        <div style={{
          background: "linear-gradient(135deg, #E5F7F6 0%, #EEF2FF 100%)",
          border: "1px solid #B2E8E5",
          borderRadius: 24, padding: "40px 28px", textAlign: "center",
          boxShadow: "0 4px 24px rgba(44,184,173,0.12)",
        }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
            <img src="/logo.png" alt="PetPass" style={{ height: 56, width: "auto", objectFit: "contain" }} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 10, lineHeight: 1.3, color: "#1C3557" }}>
            ¿Tu mascota ya tiene su PetPass?
          </h2>
          <p style={{ color: "#64748B", fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>
            Más de 5.000 mascotas ya tienen su perfil digital.<br />Registrá a la tuya en menos de 2 minutos.
          </p>
          <Link href="/registro" style={{
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff", borderRadius: 14, padding: "16px 40px",
            fontWeight: 900, fontSize: 16, textDecoration: "none",
            display: "inline-block",
            boxShadow: "0 8px 32px rgba(44,184,173,0.35)",
          }}>
            Empezar gratis →
          </Link>
          <div style={{ marginTop: 16, color: "#64748B", fontSize: 12, fontWeight: 600 }}>
            Sin tarjeta · Sin costo · Para siempre
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        padding: "32px 24px 48px",
        textAlign: "center",
        borderTop: "1px solid #E2E8F0",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
      }}>
        <img src="/logo.png" alt="PetPass" style={{ height: 36, width: "auto", objectFit: "contain", opacity: 0.7 }} />
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/terminos" style={{ fontSize: 12, color: "#64748B", textDecoration: "none" }}>Términos y Condiciones</Link>
          <Link href="/privacidad" style={{ fontSize: 12, color: "#64748B", textDecoration: "none" }}>Política de Privacidad</Link>
          <a href="mailto:petpass.app@gmail.com" style={{ fontSize: 12, color: "#64748B", textDecoration: "none" }}>Contacto</a>
        </div>
        <div style={{ fontSize: 11, color: "#94A3B8" }}>© 2025 PetPass · Salud animal digital · Argentina</div>
        <div style={{ fontSize: 10, color: "#CBD5E1", maxWidth: 480 }}>
          Vet IA es una herramienta de orientación y no reemplaza la consulta veterinaria profesional.
        </div>
      </div>

    </main>
  );
}
