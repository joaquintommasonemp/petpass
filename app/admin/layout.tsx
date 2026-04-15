"use client";
import Link from "next/link";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", minHeight: "100vh", padding: "0 0 40px" }}>
      <div style={{
        background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
        padding: "12px 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 44, width: "auto", objectFit: "contain" }} />
          <span style={{
            background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
            borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800,
          }}>ADMIN</span>
        </div>
        <Link href="/dashboard" style={{
          background: "#E2E8F0", color: "#64748B", border: "1px solid #E2E8F0",
          borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none",
        }}>&larr; Volver</Link>
      </div>
      <div style={{ padding: "24px 24px" }}>
        {children}
      </div>
    </div>
  );
}
