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
    <main style={{ maxWidth: 400, margin: "0 auto", padding: "48px 24px" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🐾</div>
          <div style={{
            fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 800,
            background: "linear-gradient(135deg, #f0f4ff, #4ade80)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>PetPass</div>
        </Link>
      </div>

      {/* Card */}
      <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 20, padding: "28px 24px" }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Bienvenido de vuelta</h2>
        <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 24 }}>Ingresá para ver a tu mascota</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="Contraseña" type="password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()} />

          {error && (
            <div style={{ background: "#f8717115", border: "1px solid #f8717133", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
              {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} style={{
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#000", border: "none", borderRadius: 12,
            padding: 14, fontWeight: 800, fontSize: 15, marginTop: 4,
            opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px #4ade8030",
          }}>{loading ? "Ingresando..." : "Entrar →"}</button>
        </div>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, color: "#7a8299", fontSize: 13 }}>
        ¿No tenés cuenta?{" "}
        <Link href="/registro" style={{ color: "#4ade80", textDecoration: "none", fontWeight: 700 }}>
          Registrate gratis
        </Link>
      </p>
    </main>
  );
}
