"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import Adopciones from "@/components/Adopciones";

// ─── Supabase setup necesario ────────────────────────────────────────────────
// 1. Crear tabla:
//    CREATE TABLE analisis_fotos (
//      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//      mascota_id uuid REFERENCES mascotas(id),
//      foto_path text,
//      analisis text,
//      created_at timestamp DEFAULT now()
//    );
//    ALTER TABLE analisis_fotos ENABLE ROW LEVEL SECURITY;
//    CREATE POLICY "owner" ON analisis_fotos USING (
//      mascota_id IN (SELECT id FROM mascotas WHERE user_id = auth.uid())
//    );
// 2. Crear bucket de storage llamado "fotos-mascotas" (privado)
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "descuentos" | "analisis" | "adopciones";

const DESCUENTOS = [
  { nombre: "Puppis", descuento: "10% OFF", descripcion: "En todos los productos de la tienda online", activo: true, icon: "🛍️", color: "#f472b6" },
  { nombre: "Petco", descuento: "15% OFF", descripcion: "En alimentos premium seleccionados", activo: true, icon: "🦴", color: "#60a5fa" },
  { nombre: "Clínicas veterinarias", descuento: "Próximamente", descripcion: "Descuentos en consultas y cirugías", activo: false, icon: "🏥", color: "#7a8299" },
  { nombre: "Guardería canina", descuento: "Próximamente", descripcion: "Servicio de guardería y paseos diarios", activo: false, icon: "🏠", color: "#7a8299" },
  { nombre: "Transporte de mascotas", descuento: "Próximamente", descripcion: "Traslado seguro a clínicas y aeropuertos", activo: false, icon: "🚗", color: "#7a8299" },
  { nombre: "Peluquería canina", descuento: "Próximamente", descripcion: "Baño, corte y estética para tu mascota", activo: false, icon: "✂️", color: "#7a8299" },
];

function Card({ children, style = {} }: any) {
  return <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>{children}</div>;
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "descuentos", label: "Descuentos", icon: "🎁" },
    { key: "analisis", label: "Análisis IA", icon: "🔬" },
    { key: "adopciones", label: "Adopciones", icon: "❤️" },
  ];
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "#0f1117", borderRadius: 12, padding: 4 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)} style={{
          flex: 1, border: "none", borderRadius: 10, padding: "8px 4px",
          background: active === t.key ? "#252a3a" : "transparent",
          color: active === t.key ? "#f0f4ff" : "#7a8299",
          fontWeight: 700, fontSize: 11, cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
        }}>
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tab: Descuentos ─────────────────────────────────────────────────────────
function TabDescuentos() {
  return (
    <div>
      <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 16 }}>
        Beneficios exclusivos para miembros PetPass 🐾
      </p>
      {DESCUENTOS.map((d, i) => (
        <Card key={i} style={{
          display: "flex", gap: 14, alignItems: "center",
          opacity: d.activo ? 1 : 0.6,
          border: d.activo ? `1px solid ${d.color}33` : "1px solid #252a3a",
        }}>
          <div style={{
            fontSize: 28, width: 48, height: 48, borderRadius: 12,
            background: d.activo ? d.color + "22" : "#252a3a",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{d.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{d.nombre}</span>
              <span style={{
                background: d.activo ? d.color + "22" : "#252a3a",
                color: d.activo ? d.color : "#7a8299",
                border: `1px solid ${d.activo ? d.color + "44" : "#252a3a"}`,
                borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 800,
              }}>{d.descuento}</span>
            </div>
            <div style={{ color: "#7a8299", fontSize: 12 }}>{d.descripcion}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Tab: Análisis IA ─────────────────────────────────────────────────────────
function TabAnalisis() {
  const [mascota, setMascota] = useState<any>(null);
  const [analisis, setAnalisis] = useState<any[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileData, setFileData] = useState<{ base64: string; mediaType: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: mascotas } = await supabase.from("mascotas").select("*").eq("user_id", user.id).limit(1);
      if (mascotas?.[0]) {
        setMascota(mascotas[0]);
        const { data } = await supabase
          .from("analisis_fotos")
          .select("*")
          .eq("mascota_id", mascotas[0].id)
          .order("created_at", { ascending: false });
        setAnalisis(data || []);
      }
    }
    load();
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      const base64 = result.split(",")[1];
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      setFileData({ base64, mediaType });
    };
    reader.readAsDataURL(file);
  }

  async function analizar() {
    if (!fileData || !mascota) return;
    setLoading(true);
    setResultado(null);
    try {
      // 1. Llamar a Claude Vision
      const res = await fetch("/api/analisis-foto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: fileData.base64,
          mediaType: fileData.mediaType,
          mascotaNombre: mascota.name,
          mascotaEspecie: mascota.species,
        }),
      });
      const { reply } = await res.json();

      // 2. Subir foto a Supabase Storage
      const filePath = `${mascota.id}/${Date.now()}_${fileName}`;
      await supabase.storage.from("fotos-mascotas").upload(filePath, dataURLtoBlob(preview!), {
        contentType: fileData.mediaType,
      });

      // 3. Guardar análisis en la tabla
      const { data: saved } = await supabase.from("analisis_fotos").insert({
        mascota_id: mascota.id,
        foto_path: filePath,
        analisis: reply,
      }).select();

      if (saved) setAnalisis(prev => [saved[0], ...prev]);
      setResultado(reply);
      setPreview(null);
      setFileData(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setLoading(false);
    }
  }

  function dataURLtoBlob(dataURL: string) {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  }

  return (
    <div>
      <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 16 }}>
        Subí una foto de tu mascota y la IA veterinaria detectará si hay algo que revisar.
      </p>

      {/* Uploader */}
      <Card style={{ border: "2px dashed #252a3a", textAlign: "center" }}>
        {preview ? (
          <div>
            <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 10, marginBottom: 12, maxHeight: 240, objectFit: "cover" }} />
            <div style={{ fontSize: 12, color: "#7a8299", marginBottom: 12 }}>{fileName}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setPreview(null); setFileData(null); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}
                style={{ flex: 1, background: "#252a3a", color: "#7a8299", border: "none", borderRadius: 10, padding: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Cambiar
              </button>
              <button onClick={analizar} disabled={loading || !mascota} style={{
                flex: 2, background: "#4ade80", color: "#000", border: "none", borderRadius: 10,
                padding: 10, fontWeight: 800, fontSize: 13, cursor: "pointer",
                opacity: loading || !mascota ? 0.6 : 1,
              }}>
                {loading ? "Analizando..." : "🔬 Analizar con IA"}
              </button>
            </div>
            {!mascota && <div style={{ color: "#f87171", fontSize: 11, marginTop: 8 }}>Primero agregá una mascota desde el perfil.</div>}
          </div>
        ) : (
          <label style={{ cursor: "pointer", display: "block" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📷</div>
            <div style={{ color: "#7a8299", fontSize: 13, marginBottom: 12 }}>Seleccioná una foto de tu mascota</div>
            <div style={{
              background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
              borderRadius: 10, padding: "8px 20px", fontSize: 13, fontWeight: 700, display: "inline-block",
            }}>Elegir foto</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          </label>
        )}
      </Card>

      {/* Resultado del último análisis */}
      {resultado && (
        <Card style={{ border: "1px solid #4ade8044" }}>
          <div style={{ fontWeight: 700, color: "#4ade80", marginBottom: 10, fontSize: 13 }}>🔬 Resultado del análisis</div>
          <div style={{ fontSize: 13, color: "#f0f4ff", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{resultado}</div>
        </Card>
      )}

      {/* Historial de análisis */}
      {analisis.length > 0 && (
        <>
          <div style={{ color: "#7a8299", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", margin: "20px 0 10px" }}>
            Análisis anteriores
          </div>
          {analisis.map((a: any, i: number) => (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>🔬 Análisis</span>
                <span style={{ fontSize: 11, color: "#7a8299" }}>{formatDate(a.created_at)}</span>
              </div>
              <div style={{ fontSize: 12, color: "#f0f4ff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{a.analisis}</div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Comunidad() {
  const [tab, setTab] = useState<Tab>("descuentos");

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Comunidad 👥</h2>
      <p style={{ color: "#7a8299", fontSize: 12, marginBottom: 16 }}>Descuentos, análisis de salud y adopciones</p>

      <TabBar active={tab} onChange={setTab} />

      {tab === "descuentos" && <TabDescuentos />}
      {tab === "analisis" && <TabAnalisis />}
      {tab === "adopciones" && <Adopciones />}
    </div>
  );
}
