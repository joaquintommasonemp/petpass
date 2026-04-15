"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AUTH_CARD_STYLE,
  AUTH_PRIMARY_BUTTON_STYLE,
  AuthBrandInfoCard,
  AuthFeatureList,
  AuthLogoLink,
  AuthPanelDecorations,
} from "@/components/auth-ui";
import { UiChip } from "@/components/ui";

const LEFT_STEPS = [
  { icon: "1", title: "Cre\u00e1 tu cuenta", desc: "R\u00e1pido y simple, en menos de un minuto." },
  { icon: "2", title: "Registr\u00e1 a tu mascota", desc: "Carg\u00e1 sus datos, vacunas y foto." },
  { icon: "3", title: "Orden\u00e1 todo en un solo lugar", desc: "Historial, IA, QR y comunidad." },
];

const MOBILE_BENEFITS = ["IA veterinaria", "Historia cl\u00ednica", "Comunidad"];

export default function Registro() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "" });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resent, setResent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleRegister() {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email || !form.password) {
      setError("Complet\u00e1 los campos obligatorios para continuar.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Ingres\u00e1 un email v\u00e1lido.");
      return;
    }
    if (form.password.length < 8) {
      setError("La contrase\u00f1a debe tener al menos 8 caracteres.");
      return;
    }
    if (!aceptaTerminos) {
      setError("Necesitamos que aceptes los t\u00e9rminos y la pol\u00edtica de privacidad.");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com"}/onboarding` },
    });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        phone: form.phone.trim(),
      });
    }
    if (!data.session) {
      setRegisteredEmail(form.email.trim());
      setRegistered(true);
      setLoading(false);
      return;
    }
    window.location.href = "/onboarding";
    setLoading(false);
  }

  if (registered) {
    return (
      <main className="auth-wrapper">
        <div className="auth-left auth-brand-panel">
          <div className="auth-brand-content" style={{ position: "relative" }}>
            <AuthLogoLink inverted marginBottom={40} />
            <div style={{ fontSize: 64, marginBottom: 20 }}>&#127881;</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12 }}>&iexcl;Ya sos parte de PetPass!</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7 }}>
              Revis&aacute; tu bandeja de entrada para activar tu cuenta y empezar.
            </p>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-shell auth-success-shell" style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
            <AuthLogoLink mobile height={72} marginBottom={28} />
            <div className="auth-card auth-success-card" style={{ ...AUTH_CARD_STYLE, border: "1px solid #B2E8E5", padding: "40px 32px" }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>&#128231;</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 8 }}>Revis&aacute; tu email</h2>
              <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                Te enviamos un link de confirmaci&oacute;n a<br />
                <strong style={{ color: "#1C3557" }}>{registeredEmail}</strong>
              </p>
              <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
                Hac&eacute; clic en el link del email para activar tu cuenta. Despu&eacute;s pod&eacute;s iniciar sesi&oacute;n normalmente.
              </p>
              {resent ? (
                <div className="auth-success-feedback" style={{ background: "#E5F7F6", border: "1px solid #B2E8E5", borderRadius: 10, padding: "10px 16px", color: "#2CB8AD", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                  Te reenviamos el email.
                </div>
              ) : (
                <button
                  className="auth-secondary-action"
                  onClick={async () => {
                    await supabase.auth.resend({ type: "signup", email: registeredEmail });
                    setResent(true);
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    color: "#64748B",
                    fontSize: 13,
                    padding: "9px 20px",
                    cursor: "pointer",
                    marginBottom: 16,
                    width: "100%",
                  }}
                >
                  &iquest;No te lleg&oacute;? Reenviar email
                </button>
              )}
              <Link
                href="/login"
                className="auth-submit auth-link-submit"
                style={{ ...AUTH_PRIMARY_BUTTON_STYLE, display: "block", padding: "14px 20px", textDecoration: "none" }}
              >
                Ir al login
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-wrapper">
      <div className="auth-left auth-brand-panel">
        <AuthPanelDecorations />

        <div className="auth-brand-content" style={{ position: "relative" }}>
          <AuthLogoLink inverted marginBottom={40} />

          <h2 className="auth-brand-title" style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12, letterSpacing: "-0.5px" }}>
            Empez&aacute; a ordenar el cuidado de tu mascota.
          </h2>
          <p className="auth-brand-copy" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7, marginBottom: 40 }}>
            Cre&aacute; tu cuenta y ten&eacute; todo lo importante en un solo lugar.
          </p>

          <AuthFeatureList
            items={LEFT_STEPS.map(step => ({ icon: step.icon, title: step.title, desc: step.desc }))}
            gap={20}
            numbered
          />

          <AuthBrandInfoCard style={{ padding: "16px 20px" }}>
            <div style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px" }}>+5.000</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 }}>mascotas registradas en PetPass</div>
          </AuthBrandInfoCard>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-shell auth-register-shell" style={{ width: "100%", maxWidth: 440 }}>
          <div className="auth-mobile-logo">
            <AuthLogoLink mobile height={72} />
            <p style={{ color: "#64748B", fontSize: 13, marginTop: 8, fontWeight: 600 }}>Empez&aacute; en pocos minutos.</p>
          </div>

          <div className="auth-mobile-logo auth-mobile-benefits" style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 0, justifyContent: "center" }}>
            {MOBILE_BENEFITS.map((benefit) => (
              <UiChip key={benefit} color="#2CB8AD" style={{ minHeight: 28, padding: "4px 12px", fontSize: 11 }}>
                {benefit}
              </UiChip>
            ))}
          </div>

          <div className="auth-card" style={AUTH_CARD_STYLE}>
            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4, color: "#1C3557", letterSpacing: "-0.3px" }}>Crear cuenta</h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>Empez&aacute; con una base clara para cuidar mejor a tu mascota.</p>

            <div className="auth-form" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="auth-name-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="Nombre *" value={form.first_name} onChange={e => update("first_name", e.target.value)} />
                <input placeholder="Apellido *" value={form.last_name} onChange={e => update("last_name", e.target.value)} />
              </div>
              <input placeholder="Email *" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
              <input placeholder="Tel&eacute;fono (WhatsApp)" value={form.phone} onChange={e => update("phone", e.target.value)} />
              <input placeholder="Contrase&ntilde;a * (m&iacute;n. 8 caracteres)" type="password" value={form.password} onChange={e => update("password", e.target.value)} />

              <label className="auth-terms" style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "10px 12px", background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <input
                  type="checkbox"
                  checked={aceptaTerminos}
                  onChange={e => setAceptaTerminos(e.target.checked)}
                  style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1, accentColor: "#2CB8AD" }}
                />
                <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Soy mayor de 18 a&ntilde;os y acepto los{" "}
                  <Link href="/terminos" target="_blank" style={{ color: "#2CB8AD", fontWeight: 700, textDecoration: "none" }}>T&eacute;rminos y Condiciones</Link>
                  {" "}y la{" "}
                  <Link href="/privacidad" target="_blank" style={{ color: "#2CB8AD", fontWeight: 700, textDecoration: "none" }}>Pol&iacute;tica de Privacidad</Link>
                  {" "}de PetPass.
                </span>
              </label>

              {error && (
                <div className="auth-error" style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button
                className="auth-submit"
                onClick={handleRegister}
                disabled={loading}
                style={{ ...AUTH_PRIMARY_BUTTON_STYLE, marginTop: 4, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
              >
                {loading ? "Creando tu cuenta..." : "Crear cuenta"}
              </button>
            </div>
          </div>

          <p className="auth-switch" style={{ textAlign: "center", marginTop: 20, color: "#64748B", fontSize: 14 }}>
            &iquest;Ya ten&eacute;s cuenta?{" "}
            <Link href="/login" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>Ingres&aacute;</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
