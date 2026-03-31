"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Perfil", icon: "🐾" },
  { href: "/dashboard/historial", label: "Historial", icon: "🏥" },
  { href: "/dashboard/chat", label: "Vet IA", icon: "🤖" },
  { href: "/dashboard/paseos", label: "Paseos", icon: "🐕" },
  { href: "/dashboard/comunidad", label: "Comunidad", icon: "👥" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", minHeight: "100vh", position: "relative" }}>
      {/* Header */}
      <div style={{
        background: "#181c27cc", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #252a3a",
        padding: "12px 20px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🐾</span>
          <div>
            <div style={{
              fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 18,
              background: "linear-gradient(135deg, #f0f4ff, #4ade80)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>PetPass</div>
            <div style={{ color: "#7a8299", fontSize: 10, marginTop: -1 }}>Tu mascota, siempre protegida</div>
          </div>
        </div>
        <Link href="/mascota/nueva" style={{
          background: "linear-gradient(135deg, #4ade80, #22c55e)",
          color: "#000", border: "none",
          borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 2px 12px #4ade8030",
        }}>+ Mascota</Link>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 90px" }}>
        {children}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 440, background: "#181c27",
        borderTop: "1px solid #252a3a", display: "flex", zIndex: 100,
      }}>
        {TABS.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} style={{
              flex: 1, textDecoration: "none", display: "flex", flexDirection: "column",
              alignItems: "center", padding: "10px 4px 8px", gap: 2,
            }}>
              <span style={{ fontSize: 18 }}>{tab.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: active ? "#4ade80" : "#7a8299" }}>{tab.label}</span>
              {active && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80" }} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
