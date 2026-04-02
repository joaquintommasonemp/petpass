"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Badge({ children, color = "#0CCE6B" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      background: color + "22", color, borderRadius: 20, padding: "2px 10px",
      fontSize: 11, fontWeight: 700, border: `1px solid ${color}44`,
    }}>{children}</span>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: any }) {
  return (
    <div style={{
      background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16,
      padding: 16, marginBottom: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)", ...style,
    }}>{children}</div>
  );
}

export default function Dashboard() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showBaja, setShowBaja] = useState(false);
  const [showPeso, setShowPeso] = useState(false);
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [showAgendarCita, setShowAgendarCita] = useState(false);
  const [citaForm, setCitaForm] = useState({ date: "", summary: "", vet: "" });
  const [urgencias, setUrgencias] = useState<any[]>([]);
  const [showAddUrgencia, setShowAddUrgencia] = useState(false);
  const [urgenciaForm, setUrgenciaForm] = useState({ name: "", phone: "", specialty: "", notes: "" });
  const [reporte, setReporte] = useState<string | null>(null);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [familiaMembers, setFamiliaMembers] = useState<any[]>([]);
  const [showInvitar, setShowInvitar] = useState(false);
  const [copiedFamilia, setCopiedFamilia] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push("/login"); return; }
    setAuthToken(session.access_token);
    const user = session.user;
    const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (prof?.is_admin) setIsAdmin(true);
    const { data } = await supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true);
    // Mascotas compartidas con este usuario por familia
    const { data: familiaRows } = await supabase.from("mascota_familia").select("mascota_id").eq("user_id", user.id);
    const familiaIds = (familiaRows || []).map((r: any) => r.mascota_id);
    let shared: any[] = [];
    if (familiaIds.length > 0) {
      const { data: sharedMs } = await supabase.from("mascotas").select("*").in("id", familiaIds).eq("active", true);
      shared = sharedMs || [];
    }
    const allMascotas = [...(data || []), ...shared];
    if (allMascotas.length > 0) {
      setMascotas(allMascotas);
      await selectMascota(allMascotas[0]);
    }
    const { data: urgs } = await supabase.from("urgencias_contactos").select("*").eq("user_id", user.id).order("created_at");
    setUrgencias(urgs || []);
    setLoading(false);
  }

  async function loadFamilia(mascotaId: string) {
    const { data } = await supabase.from("mascota_familia").select("user_id, profiles(full_name)").eq("mascota_id", mascotaId);
    setFamiliaMembers(data || []);
  }

  function copyFamiliaLink(mascotaId: string) {
    const url = `${window.location.origin}/acceso/${mascotaId}`;
    navigator.clipboard.writeText(url);
    setCopiedFamilia(true);
    setTimeout(() => setCopiedFamilia(false), 2500);
  }

  async function togglePublic() {
    if (!selected) return;
    const newVal = !isPublic;
    setIsPublic(newVal);
    await supabase.from("mascotas").update({ is_public: newVal }).eq("id", selected.id);
    setSelected((prev: any) => ({ ...prev, is_public: newVal }));
  }

  async function selectMascota(m: any) {
    setSelected(m);
    setIsPublic(m.is_public || false);
    setFamiliaMembers([]);
    loadFamilia(m.id);
    const { data: vacs } = await supabase.from("vacunas").select("*").eq("mascota_id", m.id);
    setVacunas(vacs || []);
    const EXCLUDED_TITLES = ["Actualización de peso", "Peso inicial", "📄 Documento", "📅 Cita"];
    const { data: allHist } = await supabase.from("historial").select("*")
      .eq("mascota_id", m.id)
      .order("created_at", { ascending: false }).limit(30);
    setDiagnosticos((allHist || []).filter((h: any) => !EXCLUDED_TITLES.includes(h.title)).slice(0, 5));
    const { data: cits } = await supabase.from("historial").select("*")
      .eq("mascota_id", m.id).eq("title", "📅 Cita")
      .order("date", { ascending: true });
    setCitas(cits || []);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploadingPhoto(true);
    const ext = file.name.split(".").pop();
    const path = `${selected.id}/perfil.${ext}`;
    await supabase.storage.from("mascotas").upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from("mascotas").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("mascotas").update({ photo_url: url }).eq("id", selected.id);
    setSelected((prev: any) => ({ ...prev, photo_url: url }));
    setMascotas(prev => prev.map(m => m.id === selected.id ? { ...m, photo_url: url } : m));
    setUploadingPhoto(false);
  }

  async function handleBaja() {
    if (!selected) return;
    await supabase.from("mascotas").update({ active: false }).eq("id", selected.id);
    const restantes = mascotas.filter(m => m.id !== selected.id);
    setMascotas(restantes);
    setSelected(restantes[0] || null);
    setShowBaja(false);
  }

  async function handleAgregarPeso() {
    if (!nuevoPeso || !selected) return;
    const entry = {
      mascota_id: selected.id,
      title: "Actualización de peso",
      summary: `${nuevoPeso} kg`,
      date: new Date().toLocaleDateString("es-AR"),
      vet: "Actualización manual",
    };
    await supabase.from("historial").insert(entry);
    await supabase.from("mascotas").update({ weight: `${nuevoPeso} kg` }).eq("id", selected.id);
    setSelected((prev: any) => ({ ...prev, weight: `${nuevoPeso} kg` }));
    setNuevoPeso("");
    setShowPeso(false);
  }

  async function handleAgendarCita() {
    if (!citaForm.date || !citaForm.summary || !selected) return;
    const entry = {
      mascota_id: selected.id,
      title: "📅 Cita",
      summary: citaForm.summary,
      date: citaForm.date,
      vet: citaForm.vet || null,
    };
    const { data } = await supabase.from("historial").insert(entry).select();
    if (data?.[0]) {
      setCitas(prev => [...prev, data[0]].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setCitaForm({ date: "", summary: "", vet: "" });
    setShowAgendarCita(false);
  }

  async function eliminarCita(id: string) {
    await supabase.from("historial").delete().eq("id", id);
    setCitas(prev => prev.filter(c => c.id !== id));
  }

  async function handleAddUrgencia() {
    if (!urgenciaForm.name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("urgencias_contactos").insert({ ...urgenciaForm, user_id: user.id }).select();
    if (data?.[0]) setUrgencias(prev => [...prev, data[0]]);
    setUrgenciaForm({ name: "", phone: "", specialty: "", notes: "" });
    setShowAddUrgencia(false);
  }

  async function eliminarUrgencia(id: string) {
    await supabase.from("urgencias_contactos").delete().eq("id", id);
    setUrgencias(prev => prev.filter(u => u.id !== id));
  }

  async function generarReporte() {
    if (!selected || !authToken) return;
    setLoadingReporte(true);
    setReporte(null);
    const vacs = vacunas.map(v => {
      const next = v.next_date ? " -> proxima: " + v.next_date : "";
      return v.name + " (" + v.date + next + ")";
    }).join(", ") || "Sin registros";
    const diags = diagnosticos.map(d => {
      const sum = d.summary ? " - " + d.summary : "";
      return d.date + ": " + d.title + sum;
    }).join("\n") || "Sin consultas";
    const citasProx = citas.filter(c => c.date >= new Date().toISOString().slice(0, 10)).map(c => c.date + ": " + c.summary).join(", ") || "Sin citas";
    const promptLines = [
      "Genera un reporte de salud completo y estructurado para " + selected.name + ".",
      "",
      "DATOS: Raza: " + (selected.breed || "N/A") + " | Edad: " + (selected.age || "N/A") + " | Peso: " + (selected.weight || "N/A") + " | Sexo: " + (selected.sex || "N/A"),
      "VACUNAS: " + vacs,
      "HISTORIAL RECIENTE:",
      diags,
      "CITAS PROXIMAS: " + citasProx,
      "",
      "El reporte debe tener estas secciones:",
      "1. **Resumen general** (estado de salud en 2-3 frases)",
      "2. **Vacunacion** (estado y recomendaciones)",
      "3. **Historial clinico reciente** (analisis breve)",
      "4. **Alertas o puntos de atencion** (si hay algo que revisar)",
      "5. **Recomendaciones para los proximos 30 dias**",
      "",
      "Se concreto y profesional. Responde en espanol.",
    ];
    const prompt = promptLines.join("\n");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        system: "Sos un veterinario experto redactando reportes de salud animal. Usá markdown con **negritas** para los títulos de sección.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    setReporte(data.reply || "No se pudo generar el reporte.");
    setLoadingReporte(false);
  }

  function addToGoogleCalendar(c: any) {
    const dateStr = c.date.replace(/-/g, "");
    const title = encodeURIComponent(`[${selected?.name}] ${c.summary}`);
    const details = encodeURIComponent(c.vet ? `Veterinario/a: ${c.vet}` : "Cita veterinaria");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`, "_blank");
  }

  function downloadIcal(c: any) {
    const dateStr = c.date.replace(/-/g, "");
    const uid = c.id + "@petpass";
    const now = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";
    const ical = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PetPass//ES",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:[${selected?.name}] ${c.summary}`,
      c.vet ? `DESCRIPTION:Veterinario/a: ${c.vet}` : "",
      "END:VEVENT", "END:VCALENDAR",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([ical], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `cita_${selected?.name}_${c.date}.ics`;
    a.click();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>Cargando...</div>;

  if (mascotas.length === 0) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 64 }}>🐾</div>
      <h2 style={{ marginTop: 16, marginBottom: 8 }}>Registrá tu primera mascota</h2>
      <p style={{ color: "#64748B", marginBottom: 24 }}>Todavía no tenés ninguna mascota en PetPass.</p>
      <Link href="/mascota/nueva" style={{
        background: "linear-gradient(135deg, #0CCE6B, #09A855)", color: "#fff", borderRadius: 12, padding: "12px 24px",
        fontWeight: 800, textDecoration: "none", fontSize: 14,
      }}>+ Agregar mascota</Link>
    </div>
  );

  return (
    <div>
      {/* Selector de mascotas */}
      {mascotas.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {mascotas.map(m => (
            <button key={m.id} onClick={() => selectMascota(m)} style={{
              background: selected?.id === m.id ? "#E8FFF2" : "#FFFFFF",
              border: `1px solid ${selected?.id === m.id ? "#0CCE6B" : "#E2E8F0"}`,
              borderRadius: 20, padding: "6px 14px",
              color: selected?.id === m.id ? "#0CCE6B" : "#64748B",
              fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {m.photo_url
                ? <img src={m.photo_url} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                : <span>{m.breed?.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
              }
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div className="db-layout">
      <div className="db-col-left">

      {/* Perfil principal */}
      <Card style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* Foto con upload */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 80, height: 80, borderRadius: "50%", cursor: "pointer",
              background: "#F4F6FB", border: "2px solid #C6F6E0",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", position: "relative",
            }}
          >
            {uploadingPhoto ? (
              <span style={{ color: "#64748B", fontSize: 11 }}>Subiendo...</span>
            ) : selected?.photo_url ? (
              <img src={selected.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 40 }}>{selected?.breed?.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
            )}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#00000088", textAlign: "center", fontSize: 9,
              color: "#fff", padding: "2px 0", fontWeight: 700,
            }}>📷 Foto</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Georgia, serif" }}>{selected?.name}</div>
          <div style={{ color: "#64748B", fontSize: 13, marginBottom: 8 }}>
            {selected?.breed} · {selected?.age} · {selected?.sex}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {selected?.chip && (
              <a href={`/mascota/${selected.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <Badge color="#0CCE6B">🔗 Chip: ...{selected.chip.slice(-6)}</Badge>
              </a>
            )}
            {selected?.location && <Badge color="#3B82F6">{selected.location}</Badge>}
            {selected?.weight && <Badge color="#F97316">{selected.weight}</Badge>}
            {selected?.castrado && selected.castrado !== "No sé" && (
              <Badge color={selected.castrado === "Sí" ? "#8B5CF6" : "#64748B"}>
                {selected.castrado === "Sí" ? "✂️ Castrado/a" : "⚪ No castrado/a"}
              </Badge>
            )}
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a href={`/mascota/${selected?.id}`} target="_blank" rel="noreferrer" style={{
              fontSize: 11, color: "#0CCE6B", textDecoration: "none", fontWeight: 700,
              background: "#E8FFF2", border: "1px solid rgba(12,206,107,0.2)", borderRadius: 8,
              padding: "4px 10px", display: "inline-block",
            }}>🌐 Ver perfil</a>
            {/* Toggle público/privado */}
            <button onClick={togglePublic} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: isPublic ? "#E8FFF2" : "#E2E8F0",
              border: `1px solid ${isPublic ? "#C6F6E0" : "#CBD5E1"}`,
              borderRadius: 20, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontWeight: 700,
              color: isPublic ? "#0CCE6B" : "#64748B",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                background: isPublic ? "#0CCE6B" : "#64748B",
                display: "inline-block", transition: "background 0.2s",
              }} />
              {isPublic ? "Visible en Explorar" : "Perfil privado"}
            </button>
            <button onClick={() => setShowInvitar(!showInvitar)} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              borderRadius: 20, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontWeight: 700, color: "#3B82F6",
            }}>{"👪"} Familia</button>
          </div>
          {showInvitar && (
            <div style={{ marginTop: 12, background: "#F4F6FB", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
                Compartí este link con tu familia. Cuando lo abran (con su cuenta), podrán ver y gestionar a {selected?.name}.
              </div>
              <button onClick={() => copyFamiliaLink(selected?.id)} style={{
                width: "100%", background: copiedFamilia ? "#EFF6FF" : "#E2E8F0",
                color: copiedFamilia ? "#3B82F6" : "#0F1E3D",
                border: `1px solid ${copiedFamilia ? "#BFDBFE" : "#CBD5E1"}`,
                borderRadius: 10, padding: "9px 12px", fontWeight: 800, fontSize: 13, cursor: "pointer",
              }}>
                {copiedFamilia ? "✅ Link copiado!" : "📋 Copiar link de acceso familiar"}
              </button>
              {familiaMembers.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Con acceso</div>
                  {familiaMembers.map((f: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#0F1E3D", padding: "4px 0", borderBottom: "1px solid #1a2030" }}>
                      👤 {f.profiles?.full_name || "Usuario"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Resumen de salud */}
      {(() => {
        const lastVac = [...vacunas].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
        const nextVac = [...vacunas].filter(v => v.next_date).sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime())[0];
        const lastVisita = diagnosticos[0];
        const today = new Date().toISOString().slice(0, 10);
        const citasProximas = citas.filter(c => c.date >= today);
        const hasData = lastVac || nextVac || lastVisita || citasProximas.length > 0;
        return (
          <Card style={{ border: "1px solid #E8FFF2", padding: 0, overflow: "hidden" }}>
            <div style={{ background: "#E8FFF2", padding: "10px 16px", borderBottom: "1px solid #E8FFF2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#0CCE6B" }}>🏥 Estado de salud</span>
              <button onClick={() => setShowAgendarCita(true)} style={{
                background: "#E8FFF2", color: "#0CCE6B", border: "1px solid #C6F6E0",
                borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>+ Agendar cita</button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 0 }}>
              {lastVisita && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a2030" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1 }}>Última visita</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lastVisita.title}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{lastVisita.date}</span>
                </div>
              )}
              {lastVac && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a2030" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1 }}>Última vacuna</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lastVac.name}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{lastVac.date}</span>
                </div>
              )}
              {nextVac && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: citasProximas.length > 0 ? "1px solid #1a2030" : "none" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1 }}>Próxima vacuna</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{nextVac.name}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0CCE6B" }}>{nextVac.next_date}</span>
                </div>
              )}
              {!hasData && (
                <div style={{ textAlign: "center", padding: "12px 0", color: "#64748B", fontSize: 13 }}>
                  Sin datos de salud registrados aún
                </div>
              )}
              {citasProximas.length > 0 && (
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#8B5CF6", fontWeight: 700, marginBottom: 6 }}>PRÓXIMAS CITAS</div>
                  {citasProximas.map((c: any) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a2030" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{c.summary}</div>
                        {c.vet && <div style={{ fontSize: 11, color: "#64748B" }}>{c.vet}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6" }}>{c.date}</span>
                        <button onClick={() => addToGoogleCalendar(c)} title="Agregar a Google Calendar" style={{
                          background: "transparent", border: "none", color: "#3B82F6",
                          fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                        }}>📅</button>
                        <button onClick={() => downloadIcal(c)} title="Descargar .ics" style={{
                          background: "transparent", border: "none", color: "#8B5CF6",
                          fontSize: 13, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                        }}>⬇️</button>
                        <button onClick={() => eliminarCita(c.id)} style={{
                          background: "transparent", border: "none", color: "#EF4444",
                          fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                        }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      {/* Vacunas */}
      {vacunas.length > 0 && (
        <>
          <div style={{ color: "#64748B", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Vacunas
          </div>
          {vacunas.map((v: any, i: number) => (
            <Card key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.name}</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>Aplicada: {v.date} · Próxima: {v.next_date}</div>
              </div>
              <Badge color={v.status === "ok" ? "#0CCE6B" : "#EF4444"}>
                {v.status === "ok" ? "Al día" : "Vencida"}
              </Badge>
            </Card>
          ))}
        </>
      )}

      {/* Reporte de salud */}
      <Card style={{ border: "1px solid #EFF6FF", padding: 0, overflow: "hidden" }}>
        <div style={{ background: "#F0F7FF", padding: "10px 16px", borderBottom: "1px solid #EFF6FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#3B82F6" }}>📋 Reporte de salud</span>
          <button onClick={generarReporte} disabled={loadingReporte} style={{
            background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE",
            borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
            opacity: loadingReporte ? 0.6 : 1,
          }}>{loadingReporte ? "Generando..." : reporte ? "Regenerar" : "Generar con IA"}</button>
        </div>
        {!reporte && !loadingReporte && (
          <div style={{ padding: "14px 16px", color: "#64748B", fontSize: 13 }}>
            Generá un resumen completo del estado de salud de {selected?.name} con análisis, alertas y recomendaciones.
          </div>
        )}
        {loadingReporte && (
          <div style={{ padding: "14px 16px", color: "#64748B", fontSize: 13 }}>Analizando historial...</div>
        )}
        {reporte && (
          <div style={{ padding: 16, fontSize: 13, color: "#0F1E3D", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {reporte.split("**").join("")}
          </div>
        )}
      </Card>

      </div>{/* /db-col-left */}
      <div className="db-col-right">

      {/* QR compacto */}
      <Card style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{"⬛"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>QR de identificacion</div>
          <div style={{ color: "#64748B", fontSize: 11 }}>Colocalo en el collar. Si lo encuentran, ven todos sus datos</div>
        </div>
        <a href={"/mascota/" + selected?.id} target="_blank" rel="noreferrer" style={{
          background: "#E2E8F0", color: "#0F1E3D", borderRadius: 8, padding: "6px 12px",
          fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0,
        }}>Ver</a>
      </Card>

      {/* Peso */}
      <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{"⚖️"} Peso: <span style={{ color: "#F97316" }}>{selected?.weight || "no registrado"}</span></div>
        <button onClick={() => setShowPeso(!showPeso)} style={{
          background: "#FFF7ED", color: "#F97316", border: "1px solid #FED7AA",
          borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>Actualizar</button>
      </Card>
      {showPeso && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: -8 }}>
          <input type="number" placeholder="Nuevo peso en kg" value={nuevoPeso}
            onChange={e => setNuevoPeso(e.target.value)} style={{ flex: 1 }} />
          <button onClick={handleAgregarPeso} style={{
            background: "#0CCE6B", color: "#000", border: "none", borderRadius: 8,
            padding: "8px 14px", fontWeight: 800, cursor: "pointer",
          }}>Guardar</button>
        </div>
      )}

      {/* URGENCIAS */}
      <Card style={{ border: "1px solid #FECACA", padding: 0, overflow: "hidden" }}>
        <div style={{ background: "#FFF0F0", padding: "10px 16px", borderBottom: "1px solid #FFF0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#EF4444" }}>🚨 Urgencias y contactos clave</span>
          <button onClick={() => setShowAddUrgencia(!showAddUrgencia)} style={{
            background: "#FFF0F0", color: "#EF4444", border: "1px solid #FECACA",
            borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}>+ Agregar</button>
        </div>

        {showAddUrgencia && (
          <div style={{ padding: 16, borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Nombre (ej: Dr. García, Clínica VetCentro)" value={urgenciaForm.name} onChange={e => setUrgenciaForm(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Teléfono" value={urgenciaForm.phone} onChange={e => setUrgenciaForm(f => ({ ...f, phone: e.target.value }))} />
              <input placeholder="Especialidad (ej: Clínica general, Guardia 24hs)" value={urgenciaForm.specialty} onChange={e => setUrgenciaForm(f => ({ ...f, specialty: e.target.value }))} />
              <input placeholder="Notas (ej: atiende los sábados)" value={urgenciaForm.notes} onChange={e => setUrgenciaForm(f => ({ ...f, notes: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAddUrgencia(false)} style={{ flex: 1, background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 8, padding: 10, cursor: "pointer", fontWeight: 700 }}>Cancelar</button>
                <button onClick={handleAddUrgencia} style={{ flex: 1, background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, padding: 10, cursor: "pointer", fontWeight: 800 }}>Guardar</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: urgencias.length > 0 ? "8px 16px 12px" : "14px 16px" }}>
          {urgencias.length === 0 && !showAddUrgencia && (
            <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Guardá los datos del veterinario de confianza para tenerlos a mano en emergencias.</p>
          )}
          {urgencias.map((u: any) => (
            <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #1a2030" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                {u.specialty && <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, marginBottom: 2 }}>{u.specialty}</div>}
                {u.phone && (
                  <a href={`tel:${u.phone}`} style={{ fontSize: 13, color: "#64748B", textDecoration: "none", display: "block" }}>📞 {u.phone}</a>
                )}
                {u.notes && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{u.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 8, flexShrink: 0 }}>
                {u.phone && (
                  <a href={`https://wa.me/${u.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{
                    background: "#E8FFF2", color: "#0CCE6B", border: "1px solid #C6F6E0",
                    borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, textDecoration: "none",
                  }}>WA</a>
                )}
                <button onClick={() => eliminarUrgencia(u.id)} style={{
                  background: "transparent", border: "none", color: "#EF4444",
                  fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                }}>×</button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Link href="/mascota/nueva" style={{
          flex: 1, background: "#E8FFF2", color: "#0CCE6B", border: "1px solid #C6F6E0",
          borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13,
          textDecoration: "none", textAlign: "center",
        }}>+ Agregar mascota</Link>
        <button onClick={() => setShowBaja(true)} style={{
          flex: 1, background: "#FFF0F0", color: "#EF4444", border: "1px solid #FECACA",
          borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>{"🕊️"} Dar de baja</button>
      </div>

      </div>{/* /db-col-right */}
      </div>{/* /db-layout */}

      {/* Modal baja */}
      {showBaja && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000088", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #FECACA", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%" }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🕊️</div>
            <h3 style={{ textAlign: "center", marginBottom: 8 }}>Dar de baja a {selected?.name}</h3>
            <p style={{ color: "#64748B", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
              Lamentamos mucho tu pérdida. El perfil quedará guardado en tu historial pero no aparecerá activo.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowBaja(false)} style={{
                flex: 1, background: "#E2E8F0", color: "#64748B", border: "none",
                borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer",
              }}>Cancelar</button>
              <button onClick={handleBaja} style={{
                flex: 1, background: "#EF4444", color: "#fff", border: "none",
                borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer",
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agendar cita */}
      {showAgendarCita && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #DDD6FE", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%" }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: "#8B5CF6" }}>📅 Agendar cita</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="date" value={citaForm.date} onChange={e => setCitaForm(f => ({ ...f, date: e.target.value }))} />
              <input placeholder="Motivo (ej: Control anual, Castración)" value={citaForm.summary} onChange={e => setCitaForm(f => ({ ...f, summary: e.target.value }))} />
              <input placeholder="Veterinario / Clínica (opcional)" value={citaForm.vet} onChange={e => setCitaForm(f => ({ ...f, vet: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAgendarCita(false)} style={{
                  flex: 1, background: "#E2E8F0", color: "#64748B", border: "none",
                  borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer",
                }}>Cancelar</button>
                <button onClick={handleAgendarCita} style={{
                  flex: 1, background: "#8B5CF6", color: "#fff", border: "none",
                  borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Agendar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <Link href="/admin" style={{
          display: "block", width: "100%", background: "#FDF2F8", color: "#EC4899",
          border: "1px solid #FBCFE8", borderRadius: 12, padding: 12, fontWeight: 700,
          fontSize: 13, marginTop: 12, textAlign: "center", textDecoration: "none",
        }}>⚙️ Panel admin</Link>
      )}

      <button onClick={handleLogout} style={{
        width: "100%", background: "transparent", border: "1px solid #E2E8F0",
        borderRadius: 12, padding: 12, color: "#64748B", fontSize: 13, marginTop: 8, cursor: "pointer",
      }}>Cerrar sesión</button>
    </div>
  );
}
