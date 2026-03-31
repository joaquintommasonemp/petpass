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
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
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
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "60px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <h1 style={{ fontFamily: "Georgia, serif", color: "#4ade80", fontSize: 28, marginTop: 8 }}>PetPass</h1>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Crear cuenta</h2>
      <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 20 }}>Es gratis. Siempre.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input placeholder="Nombre *" value={form.first_name} onChange={e => update("first_name", e.target.value)} />
          <input placeholder="Apellido *" value={form.last_name} onChange={e => update("last_name", e.target.value)} />
        </div>
        <input placeholder="Email *" type="email" value={form.email} onChange={e => update("email", e.target.value)} />
        <input placeholder="Teléfono (WhatsApp)" value={form.phone} onChange={e => update("phone", e.target.value)} />
        <input placeholder="Contraseña *" type="password" value={form.password} onChange={e => update("password", e.target.value)} />

        {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}

        <button onClick={handleRegister} disabled={loading} style={{
          background: "#4ade80", color: "#000", border: "none", borderRadius: 12,
          padding: 14, fontWeight: 800, fontSize: 15, marginTop: 4,
          opacity: loading ? 0.6 : 1,
        }}>{loading ? "Creando cuenta..." : "Crear cuenta gratis"}</button>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, color: "#7a8299", fontSize: 13 }}>
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700 }}>Ingresá</Link>
      </p>
    </main>
  );
}
