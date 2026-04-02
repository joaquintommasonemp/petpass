"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

const TABS = [
  { href: "/dashboard",            label: "Perfil",      icon: "🐾", desc: "Tu mascota" },
  { href: "/dashboard/historial",  label: "Historial",   icon: "🏥", desc: "Consultas y docs" },
  { href: "/dashboard/chat",       label: "Vet IA",      icon: "🤖", desc: "Consultá con IA" },
  { href: "/dashboard/educacion",  label: "Training",    icon: "🎓", desc: "Entrenamiento y tips" },
  { href: "/dashboard/paseos",     label: "Cuidadores",  icon: "🐕", desc: "Paseos y guarderia" },
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
        background: "#FFFFFFee", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E8F0",
        padding: "12px 20px", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, color: "#0CCE6B" }}>🐾</span>
          <div>
            <div style={{
              fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 18,
              color: "#0F1E3D",
            }}>PetPass</div>
            <div style={{ color: "#64748B", fontSize: 10, marginTop: -1 }}>Tu mascota, siempre protegida</div>
          </div>
        </div>
        <Link href="/mascota/nueva" style={{
          background: "linear-gradient(135deg, #0CCE6B, #09A855)",
          color: "#fff", border: "none",
          borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 2px 12px rgba(12,206,107,0.25)",
        }}>+ Mascota</Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="dashboard-sidebar">
        {/* Logo */}
        <div style={{ padding: "28px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "#E8FFF2",
              border: "1px solid #C6F6E0",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>🐾</div>
            <div>
              <div style={{
                fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 20,
                color: "#0F1E3D",
              }}>PetPass</div>
            </div>
          </div>
          <div style={{ color: "#64748B", fontSize: 11, paddingLeft: 2 }}>Tu mascota, siempre protegida</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#E2E8F0", margin: "0 16px 12px" }} />

        {/* Nav */}
        <nav style={{ flex: 1, padding: "4px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12,
                textDecoration: "none",
                background: active ? "#E8FFF2" : "transparent",
                borderLeft: active ? "3px solid #0CCE6B" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, width: 24, textAlign: "center" }}>{tab.icon}</span>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: active ? "#0CCE6B" : "#0F1E3D",
                  }}>{tab.label}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{tab.desc}</div>
                </div>
                {active && (
                  <div style={{
                    marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                    background: "#0CCE6B",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 1, background: "#E2E8F0", marginBottom: 4 }} />
          <Link href="/mascota/nueva" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "linear-gradient(135deg, #0CCE6B, #09A855)",
            color: "#fff", borderRadius: 12, padding: "10px 16px",
            fontWeight: 800, fontSize: 13, textDecoration: "none",
            boxShadow: "0 4px 16px rgba(12,206,107,0.25)",
          }}>
            <span style={{ fontSize: 16 }}>+</span> Nueva mascota
          </Link>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "transparent", border: "1px solid #E2E8F0",
            color: "#64748B", borderRadius: 12, padding: "8px 16px",
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
              <span style={{ fontSize: 8, fontWeight: 700, color: active ? "#0CCE6B" : "#64748B" }}>{tab.label}</span>
              {active && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#0CCE6B" }} />}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
