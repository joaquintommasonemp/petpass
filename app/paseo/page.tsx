"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import { EmptyState, LoadingState, PetAvatar, UiBadge, UiMiniButton } from "@/components/ui";

export default function PanelCuidador() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    if (typeof window === "undefined") return;
    const ids: string[] = JSON.parse(localStorage.getItem("petpass_sesiones_cuidador") || "[]");
    if (!ids.length) { setLoading(false); return; }

    const settled = await Promise.all(ids.map(async (id: string) => {
      const [{ data: sess }, { data: updates }] = await Promise.all([
        supabase.from("paseo_sessions").select("*").eq("id", id).single(),
        supabase.from("paseo_updates").select("*").eq("session_id", id).order("created_at", { ascending: false }).limit(1),
      ]);
      if (!sess) return null;
      const { data: mascota } = await supabase.from("mascotas").select("name, photo_url, breed").eq("id", sess.mascota_id).single();
      return { ...sess, mascota, lastUpdate: updates?.[0] || null };
    }));
    setSessions(settled.filter(Boolean));
    setLoading(false);
  }

  function clearHistory() {
    localStorage.removeItem("petpass_sesiones_cuidador");
    setSessions([]);
  }

  const active = sessions.filter(s => s.active);
  const inactive = sessions.filter(s => !s.active);

  return (
    <main className="caregiver-panel-page" style={{ maxWidth: 440, margin: "0 auto", background: "#F4F6FB", minHeight: "100vh" }}>
      <div className="caregiver-panel-hero" style={{
        background: "linear-gradient(160deg, #E5F7F6 0%, #F4F6FB 70%)",
        padding: "24px 20px 20px", borderBottom: "1px solid #E2E8F0",
      }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", marginBottom: 16 }}>
          <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 44, width: "auto", objectFit: "contain" }} />
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>Panel del cuidador</h1>
        <p style={{ color: "#64748B", fontSize: 13, marginTop: 4 }}>Todas las sesiones activas que ten&eacute;s asignadas</p>
      </div>

      <div className="caregiver-panel-content" style={{ padding: "20px 20px 60px" }}>
        {loading && (
          <LoadingState
            title="Cargando sesiones"
            description="Estamos preparando tus sesiones activas y recientes."
            style={{ padding: "36px 18px" }}
          />
        )}

        {!loading && sessions.length === 0 && (
          <EmptyState
            icon={<span aria-hidden="true">&#128062;</span>}
            title="Sin sesiones registradas"
            description={<>Cuando el due&ntilde;o te comparta un link de paseo,<br />va a aparecer ac&aacute; autom&aacute;ticamente.</>}
            style={{ padding: "40px 0" }}
          />
        )}

        {active.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#2CB8AD", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Sesiones activas ({active.length})
            </div>
            {active.map(s => (
              <Link key={s.id} href={`/paseo/${s.id}`} style={{ textDecoration: "none" }}>
                <div className="caregiver-panel-card" style={{ background: "#FFFFFF", border: "1px solid #2CB8AD33", borderRadius: 16, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: s.lastUpdate ? 10 : 0 }}>
                    <PetAvatar src={s.mascota?.photo_url} breed={s.mascota?.breed} size={52} style={{ border: "2px solid #2CB8AD44" }} fallbackFontSize={26} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "#1C3557" }}>{s.mascota?.name || "Mascota"}</div>
                      <div style={{ color: "#64748B", fontSize: 12 }}>{s.mascota?.breed}</div>
                    </div>
                    <UiBadge color="#2CB8AD">Activa</UiBadge>
                  </div>
                  {s.notes && (
                    <div style={{ background: "#F4F6FB", borderRadius: 10, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#64748B" }}>
                      Nota: {s.notes}
                    </div>
                  )}
                  {s.lastUpdate && (
                    <div style={{ background: "#E5F7F6", borderRadius: 10, padding: "8px 12px", border: "1px solid #2CB8AD22" }}>
                      <div style={{ fontSize: 11, color: "#2CB8AD", fontWeight: 700, marginBottom: 2 }}>&Uacute;ltima novedad &middot; {timeAgo(s.lastUpdate.created_at)}</div>
                      <div style={{ fontSize: 12, color: "#1C3557" }}>{s.lastUpdate.message}</div>
                    </div>
                  )}
                  <div style={{ marginTop: 10, fontSize: 12, color: "#2CB8AD", fontWeight: 700 }}>Envi&aacute; una novedad &rarr;</div>
                </div>
              </Link>
            ))}
          </>
        )}

        {inactive.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, marginTop: 16 }}>
              Sesiones finalizadas
            </div>
            {inactive.map(s => (
              <div className="caregiver-panel-card caregiver-panel-card-inactive" key={s.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: "12px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1C3557" }}>{s.mascota?.name || "Mascota"}</div>
                  <div style={{ color: "#64748B", fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString("es-AR")}</div>
                </div>
                <UiBadge color="#64748B">Finalizada</UiBadge>
              </div>
            ))}
          </>
        )}

        {sessions.length > 0 && (
          <UiMiniButton onClick={clearHistory} color="#64748B" tone="ghost" style={{
            width: "100%", minHeight: 40, marginTop: 16,
          }}>
            Limpiar historial de sesiones
          </UiMiniButton>
        )}
      </div>
    </main>
  );
}
