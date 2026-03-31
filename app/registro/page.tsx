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
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "48px 24px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🐾</div>
          <div style={{
            fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 800,
            background: "linear-gradient(135deg, #f0f4ff, #4ade80)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>PetPass</div>
        </Link>
        <p style={{ color: "#7a8299", fontSize: 13, marginTop: 8 }}>Gratis. Siempre.</p>
      </div>

      {/* Beneficios rápidos */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
        {["🤖 IA veterinaria", "🏥 Historia clínica", "👥 Comunidad"].map(b => (
          <span key={b} style={{
            background: "#4ade8012", border: "1px solid #4ade8025",
            borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#4ade80",
          }}>{b}</span>
        ))}
      </div>

      {/* Card */}
      <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 20, padding: "28px 24px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Crear cuenta</h2>
        <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 24 }}>Tu mascota te lo va a agradecer 🐾</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="Nombre *" value={form.first_name} onChange={e => update("first_name", e.target.value)} />
            <input placeholder="Apellido *" value={form.last_name} onChange={e => update("last_name", e.target.value)} />
          </div>
          <input placeholder="Email *" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
          <input placeholder="Teléfono (WhatsApp)" value={form.phone} onChange={e => update("phone", e.target.value)} />
          <input placeholder="Contraseña *" type="password" value={form.password} onChange={e => update("password", e.target.value)} />

          {error && (
            <div style={{ background: "#f8717115", border: "1px solid #f8717133", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button onClick={handleRegister} disabled={loading} style={{
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#000", border: "none", borderRadius: 12,
            padding: 14, fontWeight: 800, fontSize: 15, marginTop: 4,
            opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px #4ade8030",
          }}>{loading ? "Creando cuenta..." : "Crear cuenta gratis →"}</button>

          <p style={{ textAlign: "center", color: "#7a8299", fontSize: 11, marginTop: 4 }}>
            Al registrarte aceptás los términos de uso
          </p>
        </div>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, color: "#7a8299", fontSize: 13 }}>
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700 }}>Ingresá</Link>
      </p>
    </main>
  );
}
