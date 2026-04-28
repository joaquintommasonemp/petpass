"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const BENEFICIOS = [
  { icon: "🩺", titulo: "Vet IA ilimitada", descripcion: "Consultá sin límite con el veterinario IA 24/7, con el historial de tu mascota como contexto" },
  { icon: "📸", titulo: "Análisis de fotos y estudios", descripcion: "Subí fotos de síntomas o resultados médicos y la IA los interpreta al instante" },
  { icon: "📋", titulo: "Historial médico completo", descripcion: "Registrá consultas, vacunas, alimentación, documentos y citas. Todo en un solo lugar, siempre ordenado" },
  { icon: "🔗", titulo: "Compartir con veterinarios", descripcion: "Generá links del historial para compartir con cualquier profesional en segundos" },
  { icon: "🔔", titulo: "Recordatorios de vacunas", descripcion: "Recibí emails automáticos y notificaciones cuando una vacuna de tu mascota está próxima a vencer" },
  { icon: "🏷️", titulo: "Descuentos exclusivos", descripcion: "Accedé a descuentos en veterinarias, petshops y servicios para socios Premium" },
];

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setProfileLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("is_premium, mp_subscription_status, mp_subscription_id, referred_by, trial_until")
        .eq("id", session.user.id)
        .single();
      setProfile(data);
      setProfileLoading(false);
    }
    load();
  }, []);

  async function handleActivar() {
    setLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/suscripcion/crear", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.trial) {
        const { data: updated } = await supabase
          .from("profiles")
          .select("is_premium, mp_subscription_status, mp_subscription_id, referred_by, trial_until")
          .eq("id", session.user.id)
          .single();
        setProfile(updated);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No pudimos iniciar el pago. Intentá de nuevo.");
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelar() {
    setCancelLoading(true);
    setError("");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/suscripcion/cancelar", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setCancelDone(true);
        setProfile((p: any) => ({
          ...p,
          is_premium: false,
          mp_subscription_status: "cancelled",
        }));
      } else {
        setError(data.error || "No se pudo cancelar. Intentá de nuevo.");
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setCancelLoading(false);
      setCancelConfirm(false);
    }
  }

  if (profileLoading)
    return (
      <div className="premium-page" style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 48px" }}>
        <div className="skeleton" style={{ height: 44, borderRadius: 20, marginBottom: 28 }} />
        <div className="skeleton" style={{ height: 100, borderRadius: 20, marginBottom: 24 }} />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton" style={{ height: 68, borderRadius: 14, marginBottom: 10 }} />
        ))}
        <div className="skeleton" style={{ height: 56, borderRadius: 14, marginTop: 4 }} />
      </div>
    );

  const isPremium = profile?.is_premium;
  const status = profile?.mp_subscription_status;
  const trialUntil = profile?.trial_until ? new Date(profile.trial_until) : null;
  const trialActive = trialUntil && trialUntil > new Date();
  const trialDaysLeft = trialActive ? Math.ceil((trialUntil.getTime() - Date.now()) / 86400000) : 0;

  if (isPremium && !cancelDone) {
    return (
      <div className="premium-page" style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 48px" }}>
        <div className="premium-desktop-grid">
          {/* Columna izquierda: estado + acciones */}
          <div>
            <div className="premium-hero" style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>✦</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1C3557", marginBottom: 6, letterSpacing: "-0.5px" }}>
                Sos Premium
              </h1>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}>
                Tu suscripción está activa. Tenés acceso a todos los beneficios.
              </p>
            </div>

            <div
              className="premium-price-card"
              style={{
                background: "linear-gradient(135deg, #1C3557 0%, #2CB8AD 100%)",
                borderRadius: 20,
                padding: "20px 24px",
                marginBottom: 24,
                textAlign: "center",
                boxShadow: "0 8px 32px rgba(44,184,173,0.25)",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 4 }}>Estado de suscripción</div>
              <div style={{ color: "#fff", fontSize: 20, fontWeight: 900 }}>
                {trialActive ? "Gratis hasta el 31/05 ✓" : "Activa ✓"}
              </div>
              {!trialActive && status && <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 }}>{status}</div>}
            </div>

            {trialActive && (
              <div style={{ background: "#FFF8E6", border: "1px solid #FDE68A", borderRadius: 14, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#92400E", lineHeight: 1.5 }}>
                <strong>Acceso gratuito hasta el 31/05.</strong> A partir del 1/06 podés seguir con Premium por $3.000/mes.
              </div>
            )}

            <Link
              href="/dashboard/chat"
              style={{
                display: "block",
                background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "16px 20px",
                fontWeight: 900,
                fontSize: 16,
                textDecoration: "none",
                textAlign: "center",
                boxShadow: "0 4px 20px rgba(44,184,173,0.35)",
                marginBottom: 24,
              }}
            >
              Ir al Vet IA
            </Link>

            {error && (
              <div
                style={{
                  background: "#FFF0F0",
                  border: "1px solid #FECACA",
                  borderRadius: 10,
                  padding: "10px 14px",
                  color: "#EF4444",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}

            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 20, textAlign: "center" }}>
              <p style={{ color: "#94A3B8", fontSize: 12, marginBottom: 12 }}>¿Querés cancelar tu suscripción?</p>
              {!cancelConfirm ? (
                <button
                  onClick={() => setCancelConfirm(true)}
                  style={{
                    background: "none",
                    border: "1px solid #E2E8F0",
                    color: "#94A3B8",
                    borderRadius: 10,
                    padding: "8px 20px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancelar suscripción
                </button>
              ) : (
                <div style={{ background: "#FFF8F8", border: "1px solid #FECACA", borderRadius: 14, padding: "16px" }}>
                  <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
                    ¿Confirmás la cancelación? Perdés el acceso Premium inmediatamente.
                  </p>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      onClick={() => setCancelConfirm(false)}
                      style={{
                        background: "#F1F5F9",
                        border: "none",
                        color: "#64748B",
                        borderRadius: 10,
                        padding: "8px 20px",
                        fontSize: 13,
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      No, mantener
                    </button>
                    <button
                      onClick={handleCancelar}
                      disabled={cancelLoading}
                      style={{
                        background: "#EF4444",
                        border: "none",
                        color: "#fff",
                        borderRadius: 10,
                        padding: "8px 20px",
                        fontSize: 13,
                        cursor: cancelLoading ? "not-allowed" : "pointer",
                        fontWeight: 700,
                        opacity: cancelLoading ? 0.7 : 1,
                      }}
                    >
                      {cancelLoading ? "Cancelando..." : "Sí, cancelar"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Link href="/dashboard" style={{ color: "#94A3B8", fontSize: 13, textDecoration: "none" }}>
                Volver al dashboard
              </Link>
            </div>
          </div>

          {/* Columna derecha: beneficios */}
          <div className="premium-benefits" style={{ marginBottom: 28 }}>
            <div
              className="premium-benefits-heading"
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#64748B",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Tus beneficios activos
            </div>
            <div className="premium-benefits-grid" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {BENEFICIOS.map((b) => (
                <div
                  className="premium-benefit-card"
                  key={b.titulo}
                  style={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "12px 16px",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "#E5F7F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {b.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#1C3557", marginBottom: 2 }}>{b.titulo}</div>
                    <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{b.descripcion}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (cancelDone) {
    return (
      <div className="premium-page premium-page-centered" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👋</div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 10 }}>Suscripción cancelada</h1>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Tu suscripción Premium fue cancelada. Podés volver a activarla cuando quieras.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: "block",
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff",
            borderRadius: 14,
            padding: "14px 20px",
            fontWeight: 900,
            fontSize: 15,
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(44,184,173,0.35)",
          }}
        >
          Ir al dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="premium-page" style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 48px" }}>
      <div className="premium-desktop-grid">
        {/* Columna izquierda: hero + precio + CTA */}
        <div>
          <div className="premium-hero" style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✦</div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1C3557", marginBottom: 6, letterSpacing: "-0.5px" }}>
              PetPass Premium
            </h1>
            <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}>
              Todo lo que tu mascota necesita, sin límites.
            </p>
          </div>

          <div
            className="premium-price-card"
            style={{
              background: "linear-gradient(135deg, #1C3557 0%, #2CB8AD 100%)",
              borderRadius: 20,
              padding: "24px 28px",
              marginBottom: 24,
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(44,184,173,0.25)",
            }}
          >
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 4 }}>Suscripción mensual</div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, marginBottom: 4 }}>
              <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, alignSelf: "flex-start", marginTop: 8 }}>$</span>
              <span style={{ color: "#fff", fontSize: 52, fontWeight: 900, lineHeight: 1 }}>3.000</span>
              <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, marginBottom: 8 }}>ARS/mes</span>
            </div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>Cancelá cuando quieras</div>
          </div>

          <div style={{ background: "#E5F7F6", border: "1px solid #B2E8E5", borderRadius: 14, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#1C3557", lineHeight: 1.5 }}>
            🎁 <strong>Gratis hasta el 31/05.</strong> Sin tarjeta. Sin compromiso.
          </div>

          {error && (
            <div
              style={{
                background: "#FFF0F0",
                border: "1px solid #FECACA",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#EF4444",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleActivar}
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #EC4899, #DB2777)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "16px 20px",
              fontWeight: 900,
              fontSize: 16,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 4px 20px rgba(236,72,153,0.35)",
              marginBottom: 12,
            }}
          >
            {loading ? "Activando..." : "Empezar gratis hasta el 31/05"}
          </button>

          <div style={{ textAlign: "center" }}>
            <Link href="/dashboard" style={{ color: "#94A3B8", fontSize: 13, textDecoration: "none" }}>
              Volver al dashboard
            </Link>
          </div>

          <p className="premium-footer-note" style={{ textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
            El pago se procesa de forma segura a través de MercadoPago.
            <br />
            Podés cancelar tu suscripción en cualquier momento.
          </p>
        </div>

        {/* Columna derecha: beneficios */}
        <div className="premium-benefits" style={{ marginBottom: 28 }}>
          <div
            className="premium-benefits-heading"
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#64748B",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Qué incluye
          </div>
          <div className="premium-benefits-grid" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {BENEFICIOS.map((b) => (
              <div
                className="premium-benefit-card"
                key={b.titulo}
                style={{
                  background: "#fff",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: "12px 16px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: "#E5F7F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {b.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#1C3557", marginBottom: 2 }}>{b.titulo}</div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{b.descripcion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
