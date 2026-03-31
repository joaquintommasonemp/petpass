"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Email o contraseña incorrectos");
    else router.push("/dashboard");
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "60px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <h1 style={{ fontFamily: "Georgia, serif", color: "#4ade80", fontSize: 28, marginTop: 8 }}>PetPass</h1>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Iniciar sesión</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />

        {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}

        <button onClick={handleLogin} disabled={loading} style={{
          background: "#4ade80", color: "#000", border: "none", borderRadius: 12,
          padding: 14, fontWeight: 800, fontSize: 15, marginTop: 4,
          opacity: loading ? 0.6 : 1,
        }}>{loading ? "Ingresando..." : "Entrar"}</button>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, color: "#7a8299", fontSize: 13 }}>
        ¿No tenés cuenta?{" "}
        <Link href="/registro" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700 }}>Registrate</Link>
      </p>
    </main>
  );
}
