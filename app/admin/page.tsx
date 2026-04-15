"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { EmptyState, LoadingState, UiBadge, UiIconToken, UiMiniButton } from "@/components/ui";

function StatCard({ icon, label, value, color = "#2CB8AD" }: { icon: string; label: string; value: number | string; color?: string }) {
  return (
    <div className="admin-stat-card" style={{
      background: "#FFFFFF", border: `1px solid ${color}33`, borderRadius: 16,
      padding: "16px 20px", flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Badge({ children, color = "#2CB8AD" }: { children: React.ReactNode; color?: string }) {
  return <UiBadge color={color} fontSize={10}>{children}</UiBadge>;
}

export default function AdminPage() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [perdidas, setPerdidas] = useState<any[]>([]);
  const [historialCount, setHistorialCount] = useState<Record<string, number>>({});
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [iaUsageRecent, setIaUsageRecent] = useState<any[]>([]);
  const [iaTotal, setIaTotal] = useState(0);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<"todos" | "activos" | "inactivos">("activos");
  const [adminTab, setAdminTab] = useState<"mascotas" | "solicitudes" | "sugerencias" | "stats" | "ia">("mascotas");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const res = await fetch("/api/admin/data", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.status === 403) {
        setError("No tenés permisos de administrador.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMascotas(data.mascotas || []);
      setProfiles(data.profiles || []);
      setPerdidas(data.perdidas || []);
      setSolicitudes(data.solicitudes || []);
      setSugerencias(data.sugerencias || []);
      setIaUsageRecent(data.iaUsageRecent || []);
      setIaTotal(data.iaTotal || 0);

      // Contar entradas de historial por mascota
      const counts: Record<string, number> = {};
      for (const h of (data.historial || [])) {
        counts[h.mascota_id] = (counts[h.mascota_id] || 0) + 1;
      }
      setHistorialCount(counts);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <LoadingState
      icon="..."
      title="Cargando panel admin"
      description="Estamos preparando métricas, solicitudes y actividad reciente."
      style={{ padding: 60 }}
    />
  );

  if (error) return (
    <EmptyState
      icon="!"
      title="Acceso denegado"
      description={error}
      style={{ padding: 60, maxWidth: 520, margin: "0 auto" }}
    />
  );

  async function accionSolicitud(id: string, accion: string, tipo: string) {
    setProcesandoId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setProcesandoId(null); return; }
    await fetch("/api/admin/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ id, accion, tipo }),
    });
    const nuevoEstado = accion === "aprobar" ? "aprobado" : "rechazado";
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, mascota_name: nuevoEstado } : s));
    setProcesandoId(null);
  }

  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

  const mascotasFiltradas = mascotas
    .filter(m => {
      if (filtroActivo === "activos") return m.active !== false;
      if (filtroActivo === "inactivos") return m.active === false;
      return true;
    })
    .filter(m => {
      if (!search) return true;
      const owner = profileMap[m.user_id];
      const texto = `${m.name} ${m.breed} ${owner?.full_name || ""} ${owner?.email || ""}`.toLowerCase();
      return texto.includes(search.toLowerCase());
    });

  const mascotasActivas = mascotas.filter(m => m.active !== false).length;
  const mascotasInactivas = mascotas.filter(m => m.active === false).length;

  const solicitudesPendientes = solicitudes.filter(s => s.mascota_name === "pendiente");

  return (
    <div className="admin-page">
      <div className="admin-hero" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Panel de administración</h1>
        <p style={{ color: "#64748B", fontSize: 13 }}>Base de datos completa de mascotas y usuarios</p>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard icon="Masc" label="Mascotas activas" value={mascotasActivas} color="#2CB8AD" />
        <StatCard icon="Baja" label="Dados de baja" value={mascotasInactivas} color="#64748B" />
        <StatCard icon="Usr" label="Usuarios" value={profiles.length} color="#3B82F6" />
        <StatCard icon="SOS" label="Perdidas activas" value={perdidas.length} color="#EF4444" />
        <StatCard icon="Pend" label="Solicitudes pend." value={solicitudesPendientes.length} color="#F97316" />
        <StatCard icon="Idea" label="Sugerencias" value={sugerencias.length} color="#8B5CF6" />
      </div>

      {/* Admin tabs */}
      <div className="admin-tabs" style={{ display: "flex", gap: 8, marginBottom: 24, background: "#F4F6FB", borderRadius: 12, padding: 4 }}>
        {([["mascotas", "Mascotas"], ["solicitudes", "Solicitudes"], ["sugerencias", "Sugerencias"], ["stats", "Stats"], ["ia", "Vet IA"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setAdminTab(key)} style={{
            flex: 1, border: "none", borderRadius: 10, padding: "10px 4px",
            background: adminTab === key ? "#E2E8F0" : "transparent",
            color: adminTab === key ? "#1C3557" : "#64748B",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>
            {label}
            {key === "solicitudes" && solicitudesPendientes.length > 0 && (
              <UiBadge color="#F97316" fontSize={10} style={{ marginLeft: 4 }}>{solicitudesPendientes.length}</UiBadge>
            )}
            {key === "sugerencias" && sugerencias.length > 0 && (
              <UiBadge color="#8B5CF6" fontSize={10} style={{ marginLeft: 4 }}>{sugerencias.length}</UiBadge>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Solicitudes */}
      {adminTab === "solicitudes" && (
        <div>
          {solicitudes.length === 0 && (
            <EmptyState
              icon="Pend"
              title="No hay solicitudes por revisar"
              description="Cuando llegue una nueva solicitud de premium, profesional o descuentos la vas a ver acá."
              style={{ padding: 40 }}
            />
          )}
          {solicitudes.map((s: any) => {
            const tipo = s.author_name === "SOLICITUD:profesional" ? "profesional"
              : s.author_name === "SOLICITUD:premium" ? "premium" : "descuento";
            const isPendiente = s.mascota_name === "pendiente";
            let datos: any = {};
            try { datos = JSON.parse(s.message); } catch {}
            return (
              <div key={s.id} style={{
                background: "#FFFFFF",
                border: "1px solid " + (isPendiente ? "#FED7AA" : s.mascota_name === "aprobado" ? "#B2E8E5" : "#FECACA"),
                borderRadius: 16, padding: "14px 18px", marginBottom: 10,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <UiIconToken
                          color={tipo === "profesional" ? "#3B82F6" : tipo === "premium" ? "#EC4899" : "#10B981"}
                          active
                          size={30}
                          style={{ fontSize: 10 }}
                        >
                          {tipo === "profesional" ? "PRO" : tipo === "premium" ? "PREM" : "DESC"}
                        </UiIconToken>
                        {tipo === "premium" ? "Premium" : (datos.nombre || "Sin nombre")}
                      </span>
                      <Badge color={tipo === "profesional" ? "#3B82F6" : tipo === "premium" ? "#EC4899" : "#10B981"}>
                        {tipo === "profesional" ? "Profesional" : tipo === "premium" ? "Premium" : "Descuento"}
                      </Badge>
                    </div>
                    {tipo === "profesional" && datos.especialidad && (
                      <div style={{ fontSize: 12, color: "#64748B" }}>{datos.especialidad}{datos.zona ? " · " + datos.zona : ""}</div>
                    )}
                    {tipo === "descuento" && datos.rubro && (
                      <div style={{ fontSize: 12, color: "#64748B" }}>{datos.rubro}</div>
                    )}
                    {tipo === "premium" && (
                      <div style={{ fontSize: 12, color: "#64748B" }}>Solicitud de activación Premium</div>
                    )}
                    {datos.descripcion && <div style={{ fontSize: 12, color: "#1C3557", marginTop: 4 }}>{datos.descripcion}</div>}
                    {datos.descuento && <div style={{ fontSize: 12, color: "#1C3557", marginTop: 4 }}>{datos.descuento}</div>}
                    {datos.email && <div style={{ fontSize: 11, color: "#8B5CF6", marginTop: 4 }}>Email: {datos.email}</div>}
                    {datos.telefono && <div style={{ fontSize: 11, color: "#2CB8AD", marginTop: 2 }}>Tel: {datos.telefono}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <Badge color={isPendiente ? "#F97316" : s.mascota_name === "aprobado" ? "#2CB8AD" : "#EF4444"}>
                      {s.mascota_name === "pendiente" ? "Pendiente" : s.mascota_name === "aprobado" ? "Aprobado" : "Rechazado"}
                    </Badge>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 6 }}>
                      {new Date(s.created_at).toLocaleDateString("es-AR")}
                    </div>
                  </div>
                </div>
                {isPendiente && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <UiMiniButton
                      onClick={() => accionSolicitud(s.id, "aprobar", tipo)}
                      disabled={procesandoId === s.id}
                      color="#2CB8AD"
                      style={{
                        flex: 1, background: "#E5F7F6", color: "#2CB8AD",
                        border: "1px solid #B2E8E5", borderRadius: 10, padding: "8px 0",
                        fontWeight: 800, fontSize: 13, cursor: "pointer",
                        opacity: procesandoId === s.id ? 0.5 : 1,
                      }}
                    >{procesandoId === s.id ? "..." : "Aprobar"}</UiMiniButton>
                    <UiMiniButton
                      onClick={() => accionSolicitud(s.id, "rechazar", tipo)}
                      disabled={procesandoId === s.id}
                      color="#EF4444"
                      style={{
                        flex: 1, background: "#FFF0F0", color: "#EF4444",
                        border: "1px solid #FECACA", borderRadius: 10, padding: "8px 0",
                        fontWeight: 800, fontSize: 13, cursor: "pointer",
                        opacity: procesandoId === s.id ? 0.5 : 1,
                      }}
                    >{procesandoId === s.id ? "..." : "Rechazar"}</UiMiniButton>
                  </div>
                )}
                {tipo === "premium" && s.mascota_name === "aprobado" && (
                  <button
                    onClick={() => accionSolicitud(s.id, "revocar", "premium")}
                    disabled={procesandoId === s.id}
                    style={{
                      width: "100%", background: "#FFF0F0", color: "#EF4444",
                      border: "1px solid #FECACA", borderRadius: 10, padding: "8px 0",
                      fontWeight: 800, fontSize: 13, cursor: "pointer",
                      opacity: procesandoId === s.id ? 0.5 : 1,
                    }}
                  >{procesandoId === s.id ? "..." : "Revocar Premium"}</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Sugerencias */}
      {adminTab === "sugerencias" && (
        <div>
          {sugerencias.length === 0 && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 40, textAlign: "center", color: "#64748B", fontSize: 13 }}>
              No hay sugerencias todavía.
            </div>
          )}
          {sugerencias.map((s: any) => (
            <div key={s.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>💡</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6" }}>Sugerencia de usuario</span>
                </div>
                <span style={{ fontSize: 11, color: "#64748B" }}>{new Date(s.created_at).toLocaleDateString("es-AR")}</span>
              </div>
              <p style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.6 }}>{s.message}</p>
            </div>
          ))}
        </div>
      )}

      {adminTab === "mascotas" && (
      <div>

      {/* Búsqueda y filtros */}
      <div className="admin-filter-row" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="🔍  Buscar por nombre, raza o dueño..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {(["activos", "todos", "inactivos"] as const).map(f => (
            <button key={f} onClick={() => setFiltroActivo(f)} style={{
              background: filtroActivo === f ? "#E5F7F6" : "#FFFFFF",
              color: filtroActivo === f ? "#2CB8AD" : "#64748B",
              border: `1px solid ${filtroActivo === f ? "#B2E8E5" : "#E2E8F0"}`,
              borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Conteo */}
      <div style={{ color: "#64748B", fontSize: 12, marginBottom: 14 }}>
        {mascotasFiltradas.length} resultado{mascotasFiltradas.length !== 1 ? "s" : ""}
      </div>

      {/* Tabla / Lista */}
      <div className="admin-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mascotasFiltradas.length === 0 && (
          <div style={{
            background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16,
            padding: 40, textAlign: "center", color: "#64748B", fontSize: 13,
          }}>
            No se encontraron resultados.
          </div>
        )}

        {mascotasFiltradas.map((m: any) => {
          const owner = profileMap[m.user_id];
          const isGato = m.breed?.toLowerCase().includes("gato") || m.breed?.toLowerCase().includes("cat");
          const emoji = isGato ? "🐱" : "🐶";
          const diasDesdeCreacion = Math.floor((Date.now() - new Date(m.created_at).getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div className="admin-list-card" key={m.id} style={{
              background: "#FFFFFF",
              border: `1px solid ${m.active === false ? "#E2E8F0" : "#E2E8F0"}`,
              borderRadius: 16, padding: "14px 18px",
              display: "flex", gap: 16, alignItems: "center",
              opacity: m.active === false ? 0.6 : 1,
            }}>
              {/* Foto o emoji */}
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: "#E2E8F0", border: "2px solid #CBD5E1",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {m.photo_url
                  ? <img src={m.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 24 }}>{emoji}</span>
                }
              </div>

              {/* Info mascota */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{m.name}</span>
                  {m.active === false
                    ? <Badge color="#64748B">Dado de baja</Badge>
                    : <Badge color="#2CB8AD">Activo</Badge>
                  }
                  {perdidas.some(p => p.user_id === m.user_id) && (
                    <Badge color="#EF4444">Perdida reportada</Badge>
                  )}
                </div>
                <div style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>
                  {m.breed} · {m.age} · {m.sex}
                  {m.location && ` · ${m.location}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#3B82F6" }}>
                    👤 {owner?.full_name || "Sin nombre"}
                  </span>
                  {owner?.phone && (
                    <span style={{ fontSize: 11, color: "#64748B" }}>· {owner.phone}</span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div style={{ textAlign: "right", flexShrink: 0, fontSize: 11, color: "#64748B" }}>
                {historialCount[m.id] > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <Badge color="#F97316">{historialCount[m.id]} consultas</Badge>
                  </div>
                )}
                {m.chip && (
                  <div style={{ marginBottom: 4 }}>
                    <Badge color="#8B5CF6">Chip</Badge>
                  </div>
                )}
                <div style={{ marginTop: 6 }}>
                  hace {diasDesdeCreacion}d
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
      )}

      {/* Tab: Estadísticas */}
      {adminTab === "stats" && (() => {
        function getLast6Months() {
          const out = [];
          const now = new Date();
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            out.push({
              key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
              label: d.toLocaleDateString("es-AR", { month: "short" }),
            });
          }
          return out;
        }

        function BarChart({ data, color }: { data: { label: string; count: number }[]; color: string }) {
          const max = Math.max(...data.map(d => d.count), 1);
          return (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
              {data.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, opacity: d.count === 0 ? 0 : 1 }}>{d.count}</div>
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 72 }}>
                    <div style={{
                      width: "100%",
                      height: `${Math.max((d.count / max) * 72, d.count > 0 ? 6 : 0)}px`,
                      background: color,
                      borderRadius: "4px 4px 0 0",
                      opacity: 0.85,
                      transition: "height 0.3s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>{d.label}</div>
                </div>
              ))}
            </div>
          );
        }

        const months = getLast6Months();
        const usersByMonth = months.map(m => ({
          label: m.label,
          count: profiles.filter(p => p.created_at?.startsWith(m.key)).length,
        }));
        const mascotasByMonth = months.map(m => ({
          label: m.label,
          count: mascotas.filter(m2 => m2.created_at?.startsWith(m.key)).length,
        }));

        const totalHistorial = Object.values(historialCount).reduce((a, b) => a + b, 0);
        const premiumCount = profiles.filter(p => p.is_premium).length;
        const conFoto = mascotas.filter(m => m.photo_url && m.active !== false).length;
        const conChip = mascotas.filter(m => m.chip && m.active !== false).length;
        const publicos = mascotas.filter(m => m.is_public && m.active !== false).length;
        const activos = mascotas.filter(m => m.active !== false).length;

        function PctBar({ value, total, color }: { value: number; total: number; color: string }) {
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#1C3557", fontWeight: 600 }}>{value} mascotas</span>
                <span style={{ fontSize: 13, fontWeight: 800, color }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>
            </div>
          );
        }

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {[
                { icon: "👤", label: "Usuarios totales", value: profiles.length, color: "#3B82F6" },
                { icon: "🐾", label: "Mascotas activas", value: activos, color: "#2CB8AD" },
                { icon: "🏥", label: "Entradas historial", value: totalHistorial, color: "#F97316" },
                { icon: "✨", label: "Usuarios Premium", value: premiumCount, color: "#EC4899" },
                { icon: "📍", label: "Alertas activas", value: perdidas.length, color: "#EF4444" },
                { icon: "💡", label: "Sugerencias", value: sugerencias.length, color: "#8B5CF6" },
              ].map(k => (
                <div key={k.label} style={{ background: "#FFFFFF", border: `1px solid ${k.color}25`, borderRadius: 16, padding: "16px 18px" }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{k.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: k.color, letterSpacing: "-0.5px" }}>{k.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, fontWeight: 600 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Gráficos de crecimiento */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1C3557", marginBottom: 16 }}>👤 Usuarios nuevos — últimos 6 meses</div>
                <BarChart data={usersByMonth} color="#3B82F6" />
              </div>
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "18px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#1C3557", marginBottom: 16 }}>🐾 Mascotas registradas — últimos 6 meses</div>
                <BarChart data={mascotasByMonth} color="#2CB8AD" />
              </div>
            </div>

            {/* Calidad de perfiles */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "20px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#1C3557", marginBottom: 18 }}>📋 Completitud de perfiles ({activos} mascotas activas)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>📷 Con foto de perfil</div>
                  <PctBar value={conFoto} total={activos} color="#2CB8AD" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>📡 Con microchip registrado</div>
                  <PctBar value={conChip} total={activos} color="#8B5CF6" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>🌐 Perfil público (QR activo)</div>
                  <PctBar value={publicos} total={activos} color="#3B82F6" />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, marginBottom: 6 }}>✨ Dueños Premium</div>
                  <PctBar value={premiumCount} total={profiles.length} color="#EC4899" />
                </div>
              </div>
            </div>

          </div>
        );
      })()}

      {/* Tab: Vet IA */}
      {adminTab === "ia" && (() => {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonth = iaUsageRecent.filter(r => r.created_at.startsWith(currentMonth));
        const premiumQueries = iaUsageRecent.filter(r => r.is_premium).length;
        const freeQueries = iaUsageRecent.filter(r => !r.is_premium).length;
        const totalTokensIn = iaUsageRecent.reduce((s, r) => s + (r.input_tokens || 0), 0);
        const totalTokensOut = iaUsageRecent.reduce((s, r) => s + (r.output_tokens || 0), 0);

        // Consultas por día (últimos 30 días)
        const byDay: Record<string, number> = {};
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          byDay[d.toISOString().slice(0, 10)] = 0;
        }
        for (const r of iaUsageRecent) {
          const day = r.created_at.slice(0, 10);
          if (byDay[day] !== undefined) byDay[day]++;
        }
        const dailyData = Object.entries(byDay).map(([date, count]) => ({
          label: new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "numeric" }),
          count,
        }));
        const maxDaily = Math.max(...dailyData.map(d => d.count), 1);

        // Top usuarios
        const userCounts: Record<string, { count: number; premium: boolean }> = {};
        for (const r of iaUsageRecent) {
          if (!r.user_id) continue;
          if (!userCounts[r.user_id]) userCounts[r.user_id] = { count: 0, premium: r.is_premium };
          userCounts[r.user_id].count++;
        }
        const topUsers = Object.entries(userCounts)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 10);
        const profileMap2 = Object.fromEntries(profiles.map(p => [p.id, p]));

        const dailyAvg = iaUsageRecent.length > 0 ? Math.round(iaUsageRecent.length / 30) : 0;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Summary cards */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { icon: "🤖", label: "Consultas totales", value: iaTotal, color: "#8B5CF6" },
                { icon: "📅", label: "Este mes", value: thisMonth.length, color: "#3B82F6" },
                { icon: "📈", label: "Promedio diario (30d)", value: dailyAvg, color: "#2CB8AD" },
                { icon: "✨", label: "Premium / Free", value: `${premiumQueries} / ${freeQueries}`, color: "#EC4899" },
                { icon: "🔢", label: "Tokens usados (30d)", value: (totalTokensIn + totalTokensOut).toLocaleString("es-AR"), color: "#F97316" },
              ].map(c => (
                <div key={c.label} style={{
                  background: "#fff", border: `1px solid ${c.color}33`, borderRadius: 16,
                  padding: "16px 20px", flex: 1, minWidth: 130,
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Gráfico diario */}
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: "20px 24px" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1C3557", marginBottom: 16 }}>
                🤖 Consultas diarias — últimos 30 días
              </div>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 100, overflowX: "auto" }}>
                {dailyData.map((d, i) => (
                  <div key={i} style={{ flex: "0 0 auto", width: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    {d.count > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: "#8B5CF6" }}>{d.count}</div>}
                    <div style={{
                      width: 14, borderRadius: "3px 3px 0 0",
                      height: `${Math.max((d.count / maxDaily) * 72, d.count > 0 ? 4 : 0)}px`,
                      background: d.count > 0 ? "#8B5CF6" : "#E2E8F0",
                      transition: "height 0.3s ease",
                    }} />
                    {i % 5 === 0 && <div style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", lineHeight: 1.25 }}>{d.label}</div>}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Free vs Premium */}
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: "20px 24px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1C3557", marginBottom: 16 }}>
                  ✨ Free vs Premium (30d)
                </div>
                {iaUsageRecent.length === 0 ? (
                  <div style={{ color: "#94A3B8", fontSize: 13 }}>Sin datos aún</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { label: "Free", value: freeQueries, color: "#64748B" },
                      { label: "Premium", value: premiumQueries, color: "#EC4899" },
                    ].map(item => {
                      const pct = iaUsageRecent.length > 0 ? Math.round((item.value / iaUsageRecent.length) * 100) : 0;
                      return (
                        <div key={item.label}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                            <span style={{ fontWeight: 700, color: "#1C3557" }}>{item.label}</span>
                            <span style={{ color: item.color, fontWeight: 800 }}>{item.value} ({pct}%)</span>
                          </div>
                          <div style={{ background: "#F4F6FB", borderRadius: 20, height: 8, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: item.color, borderRadius: 20, transition: "width 0.5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 4, fontSize: 12, color: "#64748B" }}>
                      Tokens totales: <strong style={{ color: "#1C3557" }}>{(totalTokensIn + totalTokensOut).toLocaleString("es-AR")}</strong>
                      <span style={{ marginLeft: 8, color: "#94A3B8" }}>({totalTokensIn.toLocaleString("es-AR")} in / {totalTokensOut.toLocaleString("es-AR")} out)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top usuarios */}
              <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: "20px 24px" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1C3557", marginBottom: 16 }}>
                  🏆 Top usuarios (30d)
                </div>
                {topUsers.length === 0 ? (
                  <div style={{ color: "#94A3B8", fontSize: 13 }}>Sin datos aún</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {topUsers.map(([uid, { count, premium }], i) => {
                      const prof = profileMap2[uid];
                      return (
                        <div key={uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#94A3B8", width: 18 }}>{i + 1}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#1C3557", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {prof?.full_name || uid.slice(0, 8) + "…"}
                            </div>
                          </div>
                          {premium && <UiBadge color="#EC4899" fontSize={9}>PRO</UiBadge>}
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#8B5CF6" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        );
      })()}

    </div>
  );
}
