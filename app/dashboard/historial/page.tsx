"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import Toast, { ToastType } from "@/components/Toast";
import { PetAvatar, UiBadge, UiCard } from "@/components/ui";

function Card({ children, style = {}, className = "" }: any) {
  return (
    <UiCard className={`history-card${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </UiCard>
  );
}

function Badge({ children, color = "#3B82F6" }: any) {
  return <UiBadge color={color}>{children}</UiBadge>;
}

function isDoc(h: any) {
  return typeof h.summary === "string" && h.summary.includes("::");
}

function detectStudyType(fileName: string) {
  const name = fileName.toLowerCase();
  if (name.includes("radiograf") || name.includes("placa") || name.includes("xray") || name.includes("rayosx")) return "Radiografia";
  if (name.includes("ecograf") || name.includes("ultraso")) return "Ecografia";
  if (name.includes("hemograma") || name.includes("laboratorio") || name.includes("sangre") || name.includes("analisis") || name.includes("orina")) return "Laboratorio";
  if (name.includes("tomograf") || name.includes("tac")) return "Tomografia";
  if (name.includes("biopsia")) return "Biopsia";
  if (name.includes("electrocardiog") || name.includes("ecg")) return "Electrocardiograma";
  if (name.includes("resonancia") || name.includes("mri")) return "Resonancia";
  return "Documento";
}

const HIST_TABS = ["consultas", "estudios", "vacunas", "turnos", "alimentacion"];
const HIST_TAB_LABELS: Record<string, string> = {
  consultas: "Clinica",
  estudios: "Estudios",
  vacunas: "Vacunas",
  turnos: "Turnos",
  alimentacion: "Alimento",
};

const STUDY_TYPES = [
  "Radiografia",
  "Ecografia",
  "Laboratorio",
  "Tomografia",
  "Resonancia",
  "Electrocardiograma",
  "Biopsia",
  "Receta",
  "Otro",
];

export default function Historial() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [alimentacion, setAlimentacion] = useState<any[]>([]);
  const [estudioLinks, setEstudioLinks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedStudyType, setSelectedStudyType] = useState("Otro");
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);
  const [form, setForm] = useState({ date: "", vet: "", title: "", summary: "" });
  const [vacForm, setVacForm] = useState({ name: "", date: "", next_date: "", vet: "", notes: "" });
  const [citaForm, setCitaForm] = useState({ date: "", summary: "", vet: "" });
  const [alimentForm, setAlimentForm] = useState({ marca: "", tipo: "", cantidad: "", frecuencia: "", notas: "" });
  const [adding, setAdding] = useState(false);
  const [addingVac, setAddingVac] = useState(false);
  const [addingCita, setAddingCita] = useState(false);
  const [addingAliment, setAddingAliment] = useState(false);
  const [histTab, setHistTab] = useState("consultas");
  const [linkNotes, setLinkNotes] = useState("");
  const [creatingLink, setCreatingLink] = useState(false);
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [recetas, setRecetas] = useState<string | null>(null);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [searchConsultas, setSearchConsultas] = useState("");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareDays, setShareDays] = useState(7);
  const [shareLabel, setShareLabel] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string } | null>(null);
  const supabase = createClient();
  const showToast = (message: string, type: ToastType = "success") => setToast({ message, type });

  useEffect(() => {
    async function load() {
      const authResult = await supabase.auth.getUser();
      const user = authResult.data.user;
      if (!user) return;
      const mascoResult = await supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true);
      const ms = mascoResult.data;
      if (ms && ms.length > 0) {
        setMascotas(ms);
        await selectMascota(ms[0]);
      }
    }
    load();
  }, []);

  async function selectMascota(m: any) {
    setMascota(m);
    setHistorial([]);
    setVacunas([]);
    setAlimentacion([]);
    setEstudioLinks([]);
    setNewLink(null);
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    const [histResult, vacResult, alimResult, linksResult] = await Promise.all([
      supabase.from("historial").select("*").eq("mascota_id", m.id).order("created_at", { ascending: false }),
      supabase.from("vacunas").select("*").eq("mascota_id", m.id).order("date", { ascending: false }),
      supabase.from("alimentacion").select("*").eq("mascota_id", m.id).order("created_at", { ascending: false }),
      supabase.from("estudio_links").select("*").eq("mascota_id", m.id).eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setHistorial(histResult.data || []);
    setVacunas(vacResult.data || []);
    setAlimentacion(alimResult.data || []);
    setEstudioLinks(linksResult.data || []);
  }

  async function addVacuna() {
    if (!vacForm.name.trim() || !vacForm.date.trim() || !mascota) return;
    const insertResult = await supabase.from("vacunas").insert({ ...vacForm, mascota_id: mascota.id }).select();
    if (insertResult.data) {
      const d = insertResult.data;
      setVacunas(function(prev) { return [d[0], ...prev]; });
    }
    setVacForm({ name: "", date: "", next_date: "", vet: "", notes: "" });
    setAddingVac(false);
  }

  async function addCita() {
    if (!citaForm.date.trim() || !citaForm.summary.trim() || !mascota) return;
    const entry = {
      mascota_id: mascota.id,
      title: "📅 Cita",
      date: citaForm.date,
      summary: citaForm.summary,
      vet: citaForm.vet,
    };
    const insertResult = await supabase.from("historial").insert(entry).select();
    if (insertResult.data) {
      const d = insertResult.data;
      setHistorial(function(prev) { return [d[0], ...prev]; });
    }
    setCitaForm({ date: "", summary: "", vet: "" });
    setAddingCita(false);
  }

  async function crearEstudioLink() {
    if (!mascota) return;
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;
    setCreatingLink(true);
    const insertResult = await supabase.from("estudio_links").insert({
      mascota_id: mascota.id,
      user_id: user.id,
      notes: linkNotes || null,
      active: true,
    }).select();
    const data = insertResult.data;
    if (data && data[0]) {
      const url = window.location.origin + "/estudio/" + data[0].id;
      setNewLink(url);
      setEstudioLinks(function(prev) { return [data[0], ...prev]; });
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(function() { setCopiedLink(false); }, 3000);
    }
    setLinkNotes("");
    setCreatingLink(false);
  }

  async function revocarLink(id: string) {
    await supabase.from("estudio_links").update({ active: false }).eq("id", id);
    setEstudioLinks(function(prev) { return prev.map(function(l) { return l.id === id ? { ...l, active: false } : l; }); });
  }

  function copyLink(id: string) {
    const url = window.location.origin + "/estudio/" + id;
    navigator.clipboard.writeText(url);
    setNewLink(url);
    setCopiedLink(true);
    setTimeout(function() { setCopiedLink(false); }, 3000);
  }

  async function addAlimentacion() {
    if (!mascota || (!alimentForm.marca && !alimentForm.tipo)) {
      showToast("Completá al menos la marca o el tipo de alimento", "error");
      return;
    }
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) return;
    const entry = {
      ...alimentForm,
      mascota_id: mascota.id,
      user_id: user.id,
      fecha: new Date().toLocaleDateString("es-AR"),
    };
    const insertResult = await supabase.from("alimentacion").insert(entry).select();
    if (insertResult.data) {
      const d = insertResult.data;
      setAlimentacion(function(prev) { return [d[0], ...prev]; });
    }
    setAlimentForm({ marca: "", tipo: "", cantidad: "", frecuencia: "", notas: "" });
    setAddingAliment(false);
  }

  async function pedirRecetas() {
    if (!mascota) return;
    setLoadingRecetas(true);
    setRecetas(null);
    const sessionResult = await supabase.auth.getSession();
    const session = sessionResult.data.session;

    const dietaActual = alimentacion.slice(0, 3).map(function(a: any) {
      const parts: string[] = [];
      if (a.marca) parts.push(a.marca);
      if (a.tipo) parts.push("(" + a.tipo + ")");
      if (a.cantidad) parts.push(a.cantidad);
      return parts.join(" ");
    }).join("; ") || "sin registros previos";

    const esGato = mascota.breed && mascota.breed.toLowerCase().includes("gato") ? "gatos" : "perros";
    const lines = [
      "Sugeri 3 recetas o planes de alimentacion casera saludable para " + mascota.name + ".",
      "",
      "Datos de la mascota:",
      "- Raza: " + (mascota.breed || "desconocida"),
      "- Edad: " + (mascota.age || "desconocida"),
      "- Peso: " + (mascota.weight || "desconocido"),
      "- Sexo: " + (mascota.sex || "desconocido"),
      "- Dieta actual: " + dietaActual,
      "",
      "Para cada receta inclui: nombre, ingredientes con cantidades, preparacion paso a paso, frecuencia y porcion recomendada, beneficios nutricionales.",
      "",
      "Finali con una nota sobre alimentos toxicos a evitar para " + esGato + ".",
      "Responde en espanol, con formato claro.",
    ];
    const prompt = lines.join("\n");

    const token = session ? session.access_token : "";
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
      body: JSON.stringify({
        system: "Sos un veterinario nutricionista especialista en mascotas. Das recetas caseras equilibradas y seguras.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    setRecetas(data.reply || "No se pudo generar recetas.");
    setLoadingRecetas(false);
  }

  async function generarLinkCompartido() {
    if (!mascota) return;
    setShareLoading(true);
    const sessionResult = await supabase.auth.getSession();
    const token = sessionResult.data.session?.access_token;
    const res = await fetch("/api/historial-compartido", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ mascota_id: mascota.id, days: shareDays, label: shareLabel || undefined }),
    });
    const data = await res.json();
    if (data.id) {
      const url = window.location.origin + "/historial/" + data.id;
      setShareLink(url);
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
    setShareLoading(false);
  }

  async function addEntry() {
    if (!form.title.trim() || !mascota) return;
    const insertResult = await supabase.from("historial").insert({ ...form, mascota_id: mascota.id }).select();
    if (insertResult.data) {
      const d = insertResult.data;
      setHistorial(function(prev) { return [d[0], ...prev]; });
    }
    setForm({ date: "", vet: "", title: "", summary: "" });
    setAdding(false);
  }

  async function deleteEntry(id: string) {
    await supabase.from("historial").delete().eq("id", id);
    setHistorial(prev => prev.filter((h: any) => h.id !== id));
    setConfirmDelete(null);
  }

  async function deleteVacunaEntry(id: string) {
    await supabase.from("vacunas").delete().eq("id", id);
    setVacunas(prev => prev.filter((v: any) => v.id !== id));
    setConfirmDelete(null);
  }

  async function deleteAlimentEntry(id: string) {
    await supabase.from("alimentacion").delete().eq("id", id);
    setAlimentacion(prev => prev.filter((a: any) => a.id !== id));
    setConfirmDelete(null);
  }

  async function reanalizar(h: any) {
    const parts: string[] = h.summary ? h.summary.split("||") : [];
    const firstPart = parts[0] || "";
    const splitFirst = firstPart.split("::");
    const fileName = splitFirst[0] || "";
    const pathOrUrl = splitFirst[1] || "";
    if (!pathOrUrl) return;
    setReanalyzingId(h.id);
    const publicUrl = pathOrUrl.startsWith("http") ? pathOrUrl : supabase.storage.from("documentos").getPublicUrl(pathOrUrl).data.publicUrl;
    const fileType = /\.(jpg|jpeg|png|webp)$/i.test(fileName) ? "image/jpeg" : "application/pdf";
    try {
      const res = await fetch("/api/analizar-estudio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ historialId: h.id, publicUrl, fileName, fileType }),
      });
      const data = await res.json();
      if (data.ok && data.aiSummary) {
        setHistorial(function(prev) {
          return prev.map(function(item: any) {
            if (item.id !== h.id) return item;
            const ps = (item.summary || "").split("||").filter((p: string) => !p.startsWith("ia::"));
            ps.push("ia::" + data.aiSummary);
            return { ...item, summary: ps.join("||") };
          });
        });
        showToast("Análisis completado", "success");
      } else {
        showToast("No se pudo analizar: " + (data.error || "error desconocido"), "error");
      }
    } catch {
      showToast("Error al analizar el estudio", "error");
    }
    setReanalyzingId(null);
  }

  async function handleFile(e: any) {
    const file = e.target.files && e.target.files[0];
    if (!file || !mascota) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("El archivo no puede superar los 10 MB", "error");
      if (e.target) e.target.value = "";
      return;
    }
    setUploading(true);

    const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-";
    const safeName = Array.from(file.name as string).map(function(c: any) {
      return allowed.includes(c) ? c : "_";
    }).join("");
    const path = mascota.id + "/" + Date.now() + "_" + safeName;

    const uploadResult = await supabase.storage.from("documentos").upload(path, file, { upsert: true });
    const error = uploadResult.error;

    if (!error) {
      const urlResult = supabase.storage.from("documentos").getPublicUrl(path);
      const publicUrl = urlResult.data.publicUrl;
      const entry = {
        mascota_id: mascota.id,
        title: selectedStudyType,
        summary: file.name + "::" + path,
        date: new Date().toLocaleDateString("es-AR"),
        vet: "",
      };
      const saved = await supabase.from("historial").insert(entry).select();
      if (saved.data) {
        const d = saved.data;
        const historialId = d[0].id;
        setHistorial(function(prev) { return [d[0], ...prev]; });
        showToast("Subiendo y analizando estudio...", "info");
        // Analizar con IA en background
        fetch("/api/analizar-estudio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ historialId, publicUrl, fileName: file.name, fileType: file.type }),
        }).then(async (res) => {
          const data = await res.json();
          if (data.ok && data.aiSummary) {
            setHistorial(function(prev) {
              return prev.map(function(h: any) {
                if (h.id !== historialId) return h;
                const parts = (h.summary || "").split("||").filter((p: string) => !p.startsWith("ia::"));
                parts.push("ia::" + data.aiSummary);
                return { ...h, summary: parts.join("||") };
              });
            });
            showToast("Estudio analizado correctamente", "success");
          } else {
            showToast("Estudio subido. El análisis IA no estuvo disponible.", "warning");
          }
        }).catch(function() {
          showToast("Estudio subido correctamente", "success");
        });
      } else {
        console.error("Insert error:", saved.error && saved.error.message);
        showToast("Archivo subido pero no se pudo registrar en el historial", "warning");
      }
    } else {
      console.error("Upload error:", error.message);
      if (error.message.includes("Bucket not found")) {
        showToast("El bucket 'documentos' no existe en Supabase Storage", "error");
      } else if (error.message.includes("row-level security") || error.message.includes("policy")) {
        showToast("Sin permisos de subida. Revisá las políticas del bucket en Supabase", "error");
      } else {
        showToast("Error al subir: " + error.message, "error");
      }
    }
    if (e.target) e.target.value = "";
    setUploading(false);
  }

  function getPublicUrl(pathOrUrl: string) {
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    const urlResult = supabase.storage.from("documentos").getPublicUrl(pathOrUrl);
    return urlResult.data.publicUrl;
  }

  function openDoc(pathOrUrl: string) {
    const url = getPublicUrl(pathOrUrl);
    window.open(url, "_blank");
  }

  function shareDoc(pathOrUrl: string, fileName: string) {
    const url = getPublicUrl(pathOrUrl);
    navigator.clipboard.writeText(url);
    showToast(`Link de "${fileName}" copiado`, "info");
  }

  if (!mascota && mascotas.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 0" }}>
      <div className="skeleton" style={{ height: 80, borderRadius: 16 }} />
      <div style={{ display: "flex", gap: 4 }}>
        {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ flex: 1, height: 36, borderRadius: 10 }} />)}
      </div>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)}
    </div>
  );

  return (
    <div className="history-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {mascota && (
        <div className="history-pet-card" style={{
          background: "#FFFFFF", border: "1px solid #B2E8E5", borderRadius: 16,
          padding: "14px 16px", marginBottom: mascotas.length > 1 ? 12 : 20,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <PetAvatar src={mascota.photo_url} breed={mascota.breed} size={52} fallbackFontSize={26} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, fontFamily: "Georgia, serif" }}>{mascota.name}</div>
            <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
              {mascota.breed} | {mascota.age} | {mascota.sex}
            </div>
          </div>
          <button onClick={() => { setShowShareModal(true); setShareLink(null); setShareLabel(""); setShareDays(7); }} style={{
            background: "#E5F7F6", color: "#2CB8AD", border: "1px solid #B2E8E5",
            borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 800,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            Compartir
          </button>
        </div>
      )}

      {mascotas.length > 1 && (
        <div className="history-pet-switcher" style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {mascotas.map(function(m) {
            const isSelected = mascota && mascota.id === m.id;
            return (
              <button key={m.id} onClick={function() { selectMascota(m); }} style={{
                background: isSelected ? "#E5F7F6" : "#FFFFFF",
                border: "1px solid " + (isSelected ? "#2CB8AD" : "#E2E8F0"),
                borderRadius: 20, padding: "6px 14px",
                color: isSelected ? "#2CB8AD" : "#64748B",
                fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <PetAvatar src={m.photo_url} breed={m.breed} size={18} fallbackFontSize={13} style={{ border: "none" }} />
                {m.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="history-tabs" style={{ display: "flex", gap: 4, marginBottom: 16, background: "#F4F6FB", borderRadius: 12, padding: 4, overflowX: "auto" }}>
        {HIST_TABS.map(function(key) {
          const counts: Record<string, number> = {
            consultas: historial.filter(function(h: any) { return !isDoc(h) && h.title !== "📅 Cita"; }).length,
            estudios: historial.filter(function(h: any) { return isDoc(h); }).length,
            vacunas: vacunas.length,
            turnos: historial.filter(function(h: any) { return h.title === "📅 Cita"; }).length,
            alimentacion: alimentacion.length,
          };
          const count = counts[key] || 0;
          return (
            <button key={key} onClick={function() { setHistTab(key); }} style={{
              flex: "0 0 auto", border: "none", borderRadius: 10, padding: "7px 10px",
              background: histTab === key ? "#E2E8F0" : "transparent",
              color: histTab === key ? "#1C3557" : "#64748B",
              fontWeight: 700, fontSize: 11, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap",
            }}>
              {HIST_TAB_LABELS[key]}
              {count > 0 && (
                <span style={{
                  background: histTab === key ? "#2CB8AD" : "#CBD5E1",
                  color: "#fff", borderRadius: 20, padding: "1px 5px",
                  fontSize: 10, fontWeight: 800, lineHeight: 1.4,
                }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {histTab === "consultas" && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Consultas</h2>
            <button onClick={function() { setAdding(!adding); }} style={{
              background: "#E5F7F6", color: "#2CB8AD", border: "1px solid #B2E8E5",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Agregar</button>
          </div>
          <input
            placeholder="Buscar por título, veterinario o descripción..."
            value={searchConsultas}
            onChange={e => setSearchConsultas(e.target.value)}
            style={{ width: "100%", fontSize: 13 }}
          />
        </div>
      )}

      {histTab === "consultas" && adding && (
        <Card style={{ border: "1px solid #B2E8E5" }}>
          <div style={{ fontWeight: 700, color: "#2CB8AD", marginBottom: 12 }}>Nueva consulta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Titulo (ej: Control anual)" value={form.title} onChange={function(e) { setForm(function(f) { return { ...f, title: e.target.value }; }); }} />
            <input placeholder="Veterinario/a" value={form.vet} onChange={function(e) { setForm(function(f) { return { ...f, vet: e.target.value }; }); }} />
            <input placeholder="Fecha (ej: 15 Ene 2025)" value={form.date} onChange={function(e) { setForm(function(f) { return { ...f, date: e.target.value }; }); }} />
            <textarea placeholder="Resumen de la consulta..." rows={3} value={form.summary}
              onChange={function(e) { setForm(function(f) { return { ...f, summary: e.target.value }; }); }}
              style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", resize: "none" }} />
            <button onClick={addEntry} style={{
              background: "#2CB8AD", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800,
            }}>Guardar</button>
          </div>
        </Card>
      )}

      {histTab === "consultas" && (() => {
        const q = searchConsultas.toLowerCase();
        const consultasFiltradas = historial.filter(function(h: any) {
          if (isDoc(h) || h.title === "📅 Cita") return false;
          if (!q) return true;
          return (
            h.title?.toLowerCase().includes(q) ||
            h.vet?.toLowerCase().includes(q) ||
            h.summary?.toLowerCase().includes(q) ||
            h.date?.toLowerCase().includes(q)
          );
        });
        if (consultasFiltradas.length === 0 && !adding) return (
          <Card style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
            <p style={{ color: "#64748B", fontSize: 13 }}>
              {q ? `Sin resultados para "${searchConsultas}".` : "Todavía no hay consultas registradas. Agregá la primera."}
            </p>
          </Card>
        );
        return null;
      })()}

      {histTab === "consultas" && historial.filter(function(h: any) {
        if (isDoc(h) || h.title === "📅 Cita") return false;
        const q = searchConsultas.toLowerCase();
        if (!q) return true;
        return (
          h.title?.toLowerCase().includes(q) ||
          h.vet?.toLowerCase().includes(q) ||
          h.summary?.toLowerCase().includes(q) ||
          h.date?.toLowerCase().includes(q)
        );
      }).map(function(h: any, i: number) {
        const isDeleting = confirmDelete?.id === h.id;
        return (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{h.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {h.date && <Badge>{h.date}</Badge>}
                <button onClick={() => setConfirmDelete(isDeleting ? null : { type: "consulta", id: h.id })} style={{
                  background: "none", border: "none", color: "#CBD5E1",
                  fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                }}>🗑</button>
              </div>
            </div>
            {isDeleting && (
              <div style={{ background: "#FFF0F0", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#EF4444", flex: 1 }}>¿Eliminar esta consulta?</span>
                <button onClick={() => deleteEntry(h.id)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                <button onClick={() => setConfirmDelete(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>No</button>
              </div>
            )}
            {h.vet && <div style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>{h.vet}</div>}
            {h.summary && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{h.summary}</div>}
          </Card>
        );
      })}

      {histTab === "vacunas" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Vacunas y Aplicaciones</h2>
            <button onClick={function() { setAddingVac(!addingVac); }} style={{
              background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Agregar</button>
          </div>

          {addingVac && (
            <Card style={{ border: "1px solid #BFDBFE" }}>
              <div style={{ fontWeight: 700, color: "#3B82F6", marginBottom: 12 }}>Nueva vacuna / aplicacion</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre de la vacuna (ej: Antirrábica)" value={vacForm.name}
                  onChange={function(e) { setVacForm(function(f) { return { ...f, name: e.target.value }; }); }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#64748B", display: "block", marginBottom: 4 }}>Fecha de aplicacion *</label>
                    <input type="date" value={vacForm.date}
                      onChange={function(e) { setVacForm(function(f) { return { ...f, date: e.target.value }; }); }}
                      style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#64748B", display: "block", marginBottom: 4 }}>Proxima aplicacion</label>
                    <input type="date" value={vacForm.next_date}
                      onChange={function(e) { setVacForm(function(f) { return { ...f, next_date: e.target.value }; }); }}
                      style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557" }} />
                  </div>
                </div>
                <input placeholder="Veterinario/a" value={vacForm.vet}
                  onChange={function(e) { setVacForm(function(f) { return { ...f, vet: e.target.value }; }); }} />
                <input placeholder="Notas (lote, marca, reaccion...)" value={vacForm.notes}
                  onChange={function(e) { setVacForm(function(f) { return { ...f, notes: e.target.value }; }); }} />
                <button onClick={addVacuna} style={{
                  background: "#3B82F6", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Guardar</button>
              </div>
            </Card>
          )}

          {vacunas.length === 0 && !addingVac && (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💉</div>
              <p style={{ color: "#64748B", fontSize: 13 }}>No hay vacunas registradas. Agregá la primera.</p>
            </Card>
          )}

          {vacunas.map(function(v: any, i: number) {
            const today = new Date().toISOString().slice(0, 10);
            const vencida = v.next_date && v.next_date < today;
            const proxima = v.next_date && !vencida;
            const isDeletingVac = confirmDelete?.id === v.id;
            return (
              <Card key={i} style={{ border: "1px solid #EFF6FF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>💉 {v.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {vencida
                      ? <span style={{ background: "#FFF0F0", color: "#EF4444", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800 }}>VENCIDA</span>
                      : proxima
                      ? <span style={{ background: "#E5F7F6", color: "#2CB8AD", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800 }}>Al dia</span>
                      : null
                    }
                    <button onClick={() => setConfirmDelete(isDeletingVac ? null : { type: "vacuna", id: v.id })} style={{
                      background: "none", border: "none", color: "#CBD5E1",
                      fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                    }}>🗑</button>
                  </div>
                </div>
                {isDeletingVac && (
                  <div style={{ background: "#FFF0F0", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#EF4444", flex: 1 }}>¿Eliminar esta vacuna?</span>
                    <button onClick={() => deleteVacunaEntry(v.id)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>No</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  {v.date && (
                    <span style={{ background: "#EFF6FF", color: "#3B82F6", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      Aplicada: {v.date}
                    </span>
                  )}
                  {v.next_date && (
                    <span style={{ background: vencida ? "#FFF0F0" : "#E5F7F6", color: vencida ? "#EF4444" : "#2CB8AD", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      Proxima: {v.next_date}
                    </span>
                  )}
                </div>
                {v.vet && <div style={{ color: "#64748B", fontSize: 12 }}>Dr/a. {v.vet}</div>}
                {v.notes && <div style={{ color: "#64748B", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>{v.notes}</div>}
              </Card>
            );
          })}
        </div>
      )}

      {histTab === "turnos" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Turnos y Citas</h2>
            <button onClick={function() { setAddingCita(!addingCita); }} style={{
              background: "#F5F3FF", color: "#8B5CF6", border: "1px solid #DDD6FE",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Agendar</button>
          </div>

          {addingCita && (
            <Card style={{ border: "1px solid #DDD6FE" }}>
              <div style={{ fontWeight: 700, color: "#8B5CF6", marginBottom: 12 }}>Nuevo turno</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#64748B", display: "block", marginBottom: 4 }}>Fecha del turno *</label>
                  <input type="date" value={citaForm.date}
                    onChange={function(e) { setCitaForm(function(f) { return { ...f, date: e.target.value }; }); }}
                    style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557" }} />
                </div>
                <input placeholder="Motivo (ej: Control anual, castración)" value={citaForm.summary}
                  onChange={function(e) { setCitaForm(function(f) { return { ...f, summary: e.target.value }; }); }} />
                <input placeholder="Veterinario / Clinica" value={citaForm.vet}
                  onChange={function(e) { setCitaForm(function(f) { return { ...f, vet: e.target.value }; }); }} />
                <button onClick={addCita} style={{
                  background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Guardar turno</button>
              </div>
            </Card>
          )}

          {historial.filter(function(h) { return h.title === "📅 Cita"; }).length === 0 && !addingCita && (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
              <p style={{ color: "#64748B", fontSize: 13 }}>No hay turnos agendados.</p>
            </Card>
          )}

          {historial.filter(function(h) { return h.title === "📅 Cita"; })
            .sort(function(a, b) { return a.date > b.date ? 1 : -1; })
            .map(function(c: any, i: number) {
            const today = new Date().toISOString().slice(0, 10);
            const pasado = c.date < today;
            return (
              <Card key={i} style={{ border: pasado ? "1px solid #E2E8F0" : "1px solid #DDD6FE" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>📅 {c.summary}</span>
                  <span style={{
                    background: pasado ? "#E2E8F0" : "#F5F3FF",
                    color: pasado ? "#64748B" : "#8B5CF6",
                    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                  }}>{c.date}</span>
                </div>
                {c.vet && <div style={{ color: "#64748B", fontSize: 12 }}>Dr/a. {c.vet}</div>}
                {pasado && <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>Turno pasado</div>}
              </Card>
            );
          })}
        </div>
      )}

      {histTab === "alimentacion" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Alimentacion</h2>
            <button onClick={function() { setAddingAliment(!addingAliment); }} style={{
              background: "#FFF7ED", color: "#F97316", border: "1px solid #FED7AA",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Registrar</button>
          </div>

          {addingAliment && (
            <Card style={{ border: "1px solid #FED7AA" }}>
              <div style={{ fontWeight: 700, color: "#F97316", marginBottom: 12 }}>Nuevo registro de alimentacion</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Marca del alimento (ej: Royal Canin)" value={alimentForm.marca} onChange={function(e) { setAlimentForm(function(f) { return { ...f, marca: e.target.value }; }); }} />
                <input placeholder="Tipo (ej: Croquetas, Humedo, BARF, Casero)" value={alimentForm.tipo} onChange={function(e) { setAlimentForm(function(f) { return { ...f, tipo: e.target.value }; }); }} />
                <input placeholder="Cantidad diaria (ej: 200g manana y noche)" value={alimentForm.cantidad} onChange={function(e) { setAlimentForm(function(f) { return { ...f, cantidad: e.target.value }; }); }} />
                <input placeholder="Frecuencia (ej: 2 veces por dia)" value={alimentForm.frecuencia} onChange={function(e) { setAlimentForm(function(f) { return { ...f, frecuencia: e.target.value }; }); }} />
                <textarea placeholder="Notas adicionales..." rows={2} value={alimentForm.notas}
                  onChange={function(e) { setAlimentForm(function(f) { return { ...f, notas: e.target.value }; }); }}
                  style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", resize: "none" }} />
                <button onClick={addAlimentacion} style={{
                  background: "#F97316", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Guardar</button>
              </div>
            </Card>
          )}

          {alimentacion.length === 0 && !addingAliment && (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🍖</div>
              <p style={{ color: "#64748B", fontSize: 13 }}>Sin registros de alimentacion. Registra que come {mascota && mascota.name}.</p>
            </Card>
          )}

          {alimentacion.map(function(a: any, i: number) {
            const isDeletingAlim = confirmDelete?.id === a.id;
            return (
              <Card key={i} style={{ border: "1px solid #FFF7ED" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{a.marca || "Sin marca"}</div>
                    <div style={{ color: "#F97316", fontSize: 12, fontWeight: 700, marginTop: 2 }}>{a.tipo}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748B" }}>{a.fecha}</span>
                    <button onClick={() => setConfirmDelete(isDeletingAlim ? null : { type: "aliment", id: a.id })} style={{
                      background: "none", border: "none", color: "#CBD5E1",
                      fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                    }}>🗑</button>
                  </div>
                </div>
                {isDeletingAlim && (
                  <div style={{ background: "#FFF0F0", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#EF4444", flex: 1 }}>¿Eliminar este registro?</span>
                    <button onClick={() => deleteAlimentEntry(a.id)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>No</button>
                  </div>
                )}
                {a.cantidad && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <span style={{ background: "#FFF7ED", color: "#F97316", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {a.cantidad}
                    </span>
                    {a.frecuencia && (
                      <span style={{ background: "#EFF6FF", color: "#3B82F6", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                        {a.frecuencia}
                      </span>
                    )}
                  </div>
                )}
                {a.notas && <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, fontStyle: "italic" }}>{a.notas}</div>}
              </Card>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <button onClick={pedirRecetas} disabled={loadingRecetas} style={{
              width: "100%", background: loadingRecetas ? "#E2E8F0" : "linear-gradient(135deg, #F97316, #EA580C)",
              color: loadingRecetas ? "#64748B" : "#000", border: "none", borderRadius: 12, padding: 14,
              fontWeight: 900, fontSize: 14, cursor: "pointer", opacity: loadingRecetas ? 0.7 : 1,
              boxShadow: loadingRecetas ? "none" : "0 4px 20px rgba(249,115,22,0.2)",
            }}>
              {loadingRecetas ? "Generando recetas..." : "Recetas caseras recomendadas por IA"}
            </button>
          </div>

          {recetas && (
            <Card style={{ border: "1px solid #FED7AA", marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#F97316" }}>Recetas para {mascota && mascota.name}</div>
                <button onClick={function() { setRecetas(null); }} style={{
                  background: "transparent", border: "none", color: "#64748B",
                  fontSize: 18, cursor: "pointer", lineHeight: 1,
                }}>x</button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "#1C3557", whiteSpace: "pre-wrap" }}>
                {recetas.split("**").join("")}
              </div>
            </Card>
          )}
        </div>
      )}

      {histTab === "estudios" && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Subir estudio
          </div>
          <Card style={{ border: "2px dashed #E2E8F0" }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6 }}>Tipo de estudio</label>
              <select
                value={selectedStudyType}
                onChange={function(e) { setSelectedStudyType(e.target.value); }}
                style={{ width: "100%", background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", fontSize: 13, fontWeight: 700 }}
              >
                {STUDY_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
              </select>
            </div>
            <label style={{ cursor: "pointer", display: "block", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
              <div style={{ color: "#64748B", fontSize: 13, marginBottom: 10 }}>PDF, imagen o documento (max 10 MB)</div>
              <div style={{
                background: "#E5F7F6", color: "#2CB8AD", border: "1px solid #B2E8E5",
                borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700, display: "inline-block",
              }}>{uploading ? "Subiendo..." : "Seleccionar archivo"}</div>
              <input type="file" style={{ display: "none" }} onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </label>
          </Card>

          <div style={{ fontSize: 11, fontWeight: 800, color: "#3B82F6", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>
            Compartir link con la veterinaria
          </div>

          {newLink && (
            <Card style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#3B82F6", marginBottom: 8 }}>
                {copiedLink ? "Link copiado!" : "Link para la veterinaria"}
              </div>
              <div style={{ background: "#F4F6FB", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#64748B", wordBreak: "break-all", marginBottom: 10 }}>
                {newLink}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { navigator.clipboard.writeText(newLink); setCopiedLink(true); setTimeout(function() { setCopiedLink(false); }, 3000); }} style={{
                  flex: 1, background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE",
                  borderRadius: 10, padding: 10, fontWeight: 800, fontSize: 13, cursor: "pointer",
                }}>Copiar</button>
                <a href={"https://wa.me/?text=Te%20comparto%20el%20link%20para%20subir%20los%20estudios%20de%20" + encodeURIComponent(mascota ? mascota.name : "") + "%20a%20PetPass%3A%20" + encodeURIComponent(newLink)}
                  target="_blank" rel="noreferrer" style={{
                    flex: 1, background: "#E5F7F6", color: "#2CB8AD", border: "1px solid #B2E8E5",
                    borderRadius: 10, padding: 10, fontWeight: 800, fontSize: 13, cursor: "pointer",
                    textDecoration: "none", textAlign: "center", display: "block",
                  }}>WhatsApp</a>
              </div>
            </Card>
          )}

          <Card style={{ border: "1px solid #EFF6FF" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#3B82F6", marginBottom: 10 }}>Nuevo link para veterinaria</div>
            <input
              placeholder="Indicaciones para el vet (opcional)"
              value={linkNotes}
              onChange={function(e) { setLinkNotes(e.target.value); }}
              style={{ marginBottom: 10 }}
            />
            <button onClick={crearEstudioLink} disabled={creatingLink} style={{
              width: "100%", background: "#3B82F6", color: "#fff", border: "none",
              borderRadius: 10, padding: 12, fontWeight: 800, fontSize: 14, cursor: "pointer",
              opacity: creatingLink ? 0.6 : 1,
            }}>{creatingLink ? "Generando..." : "Generar link y copiar"}</button>
          </Card>

          {estudioLinks.filter(function(l) { return l.active; }).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Links activos</div>
              {estudioLinks.filter(function(l) { return l.active; }).map(function(l: any) {
                return (
                  <div key={l.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#1C3557", fontWeight: 700 }}>{l.notes || "Sin indicaciones"}</div>
                      <div style={{ fontSize: 11, color: "#64748B" }}>{new Date(l.created_at).toLocaleDateString("es-AR")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={function() { copyLink(l.id); }} style={{
                        background: "#EFF6FF", color: "#3B82F6", border: "none",
                        borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>Copiar</button>
                      <button onClick={function() { revocarLink(l.id); }} style={{
                        background: "#FFF0F0", color: "#EF4444", border: "none",
                        borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>Revocar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {historial.filter(function(h: any) { return isDoc(h); }).length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>
              Estudios guardados
            </div>
          )}
          {historial.filter(function(h: any) { return isDoc(h); }).map(function(h: any, i: number) {
            const parts: string[] = h.summary ? h.summary.split("||") : [];
            const firstPart = parts[0] || "";
            const splitFirst = firstPart.split("::");
            const name = splitFirst[0] || "";
            const pathOrUrl = splitFirst[1] || "";
            const vetNotePart = parts.find(function(p: string) { return p.startsWith("nota::"); });
            const vetNote = vetNotePart ? vetNotePart.replace("nota::", "") : null;
            const iaTextPart = parts.find(function(p: string) { return p.startsWith("ia::"); });
            const iaText = iaTextPart ? iaTextPart.replace("ia::", "") : null;
            const isDeleting = confirmDelete?.id === h.id;
            return (
              <Card key={i} style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{h.title ? h.title.split(" ")[0] : "📄"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                        {h.title && h.title !== "📄 Documento" ? h.title : (name || "Documento")}
                      </div>
                      <button onClick={() => setConfirmDelete(isDeleting ? null : { type: "estudio", id: h.id })} style={{
                        background: "none", border: "none", color: "#CBD5E1",
                        fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0,
                      }}>🗑</button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#64748B" }}>{h.date}</span>
                      {h.vet && h.vet !== "" && (
                        <span style={{ background: "#EFF6FF", color: "#3B82F6", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                          {h.vet}
                        </span>
                      )}
                    </div>
                    {vetNote && (
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 4, fontStyle: "italic" }}>{vetNote}</div>
                    )}
                    {iaText && (
                      <div style={{ marginTop: 6, background: "#F4F6FB", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#2CB8AD", lineHeight: 1.5 }}>
                        {iaText.length > 120 ? iaText.slice(0, 120) + "..." : iaText}
                      </div>
                    )}
                  </div>
                </div>
                {isDeleting && (
                  <div style={{ background: "#FFF0F0", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", margin: "10px 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#EF4444", flex: 1 }}>¿Eliminar este estudio?</span>
                    <button onClick={() => deleteEntry(h.id)} style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                    <button onClick={() => setConfirmDelete(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>No</button>
                  </div>
                )}
                {!iaText && (
                  <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "6px 10px", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "#92400E" }}>Sin análisis IA</span>
                    <button onClick={() => reanalizar(h)} disabled={reanalyzingId === h.id} style={{
                      background: "#F59E0B", color: "#fff", border: "none",
                      borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800,
                      cursor: "pointer", opacity: reanalyzingId === h.id ? 0.6 : 1,
                    }}>{reanalyzingId === h.id ? "Analizando..." : "Re-analizar"}</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button onClick={function() { openDoc(pathOrUrl); }} style={{
                    flex: 1, background: "#E5F7F6", color: "#2CB8AD", border: "1px solid #B2E8E5",
                    borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}>Ver</button>
                  <button onClick={function() { shareDoc(pathOrUrl, name); }} style={{
                    flex: 1, background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE",
                    borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}>Compartir</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Compartir con veterinario */}
      {showShareModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setShowShareModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px",
            width: "100%", maxWidth: 400,
            boxShadow: "0 8px 48px rgba(28,53,87,0.18)",
          }} onClick={e => e.stopPropagation()}>
            {shareLink ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🔗</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1C3557", marginBottom: 8 }}>
                  Link generado
                </h3>
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                  Válido por {shareDays} día{shareDays > 1 ? "s" : ""}. Compartilo con tu veterinario.
                </p>
                <div style={{
                  background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10,
                  padding: "10px 14px", fontSize: 12, color: "#1C3557",
                  wordBreak: "break-all", marginBottom: 14, textAlign: "left",
                }}>
                  {shareLink}
                </div>
                <button onClick={() => { navigator.clipboard.writeText(shareLink); setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); }} style={{
                  width: "100%", background: shareCopied ? "#E5F7F6" : "linear-gradient(135deg,#2CB8AD,#229E94)",
                  color: shareCopied ? "#2CB8AD" : "#fff", border: shareCopied ? "1px solid #B2E8E5" : "none",
                  borderRadius: 12, padding: "12px 20px", fontWeight: 900, fontSize: 14, cursor: "pointer", marginBottom: 10,
                }}>
                  {shareCopied ? "✅ Link copiado" : "Copiar link"}
                </button>
                <button onClick={() => setShowShareModal(false)} style={{
                  width: "100%", background: "none", border: "none",
                  color: "#94A3B8", fontSize: 13, cursor: "pointer",
                }}>Cerrar</button>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "#1C3557", marginBottom: 6 }}>
                  Compartir historial con el veterinario
                </h3>
                <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                  Generás un link de solo lectura con el historial completo de <strong>{mascota?.name}</strong>.
                  El veterinario lo puede abrir sin crear cuenta.
                </p>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>Duración del link</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 7, 30].map(d => (
                      <button key={d} onClick={() => setShareDays(d)} style={{
                        flex: 1, background: shareDays === d ? "#E5F7F6" : "#F4F6FB",
                        border: `1px solid ${shareDays === d ? "#2CB8AD" : "#E2E8F0"}`,
                        borderRadius: 10, padding: "8px 4px", fontSize: 12,
                        fontWeight: 800, color: shareDays === d ? "#2CB8AD" : "#64748B",
                        cursor: "pointer",
                      }}>
                        {d === 1 ? "1 día" : d === 7 ? "7 días" : "30 días"}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  placeholder="Nota para el veterinario (opcional)"
                  value={shareLabel}
                  onChange={e => setShareLabel(e.target.value)}
                  style={{ marginBottom: 16 }}
                />

                <button onClick={generarLinkCompartido} disabled={shareLoading} style={{
                  width: "100%", background: shareLoading ? "#E2E8F0" : "linear-gradient(135deg,#2CB8AD,#229E94)",
                  color: shareLoading ? "#64748B" : "#fff", border: "none",
                  borderRadius: 12, padding: "13px 20px", fontWeight: 900, fontSize: 14,
                  cursor: shareLoading ? "not-allowed" : "pointer", marginBottom: 10,
                }}>
                  {shareLoading ? "Generando..." : "Generar link"}
                </button>
                <button onClick={() => setShowShareModal(false)} style={{
                  width: "100%", background: "none", border: "none",
                  color: "#94A3B8", fontSize: 13, cursor: "pointer",
                }}>Cancelar</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
