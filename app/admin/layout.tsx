"use client";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", minHeight: "100vh", padding: "0 0 40px" }}>
      <div style={{
        background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
        padding: "12px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="PetPass" style={{ height: 36, width: "auto", objectFit: "contain" }} />
          <span style={{
            background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
            borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800,
          }}>ADMIN</span>
        </div>
        <Link href="/dashboard" style={{
          background: "#E2E8F0", color: "#64748B", border: "1px solid #E2E8F0",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none",
        }}>← Volver</Link>
      </div>
      <div style={{ padding: "24px 24px" }}>
        {children}
      </div>
    </div>
  );
}
