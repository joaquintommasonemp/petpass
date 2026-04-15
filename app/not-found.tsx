import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #E5F7F6 0%, #F4F6FB 60%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      textAlign: "center",
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 32 }}>
        <img
          src="/logo-brand-official.png"
          alt="PetPass"
          style={{ height: 48, width: "auto", objectFit: "contain" }}
        />
      </Link>

      {/* Ilustración */}
      <div style={{
        fontSize: 80,
        marginBottom: 8,
        lineHeight: 1,
        filter: "drop-shadow(0 4px 12px rgba(44,184,173,0.2))",
      }}>
        🐾
      </div>

      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 20,
        padding: "32px 28px",
        maxWidth: 380,
        width: "100%",
        boxShadow: "0 4px 24px rgba(28,53,87,0.08)",
      }}>
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: "#1C3557",
          lineHeight: 1,
          marginBottom: 8,
        }}>
          404
        </div>
        <h1 style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#1C3557",
          marginBottom: 12,
        }}>
          Esta página no existe
        </h1>
        <p style={{
          color: "#64748B",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          Parece que tu mascota salió a explorar y se perdió en el camino.
          La página que buscás no existe o fue movida.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/dashboard" style={{
            display: "block",
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff",
            borderRadius: 12,
            padding: "13px 20px",
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
          }}>
            Ir al dashboard
          </Link>
          <Link href="/" style={{
            display: "block",
            background: "#FFFFFF",
            color: "#64748B",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}>
            Volver al inicio
          </Link>
        </div>
      </div>

      <p style={{ color: "#94A3B8", fontSize: 12, marginTop: 24 }}>
        ¿Perdiste algo importante?{" "}
        <Link href="/dashboard/perdidas" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>
          Reportar mascota perdida
        </Link>
      </p>
    </div>
  );
}
