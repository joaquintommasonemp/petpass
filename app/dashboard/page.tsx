"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UiBadge, UiCard, UiMiniButton } from "@/components/ui";

function Badge({ children, color = "#2CB8AD" }: { children: React.ReactNode; color?: string }) {
  return <UiBadge color={color}>{children}</UiBadge>;
}

function Card({ children, style = {}, className = "" }: { children: React.ReactNode; style?: any; className?: string }) {
  return (
    <UiCard
      className={`dashboard-card${className ? ` ${className}` : ""}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)", ...style }}
    >
      {children}
    </UiCard>
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
  const [citaSuccess, setCitaSuccess] = useState(false);
  const [urgencias, setUrgencias] = useState<any[]>([]);
  const [showAddUrgencia, setShowAddUrgencia] = useState(false);
  const [urgenciaForm, setUrgenciaForm] = useState({ name: "", phone: "", specialty: "", notes: "" });
  const [reporte, setReporte] = useState<string | null>(null);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [familiaMembers, setFamiliaMembers] = useState<any[]>([]);
  const [showInvitar, setShowInvitar] = useState(false);
  const [copiedFamilia, setCopiedFamilia] = useState(false);
  const [confirmEliminarCita, setConfirmEliminarCita] = useState<string | null>(null);
  const [confirmEliminarUrgencia, setConfirmEliminarUrgencia] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = "/login"; return; }
    setAuthToken(session.access_token);
    const user = session.user;
    const [{ data: prof }, { data }, { data: familiaRows }, { data: urgs }] = await Promise.all([
      supabase.from("profiles").select("is_admin, is_premium").eq("id", user.id).single(),
      supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true),
      supabase.from("mascota_familia").select("mascota_id").eq("user_id", user.id),
      supabase.from("urgencias_contactos").select("*").eq("user_id", user.id).order("created_at"),
    ]);
    if (prof?.is_admin) setIsAdmin(true);
    if (prof?.is_premium || prof?.is_admin) setIsPremium(true);
    setUrgencias(urgs || []);
    const familiaIds = (familiaRows || []).map((r: any) => r.mascota_id);
    let shared: any[] = [];
    if (familiaIds.length > 0) {
      const { data: sharedMs } = await supabase.from("mascotas").select("*").in("id", familiaIds).eq("active", true);
      shared = sharedMs || [];
    }
    const allMascotas = [...(data || []), ...shared];
    if (allMascotas.length === 0 && !localStorage.getItem("pp_onboarding_done")) {
      window.location.href = "/onboarding";
      return;
    }
    if (allMascotas.length > 0) {
      setMascotas(allMascotas);
      await selectMascota(allMascotas[0]);
    }
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
    const EXCLUDED_TITLES = ["Actualizacion de peso", "Actualizaci\u00f3n de peso", "Peso inicial", "\ud83d\udcc4 Documento", "\ud83d\udcc5 Cita"];
    const [{ data: vacs }, { data: allHist }, { data: cits }] = await Promise.all([
      supabase.from("vacunas").select("*").eq("mascota_id", m.id),
      supabase.from("historial").select("*").eq("mascota_id", m.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("historial").select("*").eq("mascota_id", m.id).eq("title", "\ud83d\udcc5 Cita").order("date", { ascending: true }),
    ]);
    setVacunas(vacs || []);
    setDiagnosticos((allHist || []).filter((h: any) => !EXCLUDED_TITLES.includes(h.title)).slice(0, 5));
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
    const pesoNum = parseFloat(nuevoPeso);
    if (!nuevoPeso || !selected || isNaN(pesoNum) || pesoNum <= 0 || pesoNum > 500) return;
    const entry = {
      mascota_id: selected.id,
      title: "Actualizacion de peso",
      summary: `${nuevoPeso} kg`,
      date: new Date().toLocaleDateString("es-AR"),
      vet: "Actualizacion manual",
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
      title: "\ud83d\udcc5 Cita",
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
    setCitaSuccess(true);
    setTimeout(() => setCitaSuccess(false), 3000);
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
        system: "Sos un veterinario experto redactando reportes de salud animal. Usa markdown con **negritas** para los titulos de seccion.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    setReporte(data.reply || "No pudimos generar el reporte en este momento.");
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

  if (loading) return (
    <div className="dashboard-loading-state" style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 0" }}>
      {/* Perfil skeleton */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
        <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%", flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 18, width: "55%" }} />
          <div className="skeleton" style={{ height: 13, width: "35%" }} />
          <div className="skeleton" style={{ height: 13, width: "45%" }} />
        </div>
      </div>
      {/* Stats skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />
        ))}
      </div>
      {/* Cards skeleton */}
      {[1,2].map(i => (
        <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton" style={{ height: 14, width: "40%" }} />
          <div className="skeleton" style={{ height: 12, width: "75%" }} />
          <div className="skeleton" style={{ height: 12, width: "60%" }} />
        </div>
      ))}
    </div>
  );

  if (mascotas.length === 0) return (
    <div className="dashboard-empty-state" style={{ padding: "8px 0 40px" }}>
      {/* Bienvenida */}
      <div style={{ textAlign: "center", padding: "28px 16px 24px" }}>
        <div style={{ fontSize: 60, marginBottom: 12 }}>&#128062;</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1C3557", marginBottom: 8 }}>
          La app para el d&iacute;a a d&iacute;a de tu mascota.
        </h2>
        <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.7, marginBottom: 0 }}>
          Todo lo importante para cuidarla mejor, en un solo lugar.<br />
          Empez&aacute; registrando a tu primer compa&ntilde;ero.
        </p>
      </div>

      {/* Features */}
      <div className="dashboard-empty-features" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { icon: "🏥", title: "Historial clinico", desc: "Consultas, vacunas y documentos en un solo lugar" },
          { icon: "🤖", title: "Vet IA", desc: "Consulta con IA veterinaria 24/7" },
          { icon: "🔬", title: "Portal de estudios", desc: "Tu vet sube resultados directamente" },
          { icon: "📍", title: "Mascotas perdidas", desc: "Red de alertas de tu comunidad" },
        ].map(f => (
          <div key={f.title} style={{
            background: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: 14, padding: "14px 12px",
            boxShadow: "0 1px 4px rgba(28,53,87,0.06)",
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#1C3557", marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Pasos */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: "16px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
          C&oacute;mo empezar
        </div>
        {[
          { step: "1", text: "Registr\u00e1 a tu mascota con sus datos b\u00e1sicos" },
          { step: "2", text: "Agrega su historial de vacunas y consultas" },
          { step: "3", text: "Comparti el portal de estudios con tu veterinario" },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #2CB8AD, #229E94)",
              color: "#fff", fontSize: 12, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>{s.step}</div>
            <span style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.5, paddingTop: 3 }}>{s.text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link href="/mascota/nueva" style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        background: "linear-gradient(135deg, #2CB8AD, #229E94)", color: "#fff",
        borderRadius: 14, padding: "16px 24px", fontWeight: 900, fontSize: 16,
        textDecoration: "none", boxShadow: "0 4px 20px rgba(44,184,173,0.35)",
      }}>
        <span style={{ fontSize: 20 }}>+</span> Registrar mi mascota
      </Link>
      <p style={{ textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 12 }}>
        Empez&aacute; cuando quieras &middot; Plan inicial disponible
      </p>
    </div>
  );
  return (
    <div className="dashboard-main">

      {/* Banner Premium - solo usuarios free */}
      {!isPremium && (
        <div style={{
          background: "linear-gradient(135deg, #1C3557 0%, #2CB8AD 100%)",
          borderRadius: 16, padding: "14px 18px", marginBottom: 18,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          boxShadow: "0 4px 20px rgba(44,184,173,0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>&#10024;</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                Descubr&iacute; PetPass Premium
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                M&aacute;s herramientas, m&aacute;s mascotas y an&aacute;lisis m&aacute;s completos
              </div>
            </div>
          </div>
          <Link href="/premium" style={{
            background: "#fff", color: "#1C3557",
            borderRadius: 10, padding: "7px 14px",
            fontSize: 12, fontWeight: 800, textDecoration: "none", flexShrink: 0,
            whiteSpace: "nowrap",
          }}>Conocer m&aacute;s &rarr;</Link>
        </div>
      )}
      {/* Selector de mascotas */}
      {mascotas.length > 1 && (
        <div className="dashboard-pet-switcher" style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {mascotas.map(m => (
            <button key={m.id} onClick={() => selectMascota(m)} style={{
              background: selected?.id === m.id ? "#E5F7F6" : "#FFFFFF",
              border: `1px solid ${selected?.id === m.id ? "#2CB8AD" : "#E2E8F0"}`,
              borderRadius: 20, padding: "6px 14px",
              color: selected?.id === m.id ? "#2CB8AD" : "#64748B",
              fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {m.photo_url
                ? <img src={m.photo_url} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                : <span>{m.breed?.toLowerCase().includes("gato") ? "🐱" : "🐶"}</span>
              }
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Alertas de vacunas */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const in30 = new Date(today); in30.setDate(today.getDate() + 30);
        const vencidas = vacunas.filter(v => {
          if (!v.next_date) return false;
          const d = new Date(v.next_date); d.setHours(0,0,0,0);
          return d < today;
        });
        const proximas = vacunas.filter(v => {
          if (!v.next_date) return false;
          const d = new Date(v.next_date); d.setHours(0,0,0,0);
          return d >= today && d <= in30;
        });
        if (!vencidas.length && !proximas.length) return null;
        return (
          <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {vencidas.map(v => (
              <div key={v.id} style={{
                background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
                padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 12, fontWeight: 900, flexShrink: 0, color: "#EF4444" }}>!</span>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: "#EF4444" }}>{v.name}</span>
                  <span style={{ fontSize: 12, color: "#64748B" }}> &middot; vencida el {v.next_date}</span>
                </div>
                <UiBadge color="#EF4444" fontSize={10}>VENCIDA</UiBadge>
              </div>
            ))}
            {proximas.map(v => {
              const dias = Math.ceil((new Date(v.next_date).getTime() - today.getTime()) / (1000*60*60*24));
              return (
                <div key={v.id} style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12,
                  padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 900, flexShrink: 0, color: "#F97316" }}>!</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: "#92400E" }}>{v.name}</span>
                    <span style={{ fontSize: 12, color: "#64748B" }}> &middot; vence en {dias} d&iacute;a{dias !== 1 ? "s" : ""}</span>
                  </div>
                  <UiBadge color="#F97316" fontSize={10}>{dias === 0 ? "HOY" : `${dias}d`}</UiBadge>
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="db-layout">
      <div className="db-col-left">

      {/* Perfil principal */}
      <Card className="profile-hero-card" style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* Foto con upload */}
        <div className="profile-photo-wrap" style={{ position: "relative", flexShrink: 0 }}>
          <div
            onClick={() => fileRef.current?.click()}
            className="profile-photo-button"
            style={{
              width: 80, height: 80, borderRadius: "50%", cursor: "pointer",
              background: "#F4F6FB", border: "2px solid #B2E8E5",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", position: "relative",
            }}
          >
            {uploadingPhoto ? (
              <span style={{ color: "#64748B", fontSize: 11 }}>Subiendo...</span>
            ) : selected?.photo_url ? (
              <img src={selected.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 36 }}>{selected?.breed?.toLowerCase().includes("gato") ? "🐱" : "🐶"}</span>
            )}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#00000088", textAlign: "center", fontSize: 10,
              color: "#fff", padding: "2px 0", fontWeight: 700,
            }}>Foto</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        <div className="profile-hero-info" style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Georgia, serif" }}>{selected?.name}</div>
          <div style={{ color: "#64748B", fontSize: 13, marginBottom: 8 }}>
            {selected?.breed} &middot; {selected?.age} &middot; {selected?.sex}
          </div>
          <div className="profile-badge-row" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {selected?.chip && (
              <a href={`/mascota/${selected.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <Badge color="#2CB8AD">Chip: ...{selected.chip.slice(-6)}</Badge>
              </a>
            )}
            {selected?.location && <Badge color="#3B82F6">{selected.location}</Badge>}
            {selected?.weight && <Badge color="#F97316">{selected.weight}</Badge>}
            {selected?.castrado && selected.castrado !== "No se" && selected.castrado !== "No s\u00e9" && (
              <Badge color={(selected.castrado === "Si" || selected.castrado === "S\u00ed") ? "#8B5CF6" : "#64748B"}>
                {(selected.castrado === "Si" || selected.castrado === "S\u00ed") ? "Castrado/a" : "No castrado/a"}
              </Badge>
            )}
          </div>
          <div className="profile-action-row" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a href={`/mascota/${selected?.id}`} target="_blank" rel="noreferrer" style={{
              fontSize: 11, color: "#2CB8AD", textDecoration: "none", fontWeight: 700,
              background: "#E5F7F6", border: "1px solid rgba(44,184,173,0.2)", borderRadius: 8,
              padding: "4px 10px", display: "inline-block",
            }}>Ver perfil</a>
            <Link href={`/mascota/editar/${selected?.id}`} style={{
              fontSize: 11, color: "#F97316", textDecoration: "none", fontWeight: 700,
              background: "#FFF7ED", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 8,
              padding: "4px 10px", display: "inline-block",
            }}>Editar</Link>
            <a href={`/carnet/${selected?.id}`} target="_blank" rel="noreferrer" style={{
              fontSize: 11, color: "#6366F1", textDecoration: "none", fontWeight: 700,
              background: "#EEF2FF", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8,
              padding: "4px 10px", display: "inline-block",
            }}>Carnet</a>
            {/* Toggle publico/privado */}
            <button onClick={togglePublic} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: isPublic ? "#E5F7F6" : "#E2E8F0",
              border: `1px solid ${isPublic ? "#B2E8E5" : "#CBD5E1"}`,
              borderRadius: 20, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontWeight: 700,
              color: isPublic ? "#2CB8AD" : "#64748B",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                background: isPublic ? "#2CB8AD" : "#64748B",
                display: "inline-block", transition: "background 0.2s",
              }} />
              {isPublic ? "Visible en Explorar" : "Perfil privado"}
            </button>
            <button onClick={() => setShowInvitar(!showInvitar)} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              borderRadius: 20, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontWeight: 700, color: "#3B82F6",
            }}>Familia</button>
          </div>
          {showInvitar && (
            <div className="profile-family-panel" style={{ marginTop: 12, background: "#F4F6FB", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
                Compart&iacute; este link con tu familia. Cuando lo abran (con su cuenta), podr&aacute;n ver y gestionar a {selected?.name}.
              </div>
              <button onClick={() => copyFamiliaLink(selected?.id)} style={{
                width: "100%", background: copiedFamilia ? "#EFF6FF" : "#E2E8F0",
                color: copiedFamilia ? "#3B82F6" : "#1C3557",
                border: `1px solid ${copiedFamilia ? "#BFDBFE" : "#CBD5E1"}`,
                borderRadius: 12, padding: "10px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer",
                boxShadow: copiedFamilia ? "0 8px 20px rgba(59,130,246,0.12)" : "none",
              }}>
                {copiedFamilia ? "Link copiado!" : "Copiar link de acceso familiar"}
              </button>
              {familiaMembers.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Con acceso</div>
                  {familiaMembers.map((f: any, i: number) => (
                    <div key={i} style={{ fontSize: 12, color: "#1C3557", padding: "4px 0", borderBottom: "1px solid #E2E8F0" }}>
                      {f.profiles?.full_name || "Usuario"}
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
          <Card className="profile-section-card profile-health-card" style={{ border: "1px solid #E5F7F6", padding: 0, overflow: "hidden" }}>
            <div className="profile-card-header" style={{ background: "#E5F7F6", padding: "10px 16px", borderBottom: "1px solid #E5F7F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#2CB8AD" }}>Estado de salud</span>
              <UiMiniButton onClick={() => setShowAgendarCita(true)} color="#2CB8AD">+ Agendar cita</UiMiniButton>
            </div>
            <div className="profile-row-list" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 0 }}>
              {lastVisita && (
                <div className="profile-data-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #E2E8F0" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1 }}>&Uacute;ltima visita</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lastVisita.title}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{lastVisita.date}</span>
                </div>
              )}
              {lastVac && (
                <div className="profile-data-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #E2E8F0" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1 }}>&Uacute;ltima vacuna</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lastVac.name}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{lastVac.date}</span>
                </div>
              )}
              {nextVac && (
                <div className="profile-data-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: citasProximas.length > 0 ? "1px solid #E2E8F0" : "none" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#64748B", marginBottom: 1 }}>Pr&oacute;xima vacuna</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{nextVac.name}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#2CB8AD" }}>{nextVac.next_date}</span>
                </div>
              )}
              {!hasData && (
                <div style={{ textAlign: "center", padding: "12px 0", color: "#64748B", fontSize: 13 }}>
                  Todav&iacute;a no hay datos de salud cargados
                </div>
              )}
              {citasProximas.length > 0 && (
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#8B5CF6", fontWeight: 700, marginBottom: 6 }}>PROXIMAS CITAS</div>
                  {citasProximas.map((c: any) => (
                    <div className="profile-data-row" key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #E2E8F0" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{c.summary}</div>
                        {c.vet && <div style={{ fontSize: 11, color: "#64748B" }}>{c.vet}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#8B5CF6" }}>{c.date}</span>
                        <button onClick={() => addToGoogleCalendar(c)} title="Agregar a Google Calendar" style={{
                          background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#3B82F6",
                          fontSize: 10, fontWeight: 700, cursor: "pointer", padding: "3px 7px", lineHeight: 1, borderRadius: 6,
                        }}>📅</button>
                        <button onClick={() => downloadIcal(c)} title="Descargar .ics" style={{
                          background: "#F5F3FF", border: "1px solid #DDD6FE", color: "#8B5CF6",
                          fontSize: 10, fontWeight: 700, cursor: "pointer", padding: "3px 7px", lineHeight: 1, borderRadius: 6,
                        }}>ICS</button>
                        {confirmEliminarCita === c.id ? (
                          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <button onClick={() => { eliminarCita(c.id); setConfirmEliminarCita(null); }} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                            <button onClick={() => setConfirmEliminarCita(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer" }}>No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmEliminarCita(c.id)} style={{
                            background: "#FFF0F0", border: "1px solid #FECACA", color: "#EF4444",
                            fontSize: 12, cursor: "pointer", padding: "3px 7px", lineHeight: 1, borderRadius: 6,
                          }}>✕</button>
                        )}
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
            <Card className="profile-compact-card profile-vaccine-card" key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.name}</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>Aplicada: {v.date} &middot; Pr&oacute;xima: {v.next_date}</div>
              </div>
              {(() => {
                const today = new Date(); today.setHours(0,0,0,0);
                const al_dia = v.next_date ? new Date(v.next_date) >= today : true;
                return (
                  <Badge color={al_dia ? "#2CB8AD" : "#EF4444"}>
                    {al_dia ? "Al día" : "Vencida"}
                  </Badge>
                );
              })()}
            </Card>
          ))}
        </>
      )}

      {/* Reporte de salud */}
      <Card className="profile-section-card profile-report-card" style={{ border: "1px solid #EFF6FF", padding: 0, overflow: "hidden" }}>
        <div className="profile-card-header" style={{ background: "#F0F7FF", padding: "10px 16px", borderBottom: "1px solid #EFF6FF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#3B82F6" }}>Reporte de salud</span>
          <div style={{ display: "flex", gap: 6 }}>
            <UiMiniButton
              onClick={generarReporte}
              disabled={loadingReporte}
              color="#3B82F6"
              style={{ opacity: loadingReporte ? 0.6 : 1 }}
            >
              {loadingReporte ? "Generando..." : reporte ? "Regenerar" : "Generar con IA"}
            </UiMiniButton>
            {reporte && (
              <UiMiniButton
                onClick={() => {
                  const blob = new Blob([reporte], { type: "text/plain;charset=utf-8" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `reporte_${selected?.name}_${new Date().toISOString().slice(0, 10)}.txt`;
                  a.click();
                }}
                color="#8B5CF6"
              >
                Descargar
              </UiMiniButton>
            )}
          </div>
        </div>
        {!reporte && !loadingReporte && (
          <div style={{ padding: "14px 16px", color: "#64748B", fontSize: 13 }}>
            Gener&aacute; un resumen claro del estado de salud de {selected?.name}, con alertas y recomendaciones para seguir.
          </div>
        )}
        {loadingReporte && (
          <div style={{ padding: "14px 16px", color: "#64748B", fontSize: 13 }}>Estamos analizando el historial...</div>
        )}
        {reporte && (
          <div style={{ padding: 16, fontSize: 13, color: "#1C3557", lineHeight: 1.7 }}>
            {reporte.split("\n").map((line, i) => {
              const clean = line.replace(/\*\*/g, "");
              const isSection = /^[0-9]+\./.test(clean.trim()) || clean.trim().startsWith("##");
              const text = clean.replace(/^##\s*/, "");
              if (!text.trim()) return <div key={i} style={{ height: 8 }} />;
              return (
                <div key={i} style={isSection ? { fontWeight: 800, color: "#1C3557", marginTop: 12, marginBottom: 2 } : {}}>
                  {text}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      </div>{/* /db-col-left */}
      <div className="db-col-right">

      {/* Carnet + QR */}
      <Card className="profile-compact-card profile-carnet-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🪪</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Carnet digital</div>
          <div style={{ color: "#64748B", fontSize: 11 }}>Vacunas, chip y QR para veterinarias y guarder&iacute;as</div>
        </div>
        <a href={"/carnet/" + selected?.id} target="_blank" rel="noreferrer" style={{
          background: "#EEF2FF", color: "#6366F1", borderRadius: 8, padding: "6px 12px",
          fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0,
          border: "1px solid rgba(99,102,241,0.2)",
        }}>Ver</a>
      </Card>

      {/* Peso */}
      <Card className="profile-compact-card profile-weight-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Peso: <span style={{ color: "#F97316" }}>{selected?.weight || "no registrado"}</span></div>
        <UiMiniButton onClick={() => setShowPeso(!showPeso)} color="#F97316">Actualizar</UiMiniButton>
      </Card>
      {showPeso && (
        <div className="profile-inline-form" style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: -8 }}>
          <input type="number" placeholder="Nuevo peso en kg" value={nuevoPeso}
            onChange={e => setNuevoPeso(e.target.value)} style={{ flex: 1 }} />
          <UiMiniButton onClick={handleAgregarPeso} tone="solid">Guardar</UiMiniButton>
        </div>
      )}

      {/* URGENCIAS */}
      <Card className="profile-section-card profile-urgent-card" style={{ border: "1px solid #FECACA", padding: 0, overflow: "hidden" }}>
        <div className="profile-card-header" style={{ background: "#FFF0F0", padding: "10px 16px", borderBottom: "1px solid #FFF0F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: "#EF4444" }}>Urgencias y contactos clave</span>
          <UiMiniButton onClick={() => setShowAddUrgencia(!showAddUrgencia)} color="#EF4444">+ Agregar</UiMiniButton>
        </div>

        {showAddUrgencia && (
          <div className="profile-inline-panel" style={{ padding: 16, borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input placeholder="Nombre (ej: Dr. Garcia, Clinica VetCentro)" value={urgenciaForm.name} onChange={e => setUrgenciaForm(f => ({ ...f, name: e.target.value }))} />
              <input placeholder="Telefono" value={urgenciaForm.phone} onChange={e => setUrgenciaForm(f => ({ ...f, phone: e.target.value }))} />
              <input placeholder="Especialidad (ej: Clinica general, Guardia 24hs)" value={urgenciaForm.specialty} onChange={e => setUrgenciaForm(f => ({ ...f, specialty: e.target.value }))} />
              <input placeholder="Notas (ej: atiende los sabados)" value={urgenciaForm.notes} onChange={e => setUrgenciaForm(f => ({ ...f, notes: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <UiMiniButton onClick={() => setShowAddUrgencia(false)} color="#64748B" tone="ghost" style={{ flex: 1, minHeight: 40 }}>Cancelar</UiMiniButton>
                <UiMiniButton onClick={handleAddUrgencia} color="#EF4444" tone="solid" style={{ flex: 1, minHeight: 40 }}>Guardar</UiMiniButton>
              </div>
            </div>
          </div>
        )}

        <div style={{ padding: urgencias.length > 0 ? "8px 16px 12px" : "14px 16px" }}>
          {urgencias.length === 0 && !showAddUrgencia && (
            <p style={{ color: "#64748B", fontSize: 13, margin: 0 }}>Guard&aacute; los datos del veterinario de confianza para tenerlos a mano en emergencias.</p>
          )}
          {urgencias.map((u: any) => (
            <div className="profile-urgent-row" key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                {u.specialty && <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 600, marginBottom: 2 }}>{u.specialty}</div>}
                {u.phone && (
                  <a href={`tel:${u.phone}`} style={{ fontSize: 13, color: "#64748B", textDecoration: "none", display: "block" }}>{u.phone}</a>
                )}
                {u.notes && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{u.notes}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, marginLeft: 8, flexShrink: 0 }}>
                {u.phone && (
                  <a href={`https://wa.me/${u.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{
                    background: "#E5F7F6", color: "#2CB8AD", border: "1px solid #B2E8E5",
                    borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 700, textDecoration: "none",
                    minHeight: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}>💬 WA</a>
                )}
                {confirmEliminarUrgencia === u.id ? (
                  <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button onClick={() => { eliminarUrgencia(u.id); setConfirmEliminarUrgencia(null); }} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                    <button onClick={() => setConfirmEliminarUrgencia(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>No</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmEliminarUrgencia(u.id)} style={{
                    background: "transparent", border: "none", color: "#EF4444",
                    fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                  }}>×</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Acciones */}
      <div className="profile-secondary-actions" style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Link href="/mascota/nueva" style={{
          flex: 1, background: "#E5F7F6", color: "#2CB8AD", border: "1px solid #B2E8E5",
          borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13,
          textDecoration: "none", textAlign: "center",
        }}>+ Agregar mascota</Link>
        <button onClick={() => setShowBaja(true)} style={{
          flex: 1, background: "#FFF0F0", color: "#EF4444", border: "1px solid #FECACA",
          borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>Dar de baja</button>
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
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🌈</div>
            <h3 style={{ textAlign: "center", marginBottom: 8 }}>Dar de baja a {selected?.name}</h3>
            <p style={{ color: "#64748B", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
              Lamentamos mucho tu p&eacute;rdida. El perfil quedar&aacute; guardado en tu historial pero no aparecer&aacute; activo.
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
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: "#8B5CF6" }}>Agendar cita</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="date" value={citaForm.date} onChange={e => setCitaForm(f => ({ ...f, date: e.target.value }))} />
              <input placeholder="Motivo (ej: Control anual, Castracion)" value={citaForm.summary} onChange={e => setCitaForm(f => ({ ...f, summary: e.target.value }))} />
              <input placeholder="Veterinario / Clinica (opcional)" value={citaForm.vet} onChange={e => setCitaForm(f => ({ ...f, vet: e.target.value }))} />
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

      {/* Toast cita agendada */}
      {citaSuccess && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1C3557", color: "#fff", borderRadius: 12,
          padding: "12px 20px", fontSize: 13, fontWeight: 700,
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 500,
          display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap",
        }}>
          <span>✓</span> Cita agendada correctamente
        </div>
      )}

      {isAdmin && (
        <Link href="/admin" style={{
          display: "block", width: "100%", background: "#FDF2F8", color: "#EC4899",
          border: "1px solid #FBCFE8", borderRadius: 12, padding: 12, fontWeight: 700,
          fontSize: 13, marginTop: 12, textAlign: "center", textDecoration: "none",
        }}>Panel admin</Link>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Link href="/perfil" style={{
          flex: 1, background: "#F8FAFC", border: "1px solid #E2E8F0",
          borderRadius: 12, padding: 12, color: "#64748B", fontSize: 13,
          textDecoration: "none", textAlign: "center", fontWeight: 600,
        }}>👤 Mi perfil</Link>
        <button onClick={handleLogout} style={{
          flex: 1, background: "transparent", border: "1px solid #E2E8F0",
          borderRadius: 12, padding: 12, color: "#64748B", fontSize: 13, cursor: "pointer",
        }}>Cerrar sesi&oacute;n</button>
      </div>
    </div>
  );
}
