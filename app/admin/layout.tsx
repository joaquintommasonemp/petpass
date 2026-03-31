"use client";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", minHeight: "100vh", padding: "0 0 40px" }}>
      <div style={{
        background: "#181c27", borderBottom: "1px solid #252a3a",
        padding: "12px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 20, color: "#4ade80" }}>PetPass 🐾</div>
          <span style={{
            background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
            borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800,
          }}>ADMIN</span>
        </div>
        <Link href="/dashboard" style={{
          background: "#252a3a", color: "#7a8299", border: "1px solid #353a4a",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none",
        }}>← Volver</Link>
      </div>
      <div style={{ padding: "24px 24px" }}>
        {children}
      </div>
    </div>
  );
}
