"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

function StatCard({ icon, label, value, color = "#2CB8AD" }: { icon: string; label: string; value: number | string; color?: string }) {
  return (
    <div style={{
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
  return (
    <span style={{
      background: color + "22", color, borderRadius: 20, padding: "2px 10px",
      fontSize: 10, fontWeight: 700, border: `1px solid ${color}44`,
    }}>{children}</span>
  );
}

export default function AdminPage() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [perdidas, setPerdidas] = useState<any[]>([]);
  const [historialCount, setHistorialCount] = useState<Record<string, number>>({});
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<"todos" | "activos" | "inactivos">("activos");
  const [adminTab, setAdminTab] = useState<"mascotas" | "solicitudes" | "sugerencias">("mascotas");
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
    <div style={{ textAlign: "center", padding: 60, color: "#64748B" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
      Cargando panel admin...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
      <h2 style={{ marginBottom: 8 }}>Acceso denegado</h2>
      <p style={{ color: "#64748B", fontSize: 14 }}>{error}</p>
    </div>
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
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, mascota_name: accion === "aprobar" ? "aprobado" : "rechazado" } : s));
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
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Panel de administración</h1>
        <p style={{ color: "#64748B", fontSize: 13 }}>Base de datos completa de mascotas y usuarios</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard icon="🐾" label="Mascotas activas" value={mascotasActivas} color="#2CB8AD" />
        <StatCard icon="🕊️" label="Dados de baja" value={mascotasInactivas} color="#64748B" />
        <StatCard icon="👤" label="Usuarios" value={profiles.length} color="#3B82F6" />
        <StatCard icon="📍" label="Perdidas activas" value={perdidas.length} color="#EF4444" />
        <StatCard icon="📋" label="Solicitudes pend." value={solicitudesPendientes.length} color="#F97316" />
        <StatCard icon="💡" label="Sugerencias" value={sugerencias.length} color="#8B5CF6" />
      </div>

      {/* Admin tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#F4F6FB", borderRadius: 12, padding: 4 }}>
        {([["mascotas", "🐾 Mascotas"], ["solicitudes", "📋 Solicitudes"], ["sugerencias", "💡 Sugerencias"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setAdminTab(key)} style={{
            flex: 1, border: "none", borderRadius: 10, padding: "10px 4px",
            background: adminTab === key ? "#E2E8F0" : "transparent",
            color: adminTab === key ? "#1C3557" : "#64748B",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>
            {label}
            {key === "solicitudes" && solicitudesPendientes.length > 0 && (
              <span style={{ marginLeft: 4, background: "#F97316", color: "#fff", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{solicitudesPendientes.length}</span>
            )}
            {key === "sugerencias" && sugerencias.length > 0 && (
              <span style={{ marginLeft: 4, background: "#8B5CF6", color: "#fff", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{sugerencias.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab: Solicitudes */}
      {adminTab === "solicitudes" && (
        <div>
          {solicitudes.length === 0 && (
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 40, textAlign: "center", color: "#64748B", fontSize: 13 }}>
              No hay solicitudes todavia.
            </div>
          )}
          {solicitudes.map((s: any) => {
            const tipo = s.author_name === "SOLICITUD:profesional" ? "profesional" : "descuento";
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
                      <span style={{ fontWeight: 800, fontSize: 15 }}>
                        {tipo === "profesional" ? "🏥" : "🏪"} {datos.nombre || "Sin nombre"}
                      </span>
                      <Badge color={tipo === "profesional" ? "#3B82F6" : "#EC4899"}>
                        {tipo === "profesional" ? "Profesional" : "Descuento"}
                      </Badge>
                    </div>
                    {tipo === "profesional" && datos.especialidad && (
                      <div style={{ fontSize: 12, color: "#64748B" }}>{datos.especialidad}{datos.zona ? " · " + datos.zona : ""}</div>
                    )}
                    {tipo === "descuento" && datos.rubro && (
                      <div style={{ fontSize: 12, color: "#64748B" }}>{datos.rubro}</div>
                    )}
                    {datos.descripcion && <div style={{ fontSize: 12, color: "#1C3557", marginTop: 4 }}>{datos.descripcion}</div>}
                    {datos.descuento && <div style={{ fontSize: 12, color: "#1C3557", marginTop: 4 }}>{datos.descuento}</div>}
                    {datos.email && <div style={{ fontSize: 11, color: "#8B5CF6", marginTop: 4 }}>✉ {datos.email}</div>}
                    {datos.telefono && <div style={{ fontSize: 11, color: "#2CB8AD", marginTop: 2 }}>📞 {datos.telefono}</div>}
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
                    <button
                      onClick={() => accionSolicitud(s.id, "aprobar", tipo)}
                      disabled={procesandoId === s.id}
                      style={{
                        flex: 1, background: "#E5F7F6", color: "#2CB8AD",
                        border: "1px solid #B2E8E5", borderRadius: 10, padding: "8px 0",
                        fontWeight: 800, fontSize: 13, cursor: "pointer",
                        opacity: procesandoId === s.id ? 0.5 : 1,
                      }}
                    >{procesandoId === s.id ? "..." : "Aprobar"}</button>
                    <button
                      onClick={() => accionSolicitud(s.id, "rechazar", tipo)}
                      disabled={procesandoId === s.id}
                      style={{
                        flex: 1, background: "#FFF0F0", color: "#EF4444",
                        border: "1px solid #FECACA", borderRadius: 10, padding: "8px 0",
                        fontWeight: 800, fontSize: 13, cursor: "pointer",
                        opacity: procesandoId === s.id ? 0.5 : 1,
                      }}
                    >{procesandoId === s.id ? "..." : "Rechazar"}</button>
                  </div>
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
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
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
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
            <div key={m.id} style={{
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
    </div>
  );
}
