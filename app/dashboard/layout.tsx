"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  const [showSugerencia, setShowSugerencia] = useState(false);
  const [sugerenciaText, setSugerenciaText] = useState("");
  const [enviandoSug, setEnviandoSug] = useState(false);
  const [sugEnviada, setSugEnviada] = useState(false);

  const [showEliminar, setShowEliminar] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState("");

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function handleEliminarCuenta() {
    if (confirmText !== "ELIMINAR") return;
    setEliminando(true);
    setErrorEliminar("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/"); return; }
      const res = await fetch("/api/cuenta/eliminar", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorEliminar(data.error || "Error al eliminar la cuenta");
        setEliminando(false);
        return;
      }
      await supabase.auth.signOut();
      router.push("/?cuenta=eliminada");
    } catch {
      setErrorEliminar("Error de conexión. Intentá de nuevo.");
      setEliminando(false);
    }
  }

  async function handleSugerencia() {
    if (!sugerenciaText.trim()) return;
    setEnviandoSug(true);
    await supabase.from("comunidad_mensajes").insert({
      author_name: "SUGERENCIA",
      mascota_name: "pendiente",
      message: sugerenciaText,
    });
    setSugEnviada(true);
    setEnviandoSug(false);
  }

  return (
    <div className="dashboard-wrapper">

      {/* Mobile Header */}
      <div className="dashboard-header" style={{
        background: "#FFFFFFee", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E8F0",
        padding: "14px 20px",
        alignItems: "center", justifyContent: "center",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <img src="/logo.png" alt="PetPass" style={{ height: 56, width: "auto", objectFit: "contain" }} />
        <Link href="/mascota/nueva" style={{
          position: "absolute", right: 16,
          background: "linear-gradient(135deg, #2CB8AD, #229E94)",
          color: "#fff", border: "none",
          borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 2px 12px rgba(44,184,173,0.25)",
        }}>+ Mascota</Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="dashboard-sidebar">
        {/* Logo area with teal accent */}
        <div style={{
          padding: "24px 20px 20px",
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "linear-gradient(160deg, #F0FAFA 0%, #FFFFFF 100%)",
          borderBottom: "2px solid #B2E8E5",
        }}>
          <img src="/logo.png" alt="PetPass" style={{ width: "100%", maxWidth: 160, height: "auto", objectFit: "contain" }} />
          <div style={{
            marginTop: 10, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            color: "#2CB8AD", textTransform: "uppercase", opacity: 0.85,
          }}>Salud animal digital</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 12,
                textDecoration: "none",
                background: active ? "#E5F7F6" : "transparent",
                borderLeft: active ? "3px solid #2CB8AD" : "3px solid transparent",
                transition: "all 0.15s",
                boxShadow: active ? "0 2px 8px rgba(44,184,173,0.12)" : "none",
              }}>
                <span style={{
                  fontSize: 18, flexShrink: 0, width: 28, height: 28,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? "#2CB8AD22" : "#F4F6FB",
                  borderRadius: 8,
                }}>{tab.icon}</span>
                <div>
                  <div style={{
                    fontSize: 13, fontWeight: 700,
                    color: active ? "#2CB8AD" : "#1C3557",
                  }}>{tab.label}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{tab.desc}</div>
                </div>
                {active && (
                  <div style={{
                    marginLeft: "auto", width: 6, height: 6, borderRadius: "50%",
                    background: "#2CB8AD",
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ height: 1, background: "#E2E8F0", marginBottom: 4 }} />
          <Link href="/mascota/nueva" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff", borderRadius: 12, padding: "10px 16px",
            fontWeight: 800, fontSize: 13, textDecoration: "none",
            boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
          }}>
            <span style={{ fontSize: 16 }}>+</span> Nueva mascota
          </Link>
          <button onClick={() => { setShowSugerencia(true); setSugEnviada(false); setSugerenciaText(""); }} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "#F0FAFA", border: "1px solid #B2E8E5",
            color: "#2CB8AD", borderRadius: 12, padding: "8px 16px",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>
            💡 Sugerencias
          </button>
          <button onClick={handleLogout} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "transparent", border: "1px solid #E2E8F0",
            color: "#94A3B8", borderRadius: 12, padding: "7px 16px",
            fontWeight: 600, fontSize: 11, cursor: "pointer",
          }}>
            ← Cerrar sesión
          </button>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, paddingTop: 4 }}>
            <Link href="/terminos" style={{ fontSize: 10, color: "#CBD5E1", textDecoration: "none" }}>Términos</Link>
            <Link href="/privacidad" style={{ fontSize: 10, color: "#CBD5E1", textDecoration: "none" }}>Privacidad</Link>
            <button
              onClick={() => { setShowEliminar(true); setConfirmText(""); setErrorEliminar(""); }}
              style={{ fontSize: 10, color: "#FCA5A5", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}
            >Eliminar cuenta</button>
          </div>
        </div>
      </aside>

      {/* Modal Eliminar Cuenta */}
      {showEliminar && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 20, padding: 28,
            maxWidth: 380, width: "100%",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            border: "1px solid #FECACA",
          }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1C3557", marginBottom: 8, textAlign: "center" }}>
              Eliminar cuenta
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
              Esta acción es <strong style={{ color: "#EF4444" }}>permanente e irreversible</strong>. Se borrarán:
            </p>
            <ul style={{ fontSize: 12, color: "#64748B", paddingLeft: 18, marginBottom: 16, lineHeight: 1.8 }}>
              <li>Tu cuenta y perfil</li>
              <li>Todas tus mascotas y su historial</li>
              <li>Vacunas, documentos y citas</li>
              <li>Alertas de mascotas perdidas</li>
              <li>Sesiones de paseo y actualizaciones</li>
              <li>Mensajes en la comunidad</li>
              <li>Archivos y fotos subidas</li>
            </ul>
            <p style={{ fontSize: 13, color: "#1C3557", fontWeight: 700, marginBottom: 8 }}>
              Escribí <span style={{ color: "#EF4444", fontFamily: "monospace" }}>ELIMINAR</span> para confirmar:
            </p>
            <input
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="ELIMINAR"
              autoComplete="off"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10, marginBottom: 12,
                border: `1px solid ${confirmText === "ELIMINAR" ? "#EF4444" : "#E2E8F0"}`,
                fontSize: 14, fontFamily: "monospace", letterSpacing: "0.05em",
              }}
            />
            {errorEliminar && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12, marginBottom: 12 }}>
                {errorEliminar}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowEliminar(false)}
                disabled={eliminando}
                style={{
                  flex: 1, background: "transparent", border: "1px solid #E2E8F0",
                  color: "#64748B", borderRadius: 12, padding: "10px 0",
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >Cancelar</button>
              <button
                onClick={handleEliminarCuenta}
                disabled={confirmText !== "ELIMINAR" || eliminando}
                style={{
                  flex: 2, background: confirmText === "ELIMINAR" ? "#EF4444" : "#E2E8F0",
                  color: confirmText === "ELIMINAR" ? "#fff" : "#94A3B8",
                  border: "none", borderRadius: 12, padding: "10px 0",
                  fontSize: 13, fontWeight: 800, cursor: confirmText === "ELIMINAR" ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                }}
              >
                {eliminando ? "Eliminando..." : "Eliminar mi cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sugerencias */}
      {showSugerencia && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "#FFFFFF", borderRadius: 20, padding: 28,
            maxWidth: 380, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          }}>
            {sugEnviada ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1C3557", marginBottom: 8 }}>Gracias por tu sugerencia</div>
                <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>La recibimos y la vamos a tener en cuenta para mejorar PetPass.</p>
                <button onClick={() => setShowSugerencia(false)} style={{
                  background: "linear-gradient(135deg, #2CB8AD, #229E94)", color: "#fff",
                  border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}>Cerrar</button>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1C3557", marginBottom: 4 }}>💡 Envianos una sugerencia</div>
                <p style={{ color: "#64748B", fontSize: 12, marginBottom: 16 }}>Tu opinión nos ayuda a mejorar PetPass</p>
                <textarea
                  placeholder="¿Qué mejorarías? ¿Qué falta? Contanos..."
                  value={sugerenciaText}
                  onChange={e => setSugerenciaText(e.target.value)}
                  rows={4}
                  style={{ width: "100%", background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", color: "#1C3557", fontSize: 13, resize: "none", marginBottom: 14 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowSugerencia(false)} style={{
                    flex: 1, background: "transparent", border: "1px solid #E2E8F0",
                    color: "#64748B", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer",
                  }}>Cancelar</button>
                  <button onClick={handleSugerencia} disabled={enviandoSug || !sugerenciaText.trim()} style={{
                    flex: 2, background: "linear-gradient(135deg, #2CB8AD, #229E94)", color: "#fff",
                    border: "none", borderRadius: 12, padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer",
                    opacity: enviandoSug || !sugerenciaText.trim() ? 0.6 : 1,
                  }}>{enviandoSug ? "Enviando..." : "Enviar sugerencia"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Desktop top bar */}
        <div className="dashboard-topbar">
          {(() => {
            const tab = TABS.find(t => t.href === pathname) || TABS[0];
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 22, width: 40, height: 40,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "#E5F7F6", borderRadius: 10,
                }}>{tab.icon}</span>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#1C3557" }}>{tab.label}</div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{tab.desc}</div>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="dashboard-content-pad">
          {children}
        </div>
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
              <span style={{ fontSize: 8, fontWeight: 700, color: active ? "#2CB8AD" : "#64748B" }}>{tab.label}</span>
              {active && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2CB8AD" }} />}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
