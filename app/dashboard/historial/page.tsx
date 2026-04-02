"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

function Card({ children, style = {} }: any) {
  return (
    <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function Badge({ children, color = "#60a5fa" }: any) {
  const border = "1px solid " + color + "44";
  const bg = color + "22";
  return (
    <span style={{ background: bg, color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, border }}>
      {children}
    </span>
  );
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

const HIST_TABS = ["consultas", "vacunas", "turnos", "alimentacion", "documentos"];
const HIST_TAB_LABELS: Record<string, string> = {
  consultas: "Clinica",
  vacunas: "Vacunas",
  turnos: "Turnos",
  alimentacion: "Alimento",
  documentos: "Docs",
};

export default function Historial() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [alimentacion, setAlimentacion] = useState<any[]>([]);
  const [estudioLinks, setEstudioLinks] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
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
  const supabase = createClient();

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
    setCitas([]);
    setAlimentacion([]);
    setEstudioLinks([]);
    setNewLink(null);
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    const [histResult, vacResult, citasResult, alimResult, linksResult] = await Promise.all([
      supabase.from("historial").select("*").eq("mascota_id", m.id).order("created_at", { ascending: false }),
      supabase.from("vacunas").select("*").eq("mascota_id", m.id).order("date", { ascending: false }),
      supabase.from("citas").select("*").eq("mascota_id", m.id).order("date", { ascending: true }),
      supabase.from("alimentacion").select("*").eq("mascota_id", m.id).order("created_at", { ascending: false }),
      supabase.from("estudio_links").select("*").eq("mascota_id", m.id).eq("user_id", user!.id).order("created_at", { ascending: false }),
    ]);
    setHistorial(histResult.data || []);
    setVacunas(vacResult.data || []);
    setCitas(citasResult.data || []);
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
    const insertResult = await supabase.from("citas").insert({ ...citaForm, mascota_id: mascota.id }).select();
    if (insertResult.data) {
      const d = insertResult.data;
      setCitas(function(prev) {
        const next = [...prev, d[0]];
        return next.sort(function(a, b) { return a.date > b.date ? 1 : -1; });
      });
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
      alert("Completa al menos la marca o el tipo de alimento");
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

  async function handleFile(e: any) {
    const file = e.target.files && e.target.files[0];
    if (!file || !mascota) return;
    setUploading(true);

    const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-";
    const safeName = Array.from(file.name as string).map(function(c: any) {
      return allowed.includes(c) ? c : "_";
    }).join("");
    const path = mascota.id + "/" + Date.now() + "_" + safeName;

    const uploadResult = await supabase.storage.from("documentos").upload(path, file, { upsert: true });
    const error = uploadResult.error;

    if (!error) {
      const entry = {
        mascota_id: mascota.id,
        title: detectStudyType(file.name),
        summary: file.name + "::" + path,
        date: new Date().toLocaleDateString("es-AR"),
        vet: "",
      };
      const saved = await supabase.from("historial").insert(entry).select();
      if (saved.data) {
        const d = saved.data;
        setHistorial(function(prev) { return [d[0], ...prev]; });
      } else {
        console.error("Insert error:", saved.error && saved.error.message);
        alert("Archivo subido pero no se pudo registrar en el historial.");
      }
    } else {
      console.error("Upload error:", error.message);
      if (error.message.includes("Bucket not found")) {
        alert("El bucket documentos no existe. Crealo en Supabase -> Storage.");
      } else if (error.message.includes("row-level security") || error.message.includes("policy")) {
        alert("Sin permisos. Revisa las politicas del bucket documentos en Supabase -> Storage -> Policies.");
      } else {
        alert("Error al subir: " + error.message);
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
    alert("Link de " + fileName + " copiado al portapapeles.");
  }

  return (
    <div>
      {mascota && (
        <div style={{
          background: "#181c27", border: "1px solid #4ade8033", borderRadius: 16,
          padding: "14px 16px", marginBottom: mascotas.length > 1 ? 12 : 20,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "#252a3a", border: "2px solid #4ade8044",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {mascota.photo_url
              ? <img src={mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 26 }}>{mascota.breed && mascota.breed.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, fontFamily: "Georgia, serif" }}>{mascota.name}</div>
            <div style={{ color: "#7a8299", fontSize: 12, marginTop: 2 }}>
              {mascota.breed} | {mascota.age} | {mascota.sex}
            </div>
          </div>
          <span style={{
            background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
            borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 800,
          }}>Historia clinica</span>
        </div>
      )}

      {mascotas.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {mascotas.map(function(m) {
            const isSelected = mascota && mascota.id === m.id;
            return (
              <button key={m.id} onClick={function() { selectMascota(m); }} style={{
                background: isSelected ? "#4ade8022" : "#181c27",
                border: "1px solid " + (isSelected ? "#4ade80" : "#252a3a"),
                borderRadius: 20, padding: "6px 14px",
                color: isSelected ? "#4ade80" : "#7a8299",
                fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {m.photo_url
                  ? <img src={m.photo_url} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                  : <span>{m.breed && m.breed.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
                }
                {m.name}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "#0f1117", borderRadius: 12, padding: 4 }}>
        {HIST_TABS.map(function(key) {
          return (
            <button key={key} onClick={function() { setHistTab(key); }} style={{
              flex: 1, border: "none", borderRadius: 10, padding: "7px 4px",
              background: histTab === key ? "#252a3a" : "transparent",
              color: histTab === key ? "#f0f4ff" : "#7a8299",
              fontWeight: 700, fontSize: 11, cursor: "pointer",
            }}>{HIST_TAB_LABELS[key]}</button>
          );
        })}
      </div>

      {histTab === "consultas" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Consultas</h2>
          <button onClick={function() { setAdding(!adding); }} style={{
            background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
            borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>+ Agregar</button>
        </div>
      )}

      {histTab === "consultas" && adding && (
        <Card style={{ border: "1px solid #4ade8044" }}>
          <div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 12 }}>Nueva consulta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Titulo (ej: Control anual)" value={form.title} onChange={function(e) { setForm(function(f) { return { ...f, title: e.target.value }; }); }} />
            <input placeholder="Veterinario/a" value={form.vet} onChange={function(e) { setForm(function(f) { return { ...f, vet: e.target.value }; }); }} />
            <input placeholder="Fecha (ej: 15 Ene 2025)" value={form.date} onChange={function(e) { setForm(function(f) { return { ...f, date: e.target.value }; }); }} />
            <textarea placeholder="Resumen de la consulta..." rows={3} value={form.summary}
              onChange={function(e) { setForm(function(f) { return { ...f, summary: e.target.value }; }); }}
              style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff", resize: "none" }} />
            <button onClick={addEntry} style={{
              background: "#4ade80", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 800,
            }}>Guardar</button>
          </div>
        </Card>
      )}

      {histTab === "consultas" && historial.filter(function(h: any) { return !isDoc(h) && h.title !== "📅 Cita"; }).length === 0 && !adding && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
          <p style={{ color: "#7a8299", fontSize: 13 }}>Todavia no hay consultas registradas. Agrega la primera.</p>
        </Card>
      )}

      {histTab === "consultas" && historial.filter(function(h: any) { return !isDoc(h) && h.title !== "📅 Cita"; }).map(function(h: any, i: number) {
        return (
          <Card key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{h.title}</span>
              {h.date && <Badge>{h.date}</Badge>}
            </div>
            {h.vet && <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 4 }}>{h.vet}</div>}
            {h.summary && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{h.summary}</div>}
          </Card>
        );
      })}

      {histTab === "vacunas" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Vacunas y Aplicaciones</h2>
            <button onClick={function() { setAddingVac(!addingVac); }} style={{
              background: "#60a5fa22", color: "#60a5fa", border: "1px solid #60a5fa44",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Agregar</button>
          </div>

          {addingVac && (
            <Card style={{ border: "1px solid #60a5fa44" }}>
              <div style={{ fontWeight: 700, color: "#60a5fa", marginBottom: 12 }}>Nueva vacuna / aplicacion</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre de la vacuna (ej: Antirrábica)" value={vacForm.name}
                  onChange={function(e) { setVacForm(function(f) { return { ...f, name: e.target.value }; }); }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#7a8299", display: "block", marginBottom: 4 }}>Fecha de aplicacion *</label>
                    <input type="date" value={vacForm.date}
                      onChange={function(e) { setVacForm(function(f) { return { ...f, date: e.target.value }; }); }}
                      style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#7a8299", display: "block", marginBottom: 4 }}>Proxima aplicacion</label>
                    <input type="date" value={vacForm.next_date}
                      onChange={function(e) { setVacForm(function(f) { return { ...f, next_date: e.target.value }; }); }}
                      style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff" }} />
                  </div>
                </div>
                <input placeholder="Veterinario/a" value={vacForm.vet}
                  onChange={function(e) { setVacForm(function(f) { return { ...f, vet: e.target.value }; }); }} />
                <input placeholder="Notas (lote, marca, reaccion...)" value={vacForm.notes}
                  onChange={function(e) { setVacForm(function(f) { return { ...f, notes: e.target.value }; }); }} />
                <button onClick={addVacuna} style={{
                  background: "#60a5fa", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Guardar</button>
              </div>
            </Card>
          )}

          {vacunas.length === 0 && !addingVac && (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💉</div>
              <p style={{ color: "#7a8299", fontSize: 13 }}>No hay vacunas registradas. Agrega la primera.</p>
            </Card>
          )}

          {vacunas.map(function(v: any, i: number) {
            const today = new Date().toISOString().slice(0, 10);
            const vencida = v.next_date && v.next_date < today;
            const proxima = v.next_date && !vencida;
            return (
              <Card key={i} style={{ border: "1px solid #60a5fa22" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>💉 {v.name}</div>
                  {vencida
                    ? <span style={{ background: "#f8717122", color: "#f87171", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800 }}>VENCIDA</span>
                    : proxima
                    ? <span style={{ background: "#4ade8022", color: "#4ade80", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800 }}>Al dia</span>
                    : null
                  }
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  {v.date && (
                    <span style={{ background: "#60a5fa22", color: "#60a5fa", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      Aplicada: {v.date}
                    </span>
                  )}
                  {v.next_date && (
                    <span style={{ background: vencida ? "#f8717122" : "#4ade8022", color: vencida ? "#f87171" : "#4ade80", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      Proxima: {v.next_date}
                    </span>
                  )}
                </div>
                {v.vet && <div style={{ color: "#7a8299", fontSize: 12 }}>Dr/a. {v.vet}</div>}
                {v.notes && <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>{v.notes}</div>}
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
              background: "#a78bfa22", color: "#a78bfa", border: "1px solid #a78bfa44",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Agendar</button>
          </div>

          {addingCita && (
            <Card style={{ border: "1px solid #a78bfa44" }}>
              <div style={{ fontWeight: 700, color: "#a78bfa", marginBottom: 12 }}>Nuevo turno</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#7a8299", display: "block", marginBottom: 4 }}>Fecha del turno *</label>
                  <input type="date" value={citaForm.date}
                    onChange={function(e) { setCitaForm(function(f) { return { ...f, date: e.target.value }; }); }}
                    style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff" }} />
                </div>
                <input placeholder="Motivo (ej: Control anual, castración)" value={citaForm.summary}
                  onChange={function(e) { setCitaForm(function(f) { return { ...f, summary: e.target.value }; }); }} />
                <input placeholder="Veterinario / Clinica" value={citaForm.vet}
                  onChange={function(e) { setCitaForm(function(f) { return { ...f, vet: e.target.value }; }); }} />
                <button onClick={addCita} style={{
                  background: "#a78bfa", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Guardar turno</button>
              </div>
            </Card>
          )}

          {citas.length === 0 && !addingCita && (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
              <p style={{ color: "#7a8299", fontSize: 13 }}>No hay turnos agendados.</p>
            </Card>
          )}

          {citas.map(function(c: any, i: number) {
            const today = new Date().toISOString().slice(0, 10);
            const pasado = c.date < today;
            return (
              <Card key={i} style={{ border: pasado ? "1px solid #252a3a" : "1px solid #a78bfa33" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 800, fontSize: 14 }}>📅 {c.summary}</span>
                  <span style={{
                    background: pasado ? "#25252a" : "#a78bfa22",
                    color: pasado ? "#7a8299" : "#a78bfa",
                    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                  }}>{c.date}</span>
                </div>
                {c.vet && <div style={{ color: "#7a8299", fontSize: 12 }}>Dr/a. {c.vet}</div>}
                {pasado && <div style={{ fontSize: 11, color: "#7a8299", marginTop: 4 }}>Turno pasado</div>}
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
              background: "#fb923c22", color: "#fb923c", border: "1px solid #fb923c44",
              borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>+ Registrar</button>
          </div>

          {addingAliment && (
            <Card style={{ border: "1px solid #fb923c44" }}>
              <div style={{ fontWeight: 700, color: "#fb923c", marginBottom: 12 }}>Nuevo registro de alimentacion</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Marca del alimento (ej: Royal Canin)" value={alimentForm.marca} onChange={function(e) { setAlimentForm(function(f) { return { ...f, marca: e.target.value }; }); }} />
                <input placeholder="Tipo (ej: Croquetas, Humedo, BARF, Casero)" value={alimentForm.tipo} onChange={function(e) { setAlimentForm(function(f) { return { ...f, tipo: e.target.value }; }); }} />
                <input placeholder="Cantidad diaria (ej: 200g manana y noche)" value={alimentForm.cantidad} onChange={function(e) { setAlimentForm(function(f) { return { ...f, cantidad: e.target.value }; }); }} />
                <input placeholder="Frecuencia (ej: 2 veces por dia)" value={alimentForm.frecuencia} onChange={function(e) { setAlimentForm(function(f) { return { ...f, frecuencia: e.target.value }; }); }} />
                <textarea placeholder="Notas adicionales..." rows={2} value={alimentForm.notas}
                  onChange={function(e) { setAlimentForm(function(f) { return { ...f, notas: e.target.value }; }); }}
                  style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff", resize: "none" }} />
                <button onClick={addAlimentacion} style={{
                  background: "#fb923c", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Guardar</button>
              </div>
            </Card>
          )}

          {alimentacion.length === 0 && !addingAliment && (
            <Card style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🍖</div>
              <p style={{ color: "#7a8299", fontSize: 13 }}>Sin registros de alimentacion. Registra que come {mascota && mascota.name}.</p>
            </Card>
          )}

          {alimentacion.map(function(a: any, i: number) {
            return (
              <Card key={i} style={{ border: "1px solid #fb923c22" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{a.marca || "Sin marca"}</div>
                    <div style={{ color: "#fb923c", fontSize: 12, fontWeight: 700, marginTop: 2 }}>{a.tipo}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#7a8299" }}>{a.fecha}</span>
                </div>
                {a.cantidad && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <span style={{ background: "#fb923c22", color: "#fb923c", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                      {a.cantidad}
                    </span>
                    {a.frecuencia && (
                      <span style={{ background: "#60a5fa22", color: "#60a5fa", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                        {a.frecuencia}
                      </span>
                    )}
                  </div>
                )}
                {a.notas && <div style={{ fontSize: 12, color: "#7a8299", lineHeight: 1.5, fontStyle: "italic" }}>{a.notas}</div>}
              </Card>
            );
          })}

          <div style={{ marginTop: 8 }}>
            <button onClick={pedirRecetas} disabled={loadingRecetas} style={{
              width: "100%", background: loadingRecetas ? "#252a3a" : "linear-gradient(135deg, #fb923c, #f97316)",
              color: loadingRecetas ? "#7a8299" : "#000", border: "none", borderRadius: 12, padding: 14,
              fontWeight: 900, fontSize: 14, cursor: "pointer", opacity: loadingRecetas ? 0.7 : 1,
              boxShadow: loadingRecetas ? "none" : "0 4px 20px #fb923c30",
            }}>
              {loadingRecetas ? "Generando recetas..." : "Recetas caseras recomendadas por IA"}
            </button>
          </div>

          {recetas && (
            <Card style={{ border: "1px solid #fb923c33", marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#fb923c" }}>Recetas para {mascota && mascota.name}</div>
                <button onClick={function() { setRecetas(null); }} style={{
                  background: "transparent", border: "none", color: "#7a8299",
                  fontSize: 18, cursor: "pointer", lineHeight: 1,
                }}>x</button>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.7, color: "#f0f4ff", whiteSpace: "pre-wrap" }}>
                {recetas.split("**").join("")}
              </div>
            </Card>
          )}
        </div>
      )}

      {histTab === "documentos" && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Subir desde tu dispositivo
          </div>
          <Card style={{ textAlign: "center", border: "2px dashed #252a3a" }}>
            <label style={{ cursor: "pointer", display: "block" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
              <div style={{ color: "#7a8299", fontSize: 13, marginBottom: 10 }}>Analisis, radiografias, recetas, ecografias</div>
              <div style={{
                background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
                borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700, display: "inline-block",
              }}>{uploading ? "Subiendo..." : "Seleccionar archivo"}</div>
              <input type="file" style={{ display: "none" }} onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
            </label>
          </Card>

          <div style={{ fontSize: 11, fontWeight: 800, color: "#60a5fa", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>
            Compartir link con la veterinaria
          </div>

          {newLink && (
            <Card style={{ background: "#0f1a2a", border: "1px solid #60a5fa44", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#60a5fa", marginBottom: 8 }}>
                {copiedLink ? "Link copiado!" : "Link para la veterinaria"}
              </div>
              <div style={{ background: "#0f1117", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#94a3b8", wordBreak: "break-all", marginBottom: 10 }}>
                {newLink}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={function() { navigator.clipboard.writeText(newLink); setCopiedLink(true); setTimeout(function() { setCopiedLink(false); }, 3000); }} style={{
                  flex: 1, background: "#60a5fa22", color: "#60a5fa", border: "1px solid #60a5fa44",
                  borderRadius: 10, padding: 10, fontWeight: 800, fontSize: 13, cursor: "pointer",
                }}>Copiar</button>
                <a href={"https://wa.me/?text=Te%20comparto%20el%20link%20para%20subir%20los%20estudios%20de%20" + encodeURIComponent(mascota ? mascota.name : "") + "%20a%20PetPass%3A%20" + encodeURIComponent(newLink)}
                  target="_blank" rel="noreferrer" style={{
                    flex: 1, background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
                    borderRadius: 10, padding: 10, fontWeight: 800, fontSize: 13, cursor: "pointer",
                    textDecoration: "none", textAlign: "center", display: "block",
                  }}>WhatsApp</a>
              </div>
            </Card>
          )}

          <Card style={{ border: "1px solid #60a5fa22" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa", marginBottom: 10 }}>Nuevo link para veterinaria</div>
            <input
              placeholder="Indicaciones para el vet (opcional)"
              value={linkNotes}
              onChange={function(e) { setLinkNotes(e.target.value); }}
              style={{ marginBottom: 10 }}
            />
            <button onClick={crearEstudioLink} disabled={creatingLink} style={{
              width: "100%", background: "#60a5fa", color: "#000", border: "none",
              borderRadius: 10, padding: 12, fontWeight: 800, fontSize: 14, cursor: "pointer",
              opacity: creatingLink ? 0.6 : 1,
            }}>{creatingLink ? "Generando..." : "Generar link y copiar"}</button>
          </Card>

          {estudioLinks.filter(function(l) { return l.active; }).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Links activos</div>
              {estudioLinks.filter(function(l) { return l.active; }).map(function(l: any) {
                return (
                  <div key={l.id} style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 12, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "#f0f4ff", fontWeight: 700 }}>{l.notes || "Sin indicaciones"}</div>
                      <div style={{ fontSize: 11, color: "#7a8299" }}>{new Date(l.created_at).toLocaleDateString("es-AR")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={function() { copyLink(l.id); }} style={{
                        background: "#60a5fa22", color: "#60a5fa", border: "none",
                        borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>Copiar</button>
                      <button onClick={function() { revocarLink(l.id); }} style={{
                        background: "#f8717122", color: "#f87171", border: "none",
                        borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}>Revocar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {historial.filter(function(h: any) { return isDoc(h); }).length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, marginTop: 8 }}>
              Documentos guardados
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
            return (
              <Card key={i} style={{ padding: "12px 16px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{h.title ? h.title.split(" ")[0] : "📄"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {h.title && h.title !== "📄 Documento" ? h.title : (name || "Documento")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: "#7a8299" }}>{h.date}</span>
                      {h.vet && h.vet !== "" && (
                        <span style={{ background: "#60a5fa22", color: "#60a5fa", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                          {h.vet}
                        </span>
                      )}
                    </div>
                    {vetNote && (
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontStyle: "italic" }}>{vetNote}</div>
                    )}
                    {iaText && (
                      <div style={{ marginTop: 6, background: "#0f1117", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#4ade80", lineHeight: 1.5 }}>
                        {iaText.length > 120 ? iaText.slice(0, 120) + "..." : iaText}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button onClick={function() { openDoc(pathOrUrl); }} style={{
                    flex: 1, background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
                    borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}>Ver</button>
                  <button onClick={function() { shareDoc(pathOrUrl, name); }} style={{
                    flex: 1, background: "#60a5fa22", color: "#60a5fa", border: "1px solid #60a5fa44",
                    borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  }}>Compartir</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
