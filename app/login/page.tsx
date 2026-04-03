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
    <main style={{ minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Card */}
      <div style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
            <img src="/logo.png" alt="PetPass" style={{ height: 60, width: "auto", objectFit: "contain" }} />
          </Link>
        </div>

        <div style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 4px 24px rgba(28,53,87,0.08)",
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, color: "#1C3557" }}>Bienvenido de vuelta</h2>
          <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24 }}>Ingresá para ver a tu mascota</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              placeholder="Contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />

            {error && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 13 }}>
                {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading} style={{
              background: "linear-gradient(135deg, #2CB8AD, #229E94)",
              color: "#fff", border: "none", borderRadius: 12,
              padding: 14, fontWeight: 800, fontSize: 15, marginTop: 4,
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
              cursor: loading ? "not-allowed" : "pointer",
            }}>{loading ? "Ingresando..." : "Entrar →"}</button>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 20, color: "#64748B", fontSize: 13 }}>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>
            Registrate gratis
          </Link>
        </p>
      </div>
    </main>
  );
}
