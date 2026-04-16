"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import GlobalSearch from "@/components/GlobalSearch";
import { UiBadge, UiIconToken, UiMiniButton } from "@/components/ui";
import PushButton from "@/components/PushButton";

const TABS = [
  { href: "/dashboard", label: "Perfil", icon: "\uD83D\uDC3E", desc: "Tu mascota al d\u00eda" },
  { href: "/dashboard/historial", label: "Historial", icon: "\uD83C\uDFE5", desc: "Consultas y documentos" },
  { href: "/dashboard/chat", label: "Vet IA", icon: "\uD83E\uDD16", desc: "Orientaci\u00f3n con IA" },
  { href: "/dashboard/educacion", label: "Training", icon: "\uD83C\uDF93", desc: "Tips y entrenamiento" },
  { href: "/dashboard/paseos", label: "Cuidadores", mobileLabel: "Paseos", icon: "\uD83D\uDC15", desc: "Paseos y guarder\u00eda" },
  { href: "/dashboard/comunidad", label: "Comunidad", mobileLabel: "Social", icon: "\uD83D\uDC65", desc: "Adopciones y contacto" },
];

function UserInitialBadge({ name, size = 32, fontSize = 13 }: { name: string; size?: number; fontSize?: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
      background: "linear-gradient(135deg, #2CB8AD, #3B82F6)",
      color: "#fff",
      fontSize,
      fontWeight: 800,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [emailVerified, setEmailVerified] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [resentVerification, setResentVerification] = useState(false);
  const [userName, setUserName] = useState("");
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      setAuthToken(session.access_token);

      if (!session.user.email_confirmed_at) {
        setEmailVerified(false);
        setUserEmail(session.user.email || "");
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin, full_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.full_name) setUserName(profile.full_name);
      if (!profile?.is_admin) return;

      setIsAdmin(true);
      const [{ count: countDesc }, { count: countPrem }] = await Promise.all([
        supabase.from("solicitudes_descuento").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
        supabase.from("solicitudes_premium").select("id", { count: "exact", head: true }).eq("estado", "pendiente"),
      ]);
      setPendingCount((countDesc || 0) + (countPrem || 0));
    }
    checkSession();
  }, []);

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
      setErrorEliminar("No pudimos eliminar la cuenta. Intentá de nuevo.");
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

  const currentTab = TABS.find(t => t.href === pathname)
    || (pathname === "/admin" ? { icon: "\uD83D\uDEE1\uFE0F", label: "Admin", desc: "Panel de control" } : TABS[0]);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header dashboard-mobile-header" style={{
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E8F0",
        padding: "12px 16px",
        alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.97)", minWidth: 0 }}>
          {userName ? (
            <UserInitialBadge name={userName} size={30} fontSize={12} />
          ) : null}
          <Image src="/logo-brand-official.png" alt="PetPass" width={150} height={44} priority style={{ height: 44, width: "auto", objectFit: "contain", display: "block" }} />
        </div>
        <Link href="/mascota/nueva" style={{
          background: "linear-gradient(135deg, #2CB8AD, #229E94)",
          color: "#fff", border: "none",
          borderRadius: 10, padding: "7px 14px", fontSize: 12, fontWeight: 800, textDecoration: "none",
          boxShadow: "0 2px 12px rgba(44,184,173,0.25)", flexShrink: 0,
        }}>+ Mascota</Link>
      </div>

      <aside className="dashboard-sidebar dashboard-shell-sidebar">
        <div className="dashboard-sidebar-brand" style={{
          padding: "30px 18px 20px",
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          flexShrink: 0,
        }}>
          <Image src="/logo-brand-official.png" alt="PetPass" width={200} height={60} priority style={{ width: "100%", maxWidth: 200, height: "auto", objectFit: "contain", marginBottom: 20, display: "block" }} />
          {userName && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              borderRadius: 14, padding: "8px 12px",
              width: "100%", boxShadow: "0 1px 4px rgba(28,53,87,0.06)",
            }}>
              <UserInitialBadge name={userName} />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1C3557", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName}
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>Mi cuenta</div>
              </div>
            </div>
          )}
        </div>

        <nav className="dashboard-sidebar-nav" style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map(tab => {
            const active = pathname === tab.href;
            return (
              <Link key={tab.href} href={tab.href} className="dashboard-sidebar-link" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 12,
                textDecoration: "none",
                background: active ? "#E5F7F6" : "transparent",
                borderLeft: active ? "3px solid #2CB8AD" : "3px solid transparent",
                transition: "all 0.15s",
                boxShadow: active ? "0 2px 8px rgba(44,184,173,0.12)" : "none",
              }}>
                <UiIconToken color="#2CB8AD" active={active}>{tab.icon}</UiIconToken>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#2CB8AD" : "#1C3557" }}>{tab.label}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{tab.desc}</div>
                </div>
                {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#2CB8AD" }} />}
              </Link>
            );
          })}

          {isAdmin && (
            <Link href="/admin" className="dashboard-sidebar-link" style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 12,
              textDecoration: "none",
              background: pathname === "/admin" ? "#FFF0E8" : "transparent",
              borderLeft: pathname === "/admin" ? "3px solid #F97316" : "3px solid transparent",
              transition: "all 0.15s",
            }}>
              <UiIconToken color="#F97316" active={pathname === "/admin"}>{"\uD83D\uDEE1\uFE0F"}</UiIconToken>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: pathname === "/admin" ? "#F97316" : "#1C3557" }}>Admin</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>Panel de control</div>
              </div>
              {pendingCount > 0 && (
                <UiBadge color="#EF4444" fontSize={10} style={{ minWidth: 22, justifyContent: "center", display: "inline-flex" }}>
                  {pendingCount > 9 ? "9+" : pendingCount}
                </UiBadge>
              )}
            </Link>
          )}
        </nav>

        <div className="dashboard-sidebar-actions" style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 6 }}>
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
          <Link href="/perfil" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: "#F8FAFC", border: "1px solid #E2E8F0",
            color: "#64748B", borderRadius: 12, padding: "8px 16px",
            fontWeight: 600, fontSize: 12, textDecoration: "none",
          }}>
            Mi perfil
          </Link>
          <UiMiniButton onClick={() => { setShowSugerencia(true); setSugEnviada(false); setSugerenciaText(""); }} style={{
            minHeight: 38,
            borderRadius: 12,
            padding: "8px 16px",
          }}>
            Sugerencias
          </UiMiniButton>
          <PushButton authToken={authToken} />
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

      {showEliminar && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)", border: "1px solid #FECACA" }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12, color: "#EF4444", fontWeight: 900 }}>!</div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1C3557", marginBottom: 8, textAlign: "center" }}>Eliminar cuenta</h3>
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
              <button onClick={() => setShowEliminar(false)} disabled={eliminando} style={{ flex: 1, background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button onClick={handleEliminarCuenta} disabled={confirmText !== "ELIMINAR" || eliminando} style={{ flex: 2, background: confirmText === "ELIMINAR" ? "#EF4444" : "#E2E8F0", color: confirmText === "ELIMINAR" ? "#fff" : "#94A3B8", border: "none", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 800, cursor: confirmText === "ELIMINAR" ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                {eliminando ? "Eliminando..." : "Eliminar mi cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSugerencia && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            {sugEnviada ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1C3557", marginBottom: 8 }}>Gracias por contarnos</div>
                <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>Ya recibimos tu sugerencia y la vamos a revisar para seguir mejorando PetPass.</p>
                <button onClick={() => setShowSugerencia(false)} style={{ background: "linear-gradient(135deg, #2CB8AD, #229E94)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>Cerrar</button>
              </div>
            ) : (
              <>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#1C3557", marginBottom: 4 }}>Contanos qué mejorarías</div>
                <p style={{ color: "#64748B", fontSize: 12, marginBottom: 16 }}>Tu opinión nos ayuda a hacer PetPass más claro y útil.</p>
                <textarea
                  placeholder="Contanos qué te gustaría mejorar o qué te está faltando."
                  value={sugerenciaText}
                  onChange={e => setSugerenciaText(e.target.value)}
                  rows={4}
                  style={{ width: "100%", background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px", color: "#1C3557", fontSize: 13, resize: "none", marginBottom: 14 }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowSugerencia(false)} style={{ flex: 1, background: "transparent", border: "1px solid #E2E8F0", color: "#64748B", borderRadius: 12, padding: "10px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
                  <button onClick={handleSugerencia} disabled={enviandoSug || !sugerenciaText.trim()} style={{ flex: 2, background: "linear-gradient(135deg, #2CB8AD, #229E94)", color: "#fff", border: "none", borderRadius: 12, padding: "10px 0", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: enviandoSug || !sugerenciaText.trim() ? 0.6 : 1 }}>
                    {enviandoSug ? "Enviando..." : "Enviar sugerencia"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="dashboard-topbar dashboard-shell-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{
              fontSize: 11, fontWeight: 900, color: pathname === "/admin" ? "#F97316" : "#2CB8AD",
              width: 48, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: pathname === "/admin" ? "#FFF0E8" : "#E5F7F6",
              borderRadius: 12, flexShrink: 0,
              border: pathname === "/admin" ? "1px solid #FED7AA" : "1px solid #B2E8E5",
            }}>{currentTab.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#1C3557", lineHeight: 1.2, letterSpacing: "-0.3px" }}>{currentTab.label}</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{currentTab.desc}</div>
            </div>
          </div>

          <GlobalSearch />

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link href="/mascota/nueva" style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg, #2CB8AD, #229E94)",
              color: "#fff", borderRadius: 10, padding: "7px 14px",
              fontWeight: 800, fontSize: 12, textDecoration: "none",
              boxShadow: "0 2px 10px rgba(44,184,173,0.3)",
            }}>
              <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Mascota
            </Link>

            {isAdmin && pendingCount > 0 && (
              <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 6, background: "#FFF0E8", border: "1px solid #FED7AA", color: "#F97316", borderRadius: 10, padding: "7px 12px", fontWeight: 800, fontSize: 12, textDecoration: "none" }}>
                {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
              </Link>
            )}

            {userName && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserInitialBadge name={userName} />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1C3557", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName.split(" ")[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-content-pad">
          {!emailVerified && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#92400E" }}>Email</span>
              <span style={{ fontSize: 12, color: "#92400E", flex: 1 }}>
                <strong>Verificá tu email</strong> — Revisá tu bandeja de entrada para activar tu cuenta y usar todo el producto.
              </span>
              {resentVerification ? (
                <span style={{ fontSize: 11, color: "#2CB8AD", fontWeight: 700 }}>Enviado</span>
              ) : (
                <button
                  onClick={async () => {
                    await supabase.auth.resend({ type: "signup", email: userEmail });
                    setResentVerification(true);
                  }}
                  style={{ background: "#FEF3C7", border: "1px solid #FDE68A", borderRadius: 8, color: "#92400E", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer" }}
                >Reenviar</button>
              )}
            </div>
          )}
          {children}
        </div>
      </div>

      <div className="dashboard-nav dashboard-mobile-nav">
        {TABS.map(tab => {
          const active = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href} className={active ? "dashboard-mobile-nav-link dashboard-mobile-nav-link-active" : "dashboard-mobile-nav-link"} style={{ flex: 1, textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 2px 6px", gap: 1 }}>
              <span style={{ fontSize: 16, lineHeight: 1.15 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.15, color: active ? "#2CB8AD" : "#64748B" }}>{(tab as any).mobileLabel || tab.label}</span>
              {active && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2CB8AD" }} />}
            </Link>
          );
        })}
        {isAdmin && (
          <Link href="/admin" className={pathname === "/admin" ? "dashboard-mobile-nav-link dashboard-mobile-nav-link-active" : "dashboard-mobile-nav-link"} style={{ flex: 1, textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 2px 6px", gap: 1, position: "relative" }}>
            <span style={{ fontSize: 16, lineHeight: 1.15 }}>{"\uD83D\uDEE1\uFE0F"}</span>
            <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1.15, color: pathname === "/admin" ? "#F97316" : "#64748B" }}>Admin</span>
              {pendingCount > 0 && (
                <UiBadge color="#EF4444" fontSize={9} style={{ position: "absolute", top: 4, right: "50%", marginRight: -18, minWidth: 18, justifyContent: "center", display: "inline-flex", padding: "1px 5px" }}>
                  {pendingCount > 9 ? "9+" : pendingCount}
                </UiBadge>
              )}
          </Link>
        )}
      </div>
    </div>
  );
}

