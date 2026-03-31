"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

function StatCard({ icon, label, value, color = "#4ade80" }: { icon: string; label: string; value: number | string; color?: string }) {
  return (
    <div style={{
      background: "#181c27", border: `1px solid ${color}33`, borderRadius: 16,
      padding: "16px 20px", flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#7a8299", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Badge({ children, color = "#4ade80" }: { children: React.ReactNode; color?: string }) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filtroActivo, setFiltroActivo] = useState<"todos" | "activos" | "inactivos">("activos");
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
    <div style={{ textAlign: "center", padding: 60, color: "#7a8299" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
      Cargando panel admin...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
      <h2 style={{ marginBottom: 8 }}>Acceso denegado</h2>
      <p style={{ color: "#7a8299", fontSize: 14 }}>{error}</p>
    </div>
  );

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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Panel de administración</h1>
        <p style={{ color: "#7a8299", fontSize: 13 }}>Base de datos completa de mascotas y usuarios</p>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard icon="🐾" label="Mascotas activas" value={mascotasActivas} color="#4ade80" />
        <StatCard icon="🕊️" label="Dados de baja" value={mascotasInactivas} color="#7a8299" />
        <StatCard icon="👤" label="Usuarios" value={profiles.length} color="#60a5fa" />
        <StatCard icon="📍" label="Perdidas activas" value={perdidas.length} color="#f87171" />
      </div>

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
              background: filtroActivo === f ? "#4ade8022" : "#181c27",
              color: filtroActivo === f ? "#4ade80" : "#7a8299",
              border: `1px solid ${filtroActivo === f ? "#4ade8044" : "#252a3a"}`,
              borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* Conteo */}
      <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 14 }}>
        {mascotasFiltradas.length} resultado{mascotasFiltradas.length !== 1 ? "s" : ""}
      </div>

      {/* Tabla / Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mascotasFiltradas.length === 0 && (
          <div style={{
            background: "#181c27", border: "1px solid #252a3a", borderRadius: 16,
            padding: 40, textAlign: "center", color: "#7a8299", fontSize: 13,
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
              background: "#181c27",
              border: `1px solid ${m.active === false ? "#252a3a" : "#252a3a"}`,
              borderRadius: 16, padding: "14px 18px",
              display: "flex", gap: 16, alignItems: "center",
              opacity: m.active === false ? 0.6 : 1,
            }}>
              {/* Foto o emoji */}
              <div style={{
                width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                background: "#252a3a", border: "2px solid #353a4a",
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
                    ? <Badge color="#7a8299">Dado de baja</Badge>
                    : <Badge color="#4ade80">Activo</Badge>
                  }
                  {perdidas.some(p => p.user_id === m.user_id) && (
                    <Badge color="#f87171">Perdida reportada</Badge>
                  )}
                </div>
                <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 4 }}>
                  {m.breed} · {m.age} · {m.sex}
                  {m.location && ` · ${m.location}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#60a5fa" }}>
                    👤 {owner?.full_name || "Sin nombre"}
                  </span>
                  {owner?.phone && (
                    <span style={{ fontSize: 11, color: "#7a8299" }}>· {owner.phone}</span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div style={{ textAlign: "right", flexShrink: 0, fontSize: 11, color: "#7a8299" }}>
                {historialCount[m.id] > 0 && (
                  <div style={{ marginBottom: 4 }}>
                    <Badge color="#fb923c">{historialCount[m.id]} consultas</Badge>
                  </div>
                )}
                {m.chip && (
                  <div style={{ marginBottom: 4 }}>
                    <Badge color="#a78bfa">Chip</Badge>
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
  );
}
