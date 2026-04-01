"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora mismo";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

export default function PanelCuidador() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    if (typeof window === "undefined") return;
    const ids: string[] = JSON.parse(localStorage.getItem("petpass_sesiones_cuidador") || "[]");
    if (!ids.length) { setLoading(false); return; }

    const results: any[] = [];
    for (const id of ids) {
      const { data: sess } = await supabase.from("paseo_sessions").select("*").eq("id", id).single();
      if (!sess) continue;
      const { data: mascota } = await supabase.from("mascotas").select("name, photo_url, breed").eq("id", sess.mascota_id).single();
      const { data: updates } = await supabase.from("paseo_updates").select("*").eq("session_id", id).order("created_at", { ascending: false }).limit(1);
      results.push({ ...sess, mascota, lastUpdate: updates?.[0] || null });
    }
    setSessions(results);
    setLoading(false);
  }

  function clearHistory() {
    localStorage.removeItem("petpass_sesiones_cuidador");
    setSessions([]);
  }

  const active = sessions.filter(s => s.active);
  const inactive = sessions.filter(s => !s.active);

  return (
    <main style={{ maxWidth: 440, margin: "0 auto", background: "#0f1117", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #0f2a1a 0%, #0f1117 70%)",
        padding: "24px 20px 20px", borderBottom: "1px solid #252a3a",
      }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", marginBottom: 16 }}>
          <span style={{ fontSize: 16 }}>🐾</span>
          <span style={{
            fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 14,
            background: "linear-gradient(135deg, #f0f4ff, #4ade80)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>PetPass</span>
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Panel del cuidador</h1>
        <p style={{ color: "#7a8299", fontSize: 13, marginTop: 4 }}>Todas las sesiones activas que tenés asignadas</p>
      </div>

      <div style={{ padding: "20px 20px 60px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#7a8299" }}>Cargando...</div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐕</div>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Sin sesiones registradas</div>
            <p style={{ color: "#7a8299", fontSize: 13, lineHeight: 1.6 }}>
              Cuando el dueño te comparta un link de paseo,<br />va a aparecer acá automáticamente.
            </p>
          </div>
        )}

        {active.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Sesiones activas ({active.length})
            </div>
            {active.map(s => (
              <Link key={s.id} href={`/paseo/${s.id}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#181c27", border: "1px solid #4ade8033", borderRadius: 16, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: s.lastUpdate ? 10 : 0 }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                      background: "#252a3a", border: "2px solid #4ade8044",
                      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                    }}>
                      {s.mascota?.photo_url
                        ? <img src={s.mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 26 }}>{s.mascota?.breed?.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#f0f4ff" }}>{s.mascota?.name || "Mascota"}</div>
                      <div style={{ color: "#7a8299", fontSize: 12 }}>{s.mascota?.breed}</div>
                    </div>
                    <span style={{ background: "#4ade8022", color: "#4ade80", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: "1px solid #4ade8044" }}>Activa</span>
                  </div>
                  {s.notes && (
                    <div style={{ background: "#0f1117", borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#7a8299" }}>
                      📋 {s.notes}
                    </div>
                  )}
                  {s.lastUpdate && (
                    <div style={{ background: "#0f2a1a", borderRadius: 10, padding: "8px 12px", border: "1px solid #4ade8022" }}>
                      <div style={{ fontSize: 11, color: "#4ade80", fontWeight: 700, marginBottom: 2 }}>Última novedad · {timeAgo(s.lastUpdate.created_at)}</div>
                      <div style={{ fontSize: 12, color: "#f0f4ff" }}>{s.lastUpdate.message}</div>
                    </div>
                  )}
                  <div style={{ marginTop: 10, fontSize: 12, color: "#4ade80", fontWeight: 700 }}>Enviá una novedad →</div>
                </div>
              </Link>
            ))}
          </>
        )}

        {inactive.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, marginTop: 16 }}>
              Sesiones finalizadas
            </div>
            {inactive.map(s => (
              <div key={s.id} style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f4ff" }}>{s.mascota?.name || "Mascota"}</div>
                  <div style={{ color: "#7a8299", fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString("es-AR")}</div>
                </div>
                <span style={{ background: "#25282c", color: "#7a8299", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>Finalizada</span>
              </div>
            ))}
          </>
        )}

        {sessions.length > 0 && (
          <button onClick={clearHistory} style={{
            width: "100%", background: "transparent", border: "1px solid #252a3a",
            borderRadius: 10, padding: 10, color: "#7a8299", fontSize: 12, marginTop: 16, cursor: "pointer",
          }}>Limpiar historial de sesiones</button>
        )}
      </div>
    </main>
  );
}
