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
      <span style={{ fontSize: 18 }}>&#10003;</span>
      <span>Tu cuenta fue eliminada correctamente. Todos tus datos fueron borrados. Gracias por haber usado PetPass.</span>
    </div>
  );
}

const FEATURES = [
  { icon: "\uD83E\uDD16", title: "Vet IA 24/7", desc: "Consulta sintomas, manda fotos y recibi orientacion instantanea con el historial de tu mascota como contexto.", color: "#2CB8AD" },
  { icon: "\uD83C\uDFE5", title: "Historia clinica digital", desc: "Vacunas, consultas, peso, documentos y citas, todo organizado y accesible desde cualquier dispositivo.", color: "#3B82F6" },
  { icon: "\uD83D\uDCF1", title: "QR de identificacion", desc: "Genera un QR para el collar. Si tu mascota se pierde, cualquiera puede ver sus datos y contactarte.", color: "#8B5CF6" },
  { icon: "\uD83D\uDC15", title: "Paseos y guarderias", desc: "Comparti un link con el cuidador para que te mande fotos y novedades en tiempo real.", color: "#F97316" },
  { icon: "\uD83D\uDCCD", title: "Mascotas perdidas", desc: "Publica alertas con foto, ubicacion y recibi avistamientos anonimos al instante.", color: "#EF4444" },
  { icon: "\u2764\uFE0F", title: "Adopciones y comunidad", desc: "Encontra o publica mascotas en adopcion, descuentos veterinarios y conectate con otros tutores.", color: "#EC4899" },
];

const TESTIMONIALS = [
  { texto: "Nunca mas me olvide de una vacuna. La IA me avisa antes que el vet.", nombre: "Valentina M.", mascota: "Luna - Beagle 2 años", inicial: "V" },
  { texto: "Gracias a PetPass encontre a mi perro en 3 horas. Lo vieron en el barrio con el QR.", nombre: "Matias R.", mascota: "Thor - Husky 4 años", inicial: "M" },
  { texto: "La uso cuando me da cosa llamar al vet de noche. Siempre responde bien.", nombre: "Carolina G.", mascota: "Michi - Gato 5 años", inicial: "C" },
];

const MOCKUP = (
  <div className="landing-app-mockup" style={{
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 12px 60px rgba(28,53,87,0.14), 0 4px 16px rgba(0,0,0,0.06)",
  }}>
    <div className="landing-app-mockup-header" style={{
      background: "rgba(255,255,255,0.97)",
      borderBottom: "1px solid #E2E8F0",
      padding: "12px 16px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 30, width: "auto", objectFit: "contain" }} />
      <span style={{
        background: "linear-gradient(135deg, #2CB8AD, #229E94)",
        color: "#fff", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 800,
      }}>+ Mascota</span>
    </div>
    <div className="landing-app-mockup-body" style={{ padding: 16, background: "#F4F6FB" }}>
      <div className="landing-app-card" style={{ background: "#FFFFFF", borderRadius: 16, padding: 14, marginBottom: 10, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #E5F7F6, #B2E8E5)",
            border: "2px solid #B2E8E5",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>🐕</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, fontFamily: "Georgia, serif", color: "#1C3557" }}>Rocky</div>
            <div style={{ color: "#64748B", fontSize: 12 }}>Labrador - 3 a&ntilde;os - Macho</div>
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              <span style={{ background: "#2CB8AD22", color: "#2CB8AD", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>Chip: ...4821</span>
              <span style={{ background: "#F9731622", color: "#F97316", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>24 kg</span>
            </div>
          </div>
        </div>
      </div>
      <div className="landing-app-card" style={{ background: "#FFFFFF", borderRadius: 16, padding: 12, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 10, color: "#2CB8AD", fontWeight: 800, marginBottom: 6 }}>Vet IA - Respuesta instantanea</div>
        <div style={{
          background: "#F0FAFA",
          borderRadius: "10px 10px 10px 2px",
          padding: "8px 12px", fontSize: 12, color: "#1C3557",
          lineHeight: 1.5, border: "1px solid #B2E8E5",
        }}>
          Rocky est&aacute; al d&iacute;a con sus vacunas. La pr&oacute;xima dosis es en <strong style={{ color: "#2CB8AD" }}>Marzo 2026</strong>. &iquest;Hay algo que te preocupe?
        </div>
      </div>
      <div className="landing-app-bottom-nav" style={{ display: "flex", justifyContent: "space-around", margin: "10px -16px -16px", padding: "10px 0 8px", borderTop: "1px solid #E2E8F0", background: "#FFFFFF", borderRadius: "0 0 8px 8px" }}>
        {[["\uD83D\uDC3E","Perfil",true],["\uD83C\uDFE5","Historial",false],["\uD83E\uDD16","Vet IA",false],["\uD83D\uDC15","Paseos",false],["\uD83D\uDC65","Comunidad",false]].map(([icon, label, active]) => (
          <div key={String(label)} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14 }}>{icon}</div>
            <div style={{ fontSize: 10, color: active ? "#2CB8AD" : "#64748B", fontWeight: 800, lineHeight: 1.1 }}>{String(label)}</div>
            {active && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2CB8AD", margin: "2px auto 0" }} />}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default function Home() {
  return (
    <main className="landing-wrapper">
      <Suspense fallback={null}>
        <div className="landing-banner-wrap">
          <CuentaEliminadaBanner />
        </div>
      </Suspense>

      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <img className="landing-nav-logo" src="/logo-brand-official.png" alt="PetPass" style={{ height: 64, width: "auto", objectFit: "contain", display: "block" }} />
        </div>
      </nav>

      <section className="landing-hero-section">
        <div style={{ position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #2CB8AD14, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, #3B82F610, transparent 70%)", pointerEvents: "none" }} />

        <div className="landing-hero-grid">
          <div className="landing-hero-text">
            <div className="landing-hero-logo" style={{ marginBottom: 20, display: "flex", justifyContent: "center" }}>
              <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 84, width: "auto", objectFit: "contain", display: "block" }} />
            </div>

            <h1 className="landing-h1" style={{
              fontWeight: 900, lineHeight: 1.12, marginBottom: 20, color: "#1C3557",
              letterSpacing: "-1px",
            }}>
              La app para el d&iacute;a a d&iacute;a
              <br />
              <span style={{
                background: "linear-gradient(90deg, #2CB8AD, #229E94)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>de tu mascota.</span>
            </h1>

            <p className="landing-hero-copy" style={{
              color: "#64748B", fontSize: 17, lineHeight: 1.72, marginBottom: 30,
            }}>
              Todo lo importante para cuidarla mejor, en un solo lugar.
            </p>

            <div className="landing-hero-cta">
              <Link href="/registro" className="landing-primary-cta" style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff", borderRadius: 14, padding: "16px 36px",
                fontWeight: 900, fontSize: 16, textDecoration: "none",
                boxShadow: "0 8px 32px rgba(44,184,173,0.35)",
                whiteSpace: "nowrap",
              }}>
                Registrar mi mascota
              </Link>
              <Link href="/login" className="landing-secondary-cta" style={{
                color: "#64748B", fontSize: 14, textDecoration: "none", padding: "12px 8px",
                fontWeight: 600, display: "inline-block",
              }}>
                Ya tengo cuenta &rarr;
              </Link>
            </div>

            <div className="landing-trust">
              {["Sin tarjeta para empezar", "Datos protegidos", "Plan inicial disponible"].map(b => (
                <span key={b} style={{ fontSize: 12, color: "#64748B", fontWeight: 600 }}>{b}</span>
              ))}
            </div>
          </div>

          <div className="landing-hero-mockup-col" style={{ position: "relative" }}>
            <div className="landing-floating-card landing-floating-card-ai" style={{
              position: "absolute", top: -16, right: 16, zIndex: 10,
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              borderRadius: 14, padding: "10px 14px",
              boxShadow: "0 4px 20px rgba(28,53,87,0.1)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>{"\uD83E\uDD16"}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1C3557" }}>Vet IA activa</div>
                <div style={{ fontSize: 10, color: "#2CB8AD" }}>Respuesta en segundos</div>
              </div>
            </div>
            <div className="landing-floating-card landing-floating-card-vaccine" style={{
              position: "absolute", bottom: 32, left: -20, zIndex: 10,
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              borderRadius: 14, padding: "10px 14px",
              boxShadow: "0 4px 20px rgba(28,53,87,0.1)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>{"\uD83D\uDC89"}</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1C3557" }}>Vacunas al d&iacute;a</div>
                <div style={{ fontSize: 10, color: "#64748B" }}>Recordatorio autom&aacute;tico</div>
              </div>
            </div>
            {MOCKUP}
          </div>
        </div>
      </section>

      <section className="landing-human-section">
        <div className="landing-human-card">
          <div className="landing-human-copy">
            <div className="landing-section-eyebrow">Hecha para la vida real</div>
            <h2 className="landing-human-title">M&aacute;s cerca de tu mascota, incluso cuando no est&aacute;s con ella</h2>
            <p>
              PetPass ordena salud, datos importantes y contactos en un solo lugar para que vos, tu veterinaria
              o un cuidador tengan la informaci&oacute;n correcta cuando m&aacute;s importa.
            </p>
            <div className="landing-human-points">
              <span>Perfil siempre a mano</span>
              <span>QR para emergencias</span>
              <span>Historial claro y compartible</span>
            </div>
          </div>
          <div className="landing-human-visual">
            <img className="landing-human-photo" src="/landing-real-family.png" alt="Nene abrazando a su perro al aire libre" />
          </div>
        </div>
      </section>

      <div className="landing-mockup-standalone">
        {MOCKUP}
      </div>

      <div className="landing-stats-row">
        {[
          ["\uD83D\uDC3E", "+5.000", "mascotas registradas"],
          ["\uD83E\uDD16", "24/7", "Vet IA disponible"],
          ["\uD83D\uDC89", "100%", "gratis para empezar"],
        ].map(([icon, val, label]) => (
          <div key={String(label)} className="landing-stat-card" style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 16, padding: "20px 16px", textAlign: "center",
            boxShadow: "0 2px 8px rgba(28,53,87,0.06)",
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#2CB8AD", letterSpacing: "-0.5px" }}>{val}</div>
            <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="landing-section">
        <div className="landing-section-head">
          <div className="landing-section-eyebrow">Todo en un solo lugar</div>
          <h2 className="landing-section-title">Una app pensada para el d&iacute;a a d&iacute;a</h2>
          <p className="landing-section-subtitle">de tu mascota</p>
        </div>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing-feature-card" style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 18, padding: "20px",
              display: "flex", gap: 16, alignItems: "flex-start",
              boxShadow: "0 2px 8px rgba(28,53,87,0.05)",
              borderTop: `3px solid ${f.color}`,
            }}>
              <div className="landing-feature-icon" style={{
                width: 48, height: 48, borderRadius: 14,
                background: f.color + "18",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: f.icon.length > 2 ? 12 : 24, fontWeight: 900, flexShrink: 0, color: f.color,
                textAlign: "center",
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: "#1C3557" }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="landing-section" style={{ marginTop: 8 }}>
        <div className="landing-section-head">
          <div className="landing-section-eyebrow">Lo que dicen los tutores</div>
          <h2 className="landing-section-title landing-section-title-small">Miles de mascotas ya lo usan</h2>
        </div>
        <div className="landing-testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="landing-testimonial-card" style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: 18, padding: "20px",
              boxShadow: "0 2px 8px rgba(28,53,87,0.05)",
            }}>
              <div style={{ fontSize: 14, marginBottom: 12, color: "#F59E0B", letterSpacing: 2 }}>*****</div>
              <div style={{ fontSize: 14, color: "#1C3557", lineHeight: 1.75, marginBottom: 16 }}>"{t.texto}"</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff",
                  flexShrink: 0,
                }}>{t.inicial}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3557" }}>{t.nombre}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{t.mascota}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Premium teaser */}
      <div className="landing-section" style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{
          background: "linear-gradient(135deg, #1C3557 0%, #2CB8AD 100%)",
          borderRadius: 28, padding: "40px 32px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
          boxShadow: "0 8px 40px rgba(44,184,173,0.25)",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
          <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 10, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            Llevá el cuidado al siguiente nivel
          </h2>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 24, lineHeight: 1.7, maxWidth: 480 }}>
            Con Premium tenés Vet IA ilimitada, análisis de fotos, recordatorios automáticos de vacunas y descuentos exclusivos. Solo <strong style={{ color: "#fff" }}>$3.000/mes</strong>.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
            {["🤖 Vet IA ilimitada", "📷 Análisis de fotos", "💊 Recordatorios", "🎁 Descuentos"].map(b => (
              <span key={b} style={{
                background: "rgba(255,255,255,0.15)", color: "#fff",
                borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: 700,
                border: "1px solid rgba(255,255,255,0.25)",
              }}>{b}</span>
            ))}
          </div>
          <Link href="/premium" style={{
            background: "linear-gradient(135deg, #EC4899, #DB2777)",
            color: "#fff", borderRadius: 14, padding: "14px 36px",
            fontWeight: 900, fontSize: 15, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(236,72,153,0.4)",
            display: "inline-block",
          }}>
            Ver plan Premium →
          </Link>
          <div style={{ marginTop: 12, color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Cancelás cuando querés</div>
        </div>
      </div>

      <div className="landing-cta">
        <div className="landing-final-cta" style={{
          background: "linear-gradient(135deg, #E5F7F6 0%, #EEF2FF 100%)",
          border: "1px solid #B2E8E5",
          borderRadius: 28, padding: "52px 40px", textAlign: "center",
          boxShadow: "0 4px 32px rgba(44,184,173,0.12)",
        }}>
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "center", background: "transparent" }}>
            <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 78, width: "auto", objectFit: "contain", display: "block" }} />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12, lineHeight: 1.25, color: "#1C3557", letterSpacing: "-0.5px" }}>
            &iquest;Tu mascota ya tiene su PetPass?
          </h2>
          <p style={{ color: "#64748B", fontSize: 15, marginBottom: 32, lineHeight: 1.75 }}>
            M&aacute;s de 5.000 mascotas ya tienen su perfil digital.<br />Registr&aacute; a la tuya en menos de 2 minutos.
          </p>
          <Link href="/registro" className="landing-primary-cta landing-final-cta-button" style={{
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff", borderRadius: 14, padding: "18px 48px",
            fontWeight: 900, fontSize: 17, textDecoration: "none",
            display: "inline-block",
            boxShadow: "0 8px 32px rgba(44,184,173,0.35)",
          }}>
            Empezar ahora &rarr;
          </Link>
          <div style={{ marginTop: 20, color: "#94A3B8", fontSize: 13, fontWeight: 600 }}>
            Sin tarjeta para empezar &middot; Pod&eacute;s mejorar tu plan cuando quieras
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="landing-section" style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 48px" }}>
        <div className="landing-section-head">
          <div className="landing-section-eyebrow">Preguntas frecuentes</div>
          <h2 className="landing-section-title landing-section-title-small">Todo lo que quer&eacute;s saber</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              q: "¿Es gratis PetPass?",
              a: "Sí. Podés registrar tu mascota, llevar el historial clínico, generar el carnet QR y usar la comunidad sin pagar nada. El plan Premium ($3.000/mes) desbloquea la Vet IA ilimitada, análisis de fotos y beneficios exclusivos.",
            },
            {
              q: "¿Qué incluye el plan Premium?",
              a: "Consultas ilimitadas con el Vet IA 24/7, análisis de fotos y documentos médicos, compartir historial con veterinarios, recordatorios automáticos de vacunas y descuentos en servicios pet-friendly. Podés cancelar cuando quieras.",
            },
            {
              q: "¿Puedo tener más de una mascota?",
              a: "El plan gratuito incluye 1 mascota. Con Premium podés registrar mascotas ilimitadas. Cada una tiene su propio perfil, historial, carnet QR y acceso al Vet IA con su contexto médico.",
            },
            {
              q: "¿Cómo funciona el Vet IA?",
              a: "Es un asistente veterinario con inteligencia artificial que tiene acceso al historial completo de tu mascota — vacunas, consultas, peso, alimentación y documentos. Podés hacerle preguntas, mandarle fotos de síntomas o pedirle que analice estudios médicos. Está disponible las 24 horas. No reemplaza la consulta presencial.",
            },
            {
              q: "¿Cómo funciona lo de los cuidadores?",
              a: "Cuando llevás tu mascota a una guardería o salís de paseo, podés generar un link único y compartirlo con el cuidador. Desde ese link el cuidador puede mandarte fotos y mensajes en tiempo real sin necesitar cuenta en PetPass.",
            },
            {
              q: "¿Qué es la comunidad?",
              a: "Es el espacio social de PetPass. Podés publicar mascotas en adopción, reportar o encontrar mascotas perdidas, conectarte con veterinarios y profesionales de tu zona, y compartir en el mural con otros tutores. Todo dentro de la misma app.",
            },
          ].map((item, i) => (
            <details key={i} style={{
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              borderRadius: 14, padding: "16px 20px",
              boxShadow: "0 1px 4px rgba(28,53,87,0.05)",
            }}>
              <summary style={{
                fontWeight: 800, fontSize: 14, color: "#1C3557",
                cursor: "pointer", listStyle: "none", display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: 12,
              }}>
                {item.q}
                <span style={{ color: "#2CB8AD", fontSize: 18, flexShrink: 0, fontWeight: 400 }}>+</span>
              </summary>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.7, margin: "12px 0 0" }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* Disclaimer Vet IA */}
      <div style={{
        background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
        borderTop: "2px solid #FCD34D",
        borderBottom: "2px solid #FCD34D",
        padding: "20px 24px",
      }}>
        <div style={{
          maxWidth: 720, margin: "0 auto",
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>⚕️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#92400E", marginBottom: 4 }}>
              Aviso importante sobre Vet IA
            </div>
            <p style={{ fontSize: 12, color: "#78350F", lineHeight: 1.7, margin: 0 }}>
              <strong>Vet IA es una herramienta de orientaci&oacute;n inform&aacute;tica y no reemplaza la consulta con un veterinario matriculado.</strong> Las respuestas generadas por inteligencia artificial tienen car&aacute;cter informativo y no constituyen diagn&oacute;stico, prescripci&oacute;n ni tratamiento m&eacute;dico veterinario. Ante cualquier problema de salud de tu mascota, consult&aacute; siempre con un profesional habilitado. PetPass no se responsabiliza por decisiones tomadas en base a la informaci&oacute;n provista por Vet IA.
            </p>
          </div>
        </div>
      </div>

      <footer className="landing-footer" style={{
        borderTop: "1px solid #E2E8F0",
        background: "#FFFFFF",
      }}>
        <div className="landing-footer-inner" style={{
          maxWidth: 1200, margin: "0 auto", padding: "32px 24px 40px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
        }}>
          <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 42, width: "auto", objectFit: "contain", opacity: 0.65 }} />
          <div className="landing-footer-links" style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/terminos" className="landing-footer-link" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>T&eacute;rminos y Condiciones</Link>
            <Link href="/privacidad" className="landing-footer-link" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>Pol&iacute;tica de Privacidad</Link>
            <a href="mailto:petpass.app@gmail.com" className="landing-footer-link" style={{ fontSize: 13, color: "#64748B", textDecoration: "none" }}>Contacto</a>
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>&copy; 2025 PetPass &middot; Salud animal digital &middot; Argentina</div>
          <div style={{ fontSize: 11, color: "#94A3B8", maxWidth: 520, textAlign: "center", lineHeight: 1.6 }}>
            Vet IA es una herramienta de orientaci&oacute;n inform&aacute;tica. No reemplaza la consulta con un veterinario matriculado.
          </div>
        </div>
      </footer>
    </main>
  );
}
