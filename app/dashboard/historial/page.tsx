"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

function Card({ children, style = {} }: any) {
  return <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>{children}</div>;
}

function Badge({ children, color = "#60a5fa" }: any) {
  return <span style={{ background: color + "22", color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, border: `1px solid ${color}44` }}>{children}</span>;
}

export default function Historial() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ date: "", vet: "", title: "", summary: "" });
  const [adding, setAdding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ms } = await supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true);
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
    const { data: hist } = await supabase.from("historial").select("*").eq("mascota_id", m.id).order("created_at", { ascending: false });
    setHistorial(hist || []);
  }

  async function addEntry() {
    if (!form.title || !mascota) return;
    const { data } = await supabase.from("historial").insert({ ...form, mascota_id: mascota.id }).select();
    if (data) setHistorial(prev => [data[0], ...prev]);
    setForm({ date: "", vet: "", title: "", summary: "" });
    setAdding(false);
  }

  async function handleFile(e: any) {
    const file = e.target.files?.[0];
    if (!file || !mascota) return;
    setUploading(true);

    // Sanitizar nombre de archivo
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${mascota.id}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage.from("documentos").upload(path, file, { upsert: true });

    if (!error) {
      const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
      const entry = {
        mascota_id: mascota.id,
        title: "📄 Documento",
        summary: `${file.name}::${urlData.publicUrl}`,
        date: new Date().toLocaleDateString("es-AR"),
        vet: "",
      };
      const { data: saved, error: insertError } = await supabase.from("historial").insert(entry).select();
      if (saved) {
        setHistorial(prev => [saved[0], ...prev]);
      } else {
        console.error("Insert error:", insertError?.message);
        alert("Archivo subido pero no se pudo registrar en el historial.");
      }
    } else {
      console.error("Upload error:", error.message);
      if (error.message.includes("Bucket not found")) {
        alert("El bucket 'documentos' no existe. Ejecutá el SQL de configuración en Supabase.");
      } else if (error.message.includes("row-level security") || error.message.includes("policy")) {
        alert("Sin permisos para subir archivos. Ejecutá el SQL de políticas en Supabase.");
      } else {
        alert("Error al subir: " + error.message);
      }
    }
    if (e.target) e.target.value = "";
    setUploading(false);
  }

  return (
    <div>
      {/* Header de mascota activa */}
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
              : <span style={{ fontSize: 26 }}>{mascota.breed?.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, fontFamily: "Georgia, serif" }}>{mascota.name}</div>
            <div style={{ color: "#7a8299", fontSize: 12, marginTop: 2 }}>
              {mascota.breed} · {mascota.age} · {mascota.sex}
            </div>
          </div>
          <span style={{
            background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
            borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 800,
          }}>Historia clínica</span>
        </div>
      )}

      {/* Selector de mascota si hay más de una */}
      {mascotas.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
          {mascotas.map(m => (
            <button key={m.id} onClick={() => selectMascota(m)} style={{
              background: mascota?.id === m.id ? "#4ade8022" : "#181c27",
              border: `1px solid ${mascota?.id === m.id ? "#4ade80" : "#252a3a"}`,
              borderRadius: 20, padding: "6px 14px",
              color: mascota?.id === m.id ? "#4ade80" : "#7a8299",
              fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {m.photo_url
                ? <img src={m.photo_url} style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover" }} />
                : <span>{m.breed?.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
              }
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Consultas</h2>
        <button onClick={() => setAdding(!adding)} style={{
          background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
        }}>+ Agregar</button>
      </div>

      {adding && (
        <Card style={{ border: "1px solid #4ade8044" }}>
          <div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 12 }}>Nueva consulta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Título (ej: Control anual)" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <input placeholder="Veterinario/a" value={form.vet} onChange={e => setForm(f => ({ ...f, vet: e.target.value }))} />
            <input placeholder="Fecha (ej: 15 Ene 2025)" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <textarea placeholder="Resumen de la consulta..." rows={3} value={form.summary}
              onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff", resize: "none" }} />
            <button onClick={addEntry} style={{
              background: "#4ade80", color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 800,
            }}>Guardar</button>
          </div>
        </Card>
      )}

      {historial.length === 0 && !adding && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
          <p style={{ color: "#7a8299", fontSize: 13 }}>Todavía no hay consultas registradas.<br />Agregá la primera.</p>
        </Card>
      )}

      {historial.filter((h: any) => h.title !== "📄 Documento").map((h: any, i: number) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{h.title}</span>
            {h.date && <Badge>{h.date}</Badge>}
          </div>
          {h.vet && <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 4 }}>{h.vet}</div>}
          {h.summary && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{h.summary}</div>}
        </Card>
      ))}

      <div style={{ color: "#7a8299", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>
        Documentos
      </div>
      <Card style={{ textAlign: "center", border: "2px dashed #252a3a" }}>
        <label style={{ cursor: "pointer" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
          <div style={{ color: "#7a8299", fontSize: 13, marginBottom: 10 }}>Subí análisis, radiografías, recetas</div>
          <div style={{
            background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
            borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700, display: "inline-block",
          }}>{uploading ? "Subiendo..." : "Seleccionar archivo"}</div>
          <input type="file" style={{ display: "none" }} onChange={handleFile} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
        </label>
      </Card>

      {historial.filter((h: any) => h.title === "📄 Documento").map((h: any, i: number) => {
        const [name, url] = h.summary?.split("::") || [];
        return (
          <Card key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px" }}>
            <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#f0f4ff", textDecoration: "none", flex: 1, marginRight: 8 }}>
              📄 {name || "Documento"}
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#7a8299" }}>{h.date}</span>
              <Badge color="#4ade80">Ver</Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
