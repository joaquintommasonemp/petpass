"use client";
import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AUTH_CARD_STYLE,
  AUTH_PRIMARY_BUTTON_STYLE,
  AuthBrandInfoCard,
  AuthFeatureList,
  AuthLogoLink,
  AuthPanelDecorations,
} from "@/components/auth-ui";

const LEFT_FEATURES = [
  { icon: "IA", text: "Vet IA 24/7 con el historial de tu mascota como contexto" },
  { icon: "HC", text: "Historia cl\u00ednica digital siempre ordenada y a mano" },
  { icon: "QR", text: "Carnet digital y QR de identificaci\u00f3n" },
  { icon: "SOS", text: "Alertas r\u00e1pidas si tu mascota se pierde" },
];

function LoginInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resentVerification, setResentVerification] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  async function handleForgot() {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com"}/reset-password`,
    });
    setForgotSent(true);
    setForgotLoading(false);
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Complet\u00e1 tu email y tu contrase\u00f1a.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingres\u00e1 un email v\u00e1lido.");
      return;
    }
    setLoading(true);
    setError("");
    setNotConfirmed(false);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (error.message.toLowerCase().includes("not confirmed") || error.message.toLowerCase().includes("email not confirmed")) {
          setNotConfirmed(true);
          setError("Tu cuenta todav\u00eda no est\u00e1 verificada. Revis\u00e1 tu email y activala antes de ingresar.");
        } else {
          setError("No pudimos iniciar sesi\u00f3n. Revis\u00e1 tu email y tu contrase\u00f1a.");
        }
      } else {
        window.location.href = searchParams.get("next") || "/dashboard";
      }
    } catch {
      setError("Error de conexi\u00f3n. Revis\u00e1 tu internet e intent\u00e1 de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrapper">
      <div className="auth-left auth-brand-panel">
        <AuthPanelDecorations />

        <div className="auth-brand-content" style={{ position: "relative" }}>
          <AuthLogoLink inverted marginBottom={44} />

          <h2 className="auth-brand-title" style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12, letterSpacing: "-0.5px" }}>
            La app para el d&iacute;a a d&iacute;a de tu mascota.
          </h2>
          <p className="auth-brand-copy" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>
            Todo lo importante para cuidarla mejor, en un solo lugar.
          </p>

          <AuthFeatureList items={LEFT_FEATURES.map(feature => ({ icon: feature.icon, text: feature.text }))} />

          <AuthBrandInfoCard style={{ backdropFilter: "blur(8px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #E5F7F6, #B2E8E5)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0,
                color: "#2CB8AD", fontWeight: 900,
              }}>🐕</div>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>Rocky &middot; Labrador</div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>Vacunas al d&iacute;a &middot; Chip registrado</div>
              </div>
            </div>
          </AuthBrandInfoCard>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-shell" style={{ width: "100%", maxWidth: 400 }}>
          <AuthLogoLink mobile height={72} />

          <div className="auth-card" style={AUTH_CARD_STYLE}>
            <h2 className="auth-card-title" style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, color: "#1C3557", letterSpacing: "-0.3px" }}>
              Bienvenido de vuelta
            </h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 28 }}>Ingres&aacute; para seguir cuidando a tu mascota.</p>

            <div className="auth-form" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                placeholder="Contrase&ntilde;a"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />

              {error && (
                <div className="auth-error" style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13 }}>
                  {error}
                  {notConfirmed && (
                    <div style={{ marginTop: 8 }}>
                      {resentVerification ? (
                        <span style={{ color: "#2CB8AD", fontWeight: 700 }}>Te reenviamos el email.</span>
                      ) : (
                        <button
                          onClick={async () => {
                            await supabase.auth.resend({ type: "signup", email: email.trim() });
                            setResentVerification(true);
                          }}
                          style={{
                            background: "#EF4444", color: "#fff", border: "none",
                            borderRadius: 8, padding: "5px 12px", fontSize: 12,
                            fontWeight: 700, cursor: "pointer",
                          }}
                        >Reenviar email de confirmaci&oacute;n</button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ textAlign: "right", marginTop: -6 }}>
                <button onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); }} style={{
                  background: "none", border: "none", color: "#2CB8AD", fontSize: 13,
                  fontWeight: 600, cursor: "pointer", padding: 0,
                }}>
                  &iquest;Olvidaste tu contrase&ntilde;a?
                </button>
              </div>

              <button className="auth-submit" onClick={handleLogin} disabled={loading} style={{
                ...AUTH_PRIMARY_BUTTON_STYLE,
                marginTop: 4,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}>{loading ? "Ingresando..." : "Entrar ahora"}</button>
            </div>
          </div>

          <p className="auth-switch" style={{ textAlign: "center", marginTop: 20, color: "#64748B", fontSize: 14 }}>
            &iquest;Todav&iacute;a no ten&eacute;s cuenta?{" "}
            <Link href="/registro" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>

      {showForgot && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setShowForgot(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "32px 28px",
            width: "100%", maxWidth: 380, boxShadow: "0 8px 48px rgba(28,53,87,0.18)",
          }} onClick={e => e.stopPropagation()}>
            {forgotSent ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>&#128231;</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1C3557", marginBottom: 8 }}>
                  Revis&aacute; tu email
                </h3>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}>
                  Si el email existe, te enviamos un link para recuperar tu contrase&ntilde;a.
                </p>
                <button onClick={() => setShowForgot(false)} style={{
                  marginTop: 20, background: "linear-gradient(135deg,#2CB8AD,#229E94)",
                  color: "#fff", border: "none", borderRadius: 12,
                  padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}>Cerrar</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1C3557", marginBottom: 6 }}>
                  Recuperar contrase&ntilde;a
                </h3>
                <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                  Ingres&aacute; tu email y te enviamos un link para crear una nueva contrase&ntilde;a.
                </p>
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgot()}
                  style={{ width: "100%", marginBottom: 14, boxSizing: "border-box" }}
                />
                <button onClick={handleForgot} disabled={forgotLoading} style={{
                  width: "100%", background: "linear-gradient(135deg,#2CB8AD,#229E94)",
                  color: "#fff", border: "none", borderRadius: 12,
                  padding: "13px 20px", fontWeight: 900, fontSize: 14,
                  opacity: forgotLoading ? 0.6 : 1,
                  cursor: forgotLoading ? "not-allowed" : "pointer",
                }}>
                  {forgotLoading ? "Enviando..." : "Enviar link de recuperaci&oacute;n"}
                </button>
                <button onClick={() => setShowForgot(false)} style={{
                  width: "100%", background: "none", border: "none",
                  color: "#94A3B8", fontSize: 13, marginTop: 12, cursor: "pointer",
                }}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function Login() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
