"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase envía el token en el hash de la URL (#access_token=...&type=recovery)
    // onAuthStateChange lo detecta y establece la sesión automáticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleReset() {
    if (!password || !confirm) { setError("Completá ambos campos"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }

    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("No se pudo actualizar la contraseña. Solicitá un nuevo link de recuperación.");
    } else {
      setSuccess(true);
      setTimeout(() => { window.location.href = "/dashboard"; }, 2500);
    }
    setLoading(false);
  }

  return (
    <main className="auth-wrapper">
      <div className="auth-left auth-brand-panel">
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div className="auth-brand-content" style={{ position: "relative" }}>
          <Link href="/" className="auth-brand-logo-link" style={{ textDecoration: "none", display: "flex", justifyContent: "center", marginBottom: 44 }}>
            <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 68, width: "auto", objectFit: "contain", filter: "brightness(0) invert(1)", display: "block" }} />
          </Link>
          <h2 style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 12, letterSpacing: "-0.5px" }}>
            Recuperá tu cuenta
          </h2>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.7 }}>
            Elegí una nueva contraseña segura para seguir cuidando a tu mascota.
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-shell" style={{ width: "100%", maxWidth: 400 }}>
          <div className="auth-mobile-logo">
            <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
              <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 72, width: "auto", objectFit: "contain", display: "block" }} />
            </Link>
          </div>

          <div className="auth-card" style={{
            background: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: 24, padding: "36px 32px",
            boxShadow: "0 4px 32px rgba(28,53,87,0.09)",
          }}>
            {success ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 8 }}>
                  Contraseña actualizada
                </h2>
                <p style={{ color: "#64748B", fontSize: 14 }}>
                  Redirigiendo al dashboard...
                </p>
              </div>
            ) : !ready ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 8 }}>
                  Verificando link...
                </h2>
                <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}>
                  Si llegaste desde el email de recuperación, esperá un momento.<br />
                  Si el link expiró,{" "}
                  <Link href="/login" style={{ color: "#2CB8AD", fontWeight: 700 }}>
                    solicitá uno nuevo
                  </Link>.
                </p>
              </div>
            ) : (
              <>
                <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4, color: "#1C3557", letterSpacing: "-0.3px" }}>
                  Nueva contraseña
                </h2>
                <p style={{ color: "#64748B", fontSize: 14, marginBottom: 28 }}>
                  Elegí una contraseña de al menos 6 caracteres
                </p>

                <div className="auth-form" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input
                    placeholder="Nueva contraseña"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <input
                    placeholder="Repetir contraseña"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleReset()}
                  />

                  {error && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13 }}>
                      {error}
                    </div>
                  )}

                  <button onClick={handleReset} disabled={loading} style={{
                    background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                    color: "#fff", border: "none", borderRadius: 14,
                    padding: "15px 20px", fontWeight: 900, fontSize: 15, marginTop: 4,
                    opacity: loading ? 0.6 : 1,
                    boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}>
                    {loading ? "Guardando..." : "Guardar contraseña →"}
                  </button>
                </div>
              </>
            )}
          </div>

          <p style={{ textAlign: "center", marginTop: 20, color: "#64748B", fontSize: 14 }}>
            <Link href="/login" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>
              ← Volver al login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
