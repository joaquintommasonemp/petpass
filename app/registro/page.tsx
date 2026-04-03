"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Registro() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleRegister() {
    if (!form.first_name || !form.last_name || !form.email || !form.password) {
      setError("Completá todos los campos obligatorios"); return;
    }
    setLoading(true);
    setError("");
    const { data, error: signUpError } = await supabase.auth.signUp({ email: form.email, password: form.password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: `${form.first_name} ${form.last_name}`,
        phone: form.phone,
      });
    }
    router.push("/mascota/nueva");
    setLoading(false);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <img src="/logo.png" alt="PetPass" style={{ height: 60, width: "auto", objectFit: "contain" }} />
          </Link>
          <p style={{ color: "#64748B", fontSize: 13, marginTop: 10, fontWeight: 600 }}>Gratis. Siempre.</p>
        </div>

        {/* Beneficios */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
          {["🤖 IA veterinaria", "🏥 Historia clínica", "👥 Comunidad"].map(b => (
            <span key={b} style={{
              background: "#E5F7F6", border: "1px solid #B2E8E5",
              borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#2CB8AD",
            }}>{b}</span>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(28,53,87,0.08)",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: "#1C3557" }}>Crear cuenta</h2>
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24 }}>Tu mascota te lo va a agradecer 🐾</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input placeholder="Nombre *" value={form.first_name} onChange={e => update("first_name", e.target.value)} />
              <input placeholder="Apellido *" value={form.last_name} onChange={e => update("last_name", e.target.value)} />
            </div>
            <input placeholder="Email *" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
            <input placeholder="Teléfono (WhatsApp)" value={form.phone} onChange={e => update("phone", e.target.value)} />
            <input placeholder="Contraseña *" type="password" value={form.password} onChange={e => update("password", e.target.value)} />

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button onClick={handleRegister} disabled={loading} style={{
              background: "linear-gradient(135deg, #2CB8AD, #229E94)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: 14, fontWeight: 800, fontSize: 15, marginTop: 4,
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
              cursor: loading ? "not-allowed" : "pointer",
            }}>{loading ? "Creando cuenta..." : "Crear cuenta gratis →"}</button>

            <p style={{ textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 4 }}>
              Al registrarte aceptás los términos de uso
            </p>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "#64748B", fontSize: 13 }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>Ingresá</Link>
        </p>
      </div>
    </main>
  );
}
