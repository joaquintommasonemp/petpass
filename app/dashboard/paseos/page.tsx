"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils";
import { EmptyState, LoadingState, PetAvatar, SectionHeader, UiBadge, UiCard, UiMiniButton } from "@/components/ui";

function Card({ children, style = {}, className = "" }: any) {
  return <UiCard className={`care-card${className ? ` ${className}` : ""}`} style={style}>{children}</UiCard>;
}

function Badge({ children, color = "#2CB8AD" }: any) {
  return <UiBadge color={color}>{children}</UiBadge>;
}


export default function Paseos() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [updates, setUpdates] = useState<Record<string, any[]>>({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ mascota_id: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newSessionId, setNewSessionId] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: ms } = await supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true);
    setMascotas(ms || []);
    if (ms?.length) setForm(f => ({ ...f, mascota_id: ms[0].id }));

    const { data: sess } = await supabase.from("paseo_sessions")
      .select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (sess?.length) {
      setSessions(sess);
      const results = await Promise.all(
        sess.map((s: any) =>
          supabase.from("paseo_updates")
            .select("*").eq("session_id", s.id).order("created_at", { ascending: false })
            .then(({ data }) => [s.id, data || []] as [string, any[]])
        )
      );
      setUpdates(Object.fromEntries(results));
    }
    setLoading(false);
  }

  async function createSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form.mascota_id) return;
    const { data } = await supabase.from("paseo_sessions").insert({
      mascota_id: form.mascota_id,
      user_id: user.id,
      notes: form.notes,
      active: true,
    }).select();
    if (data?.[0]) {
      setSessions(prev => [data[0], ...prev]);
      setUpdates(prev => ({ ...prev, [data[0].id]: [] }));
      setNewSessionId(data[0].id);
    }
    setForm(f => ({ ...f, notes: "" }));
    setCreating(false);
  }

  async function closeSession(id: string) {
    await supabase.from("paseo_sessions").update({ active: false }).eq("id", id);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, active: false } : s));
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/paseo/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeSessions = sessions.filter(s => s.active);
  const pastSessions = sessions.filter(s => !s.active);

  if (loading) {
    return (
      <LoadingState
        icon="..."
        title="Cargando cuidadores"
        description="Estamos preparando las sesiones, los enlaces y las novedades."
      />
    );
  }

  return (
    <div className="care-page">
      <div className="care-hero" style={{ marginBottom: 20 }}>
        <SectionHeader
          title="🐕 Cuidadores"
          description="Compartí un link con el cuidador para que registre fotos y novedades durante el paseo o la estadia."
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Link recién creado */}
      {newSessionId && (
        <div className="care-success-card" style={{ background: "#E5F7F6", border: "1px solid #2CB8AD66", borderRadius: 16, padding: 16, marginBottom: 16, boxShadow: "0 2px 8px rgba(44,184,173,0.10)" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#2CB8AD", marginBottom: 8 }}>Sesión lista para compartir</div>
          <div style={{ fontSize: 12, color: "#1C3557", marginBottom: 10 }}>
            Copiá este link y enviáselo al cuidador para que pueda subir novedades.
          </div>
          <div style={{ background: "#F4F6FB", borderRadius: 10, padding: "10px 12px", marginBottom: 10, wordBreak: "break-all", fontSize: 12, color: "#64748B" }}>
            {typeof window !== "undefined" ? `${window.location.origin}/paseo/${newSessionId}` : `/paseo/${newSessionId}`}
          </div>
          <div className="care-action-row" style={{ display: "flex", gap: 8 }}>
            <UiMiniButton onClick={() => { copyLink(newSessionId); }} color="#2CB8AD" style={{
              flex: 1, background: copiedId === newSessionId ? "#2CB8AD33" : "#2CB8AD22",
              color: "#2CB8AD", border: "1px solid #2CB8AD44",
              borderRadius: 10, padding: 12, fontWeight: 800, fontSize: 14, cursor: "pointer",
            }}>
              {copiedId === newSessionId ? "Link copiado" : "Copiar link"}
            </UiMiniButton>
            <UiMiniButton onClick={() => setNewSessionId(null)} color="#64748B" style={{
              background: "#E2E8F0", color: "#64748B", border: "none",
              borderRadius: 10, padding: "12px 14px", cursor: "pointer", fontSize: 13,
            }}>Cerrar</UiMiniButton>
          </div>
        </div>
      )}

      <button className="care-primary-cta" onClick={() => setCreating(!creating)} style={{
        width: "100%", background: "linear-gradient(135deg, #2CB8AD, #229E94)",
        color: "#fff", border: "none", borderRadius: 12, padding: 14,
        fontWeight: 900, fontSize: 15, marginBottom: 16, cursor: "pointer",
        boxShadow: "0 4px 20px #2CB8AD30",
      }}>+ Nueva sesión de cuidado</button>

      {creating && (
        <Card className="care-form-card" style={{ border: "1px solid #2CB8AD44" }}>
          <div style={{ fontWeight: 700, color: "#2CB8AD", marginBottom: 12 }}>Nueva sesión</div>
          <div className="care-form" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select
              value={form.mascota_id}
              onChange={e => setForm(f => ({ ...f, mascota_id: e.target.value }))}
              style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557" }}
            >
              {mascotas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input
              placeholder="Notas para el cuidador (ej: darle agua cada 2 hs)"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
            <button onClick={createSession} style={{
              background: "#2CB8AD", color: "#fff", border: "none",
              borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
            }}>Crear y compartir link</button>
          </div>
        </Card>
      )}

      {activeSessions.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#2CB8AD", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
            Sesiones activas
          </div>
          {activeSessions.map(s => {
            const mascota = mascotas.find(m => m.id === s.mascota_id);
            const sessUpdates = updates[s.id] || [];
            const lastUpdate = sessUpdates[0];
            return (
              <Card className="care-session-card care-session-active" key={s.id} style={{ border: "1px solid #2CB8AD33" }}>
                <div className="care-session-head" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <PetAvatar src={mascota?.photo_url} breed={mascota?.breed} size={48} style={{ border: "2px solid #2CB8AD44" }} fallbackFontSize={24} />
                  <div className="care-session-title" style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{mascota?.name || "Mascota"}</div>
                    <div style={{ color: "#64748B", fontSize: 12 }}>
                      {new Date(s.created_at).toLocaleDateString("es-AR")} · {sessUpdates.length} actualizaciones
                    </div>
                  </div>
                  <Badge color="#2CB8AD">Activa</Badge>
                </div>

                {s.notes && (
                  <div className="care-note" style={{ background: "#F4F6FB", borderRadius: 10, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#64748B" }}>
                    📋 {s.notes}
                  </div>
                )}

                {/* Última actualización */}
                {lastUpdate && (
                  <div className="care-update-featured" style={{ background: "#E5F7F6", borderRadius: 10, padding: "10px 12px", marginBottom: 10, border: "1px solid #2CB8AD22" }}>
                    <div style={{ fontSize: 11, color: "#2CB8AD", fontWeight: 700, marginBottom: 4 }}>
                      Última actualización · {timeAgo(lastUpdate.created_at)}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>{lastUpdate.message}</div>
                    {lastUpdate.author_name && (
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>por {lastUpdate.author_name}</div>
                    )}
                    {lastUpdate.photo_url && (
                      <img src={lastUpdate.photo_url} style={{ width: "100%", borderRadius: 8, marginTop: 8, maxHeight: 200, objectFit: "cover" }} />
                    )}
                  </div>
                )}

                {/* Todas las actualizaciones */}
                {sessUpdates.length > 1 && (
                  <div className="care-update-list" style={{ marginBottom: 10 }}>
                    {sessUpdates.slice(1).map((u: any) => (
                      <div className="care-update-row" key={u.id || u.created_at} style={{ padding: "8px 0", borderTop: "1px solid #E2E8F0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{u.author_name || "Cuidador"}</span>
                          <span style={{ fontSize: 11, color: "#64748B" }}>{timeAgo(u.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{u.message}</div>
                        {u.photo_url && (
                          <img src={u.photo_url} style={{ width: "100%", borderRadius: 8, marginTop: 6, maxHeight: 160, objectFit: "cover" }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="care-action-row" style={{ display: "flex", gap: 8 }}>
                  <UiMiniButton onClick={() => copyLink(s.id)} color="#2CB8AD" style={{
                    flex: 1, background: copiedId === s.id ? "#2CB8AD22" : "#E2E8F0",
                    color: copiedId === s.id ? "#2CB8AD" : "#1C3557",
                    border: `1px solid ${copiedId === s.id ? "#2CB8AD44" : "#E2E8F0"}`,
                    borderRadius: 10, padding: "10px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}>
                    {copiedId === s.id ? "✅ Link copiado" : "🔗 Copiar link del cuidador"}
                  </UiMiniButton>
                  {confirmClose === s.id ? (
                    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "#EF4444" }}>¿Cerrar sesión?</span>
                      <button onClick={() => { closeSession(s.id); setConfirmClose(null); }} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                      <button onClick={() => setConfirmClose(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>No</button>
                    </span>
                  ) : (
                    <UiMiniButton onClick={() => setConfirmClose(s.id)} color="#EF4444" style={{
                      background: "#f8717122", color: "#f87171", border: "1px solid #f8717144",
                      borderRadius: 10, padding: "10px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>Cerrar</UiMiniButton>
                  )}
                </div>
              </Card>
            );
          })}
        </>
      )}

      {activeSessions.length === 0 && !creating && (
        <Card className="care-empty-state" style={{ textAlign: "center" }}>
          <EmptyState
            icon="🐕"
            title="Todavía no tenés sesiones activas"
            description={<>Creá una sesión cuando quieras compartir novedades con un paseador o cuidador.<br />La otra persona recibe un link simple para mandarte fotos y mensajes.</>}
            action={
              <button
                onClick={() => setCreating(true)}
                style={{
                  background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 18px",
                  fontWeight: 800,
                  fontSize: 13,
                  boxShadow: "0 4px 18px rgba(44,184,173,0.24)",
                }}
              >
                Crear primera sesión
              </button>
            }
            style={{ padding: 0, border: "none", boxShadow: "none" }}
          />
        </Card>
      )}

      {pastSessions.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, marginTop: 8 }}>
            Sesiones anteriores
          </div>
          {pastSessions.slice(0, 5).map(s => {
            const mascota = mascotas.find(m => m.id === s.mascota_id);
            const count = (updates[s.id] || []).length;
            return (
              <Card className="care-session-card care-session-past" key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{mascota?.name || "Mascota"}</div>
                  <div style={{ color: "#64748B", fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString("es-AR")} · {count} novedades</div>
                </div>
                <Badge color="#64748B">Finalizada</Badge>
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
}
