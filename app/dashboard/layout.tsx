"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const TABS = [
  { href: "/dashboard",            label: "Perfil",      icon: "🐾", desc: "Tu mascota" },
  { href: "/dashboard/historial",  label: "Historial",   icon: "🏥", desc: "Consultas y docs" },
  { href: "/dashboard/chat",       label: "Vet IA",      icon: "🤖", desc: "Consultá con IA" },
  { href: "/dashboard/educacion",  label: "Educación",   icon: "📚", desc: "Tips y adiestramiento" },
  { href: "/dashboard/paseos",     label: "Guardería",   icon: "🐕", desc: "Paseadores" },
  { href: "/dashboard/comunidad",  label: "Comunidad",   icon: "👥", desc: "Explorar y adopciones" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="dashboard-wrapper">

      {/* Mobile Header */}
      <div className="dashboard-header" style={{
        background: "#181c27cc", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #252a3a",
        padding: "12px 20px", alignItems: "center",
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

      {/* Desktop Sidebar */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #4ade8033, #22c55e22)",
              border: "1px solid #4ade8044",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>🐾</div>
            <div>
              <div style={{
                fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 20,
                background: "linear-gradient(135deg, #f0f4ff, #4ade80)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>PetPass</div>
            </div>
          </div>
          <div style={{ color: "#7a8299", fontSize: 11, paddingLeft: 2 }}>Tu mascota, siempre protegida</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#252a3a", margin: "0 16px 12px" }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12,
                textDecoration: "none",
                background: active ? "#4ade8015" : "transparent",
                borderLeft: active ? "3px solid #4ade80" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" }}>{tab.icon}</span>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: active ? "#4ade80" : "#f0f4ff",
                  }}>{tab.label}</div>
                  <div style={{ fontSize: 11, color: "#7a8299", marginTop: 1 }}>{tab.desc}</div>
                </div>
                {active && (
                  <div style={{
                    marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                    background: "#4ade80", boxShadow: "0 0 8px #4ade80",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 1, background: "#252a3a", marginBottom: 4 }} />
          <Link href="/mascota/nueva" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            color: "#000", borderRadius: 12, padding: "10px 16px",
            fontWeight: 800, fontSize: 13, textDecoration: "none",
            boxShadow: "0 4px 16px #4ade8030",
          }}>
            <span style={{ fontSize: 16 }}>+</span> Nueva mascota
          </Link>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "transparent", border: "1px solid #252a3a",
            color: "#7a8299", borderRadius: 12, padding: "8px 16px",
            fontWeight: 600, fontSize: 12, cursor: "pointer",
          }}>
            <span style={{ fontSize: 14 }}>{"<-"}</span> Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-content dashboard-content-pad">
        {children}
      </div>

      {/* Mobile Bottom Nav */}
      <div className="dashboard-nav">
        {TABS.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} style={{
              flex: 1, textDecoration: "none", display: "flex", flexDirection: "column",
              alignItems: "center", padding: "8px 2px 6px", gap: 1,
            }}>
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: active ? "#4ade80" : "#7a8299" }}>{tab.label}</span>
              {active && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#4ade80" }} />}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
