"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import Adopciones from "@/components/Adopciones";

type Tab = "adopciones" | "perdidas" | "descuentos";

const DESCUENTOS = [
  { nombre: "Puppis", descripcion: "En todos los productos de la tienda online", icon: "🛍️" },
  { nombre: "Petco", descripcion: "En alimentos premium seleccionados", icon: "🦴" },
  { nombre: "Clínicas veterinarias", descripcion: "Descuentos en consultas y cirugías", icon: "🏥" },
  { nombre: "Guardería canina", descripcion: "Servicio de guardería y paseos diarios", icon: "🏠" },
  { nombre: "Transporte de mascotas", descripcion: "Traslado seguro a clínicas y aeropuertos", icon: "🚗" },
  { nombre: "Peluquería canina", descripcion: "Baño, corte y estética para tu mascota", icon: "✂️" },
];

function Card({ children, style = {} }: any) {
  return (
    <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "adopciones", label: "Adopciones", icon: "❤️" },
    { key: "perdidas", label: "Perdidas", icon: "📍" },
    { key: "descuentos", label: "Descuentos", icon: "🎁" },
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

// ─── Tab: Descuentos ──────────────────────────────────────────────────────────
function TabDescuentos() {
  return (
    <div>
      <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 16 }}>
        Beneficios exclusivos para miembros PetPass 🐾
      </p>
      {DESCUENTOS.map((d, i) => (
        <Card key={i} style={{ display: "flex", gap: 14, alignItems: "center", opacity: 0.6 }}>
          <div style={{
            fontSize: 28, width: 48, height: 48, borderRadius: 12, background: "#252a3a",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{d.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{d.nombre}</span>
              <span style={{
                background: "#252a3a", color: "#7a8299", border: "1px solid #353a4a",
                borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 800,
              }}>Próximamente</span>
            </div>
            <div style={{ color: "#7a8299", fontSize: 12 }}>{d.descripcion}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Tab: Mascotas Perdidas ───────────────────────────────────────────────────
function TabPerdidas() {
  const [perdidas, setPerdidas] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [reporting, setReporting] = useState(false);
  const [form, setForm] = useState({
    pet_name: "", breed: "", color: "", zone: "", phone: "", description: "",
    lat: -34.6037, lng: -58.3816,
  });
  const [fotosForm, setFotosForm] = useState<File[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
    });
    load();
  }, []);

  async function load() {
    const { data: perdidasData } = await supabase
      .from("perdidas").select("*").eq("active", true)
      .order("created_at", { ascending: false });
    if (!perdidasData?.length) { setPerdidas([]); return; }
    setPerdidas(perdidasData);

    const userIds = Array.from(new Set(perdidasData.map((p: any) => p.user_id)));
    const { data: profilesData } = await supabase.from("profiles").select("*").in("id", userIds);
    setProfiles(Object.fromEntries((profilesData || []).map(p => [p.id, p])));

    const { data: mascotasData } = await supabase
      .from("mascotas").select("user_id, photo_url").in("user_id", userIds).eq("active", true);
    const fotoMap: Record<string, string> = {};
    for (const m of (mascotasData || [])) {
      if (m.photo_url && !fotoMap[m.user_id]) fotoMap[m.user_id] = m.photo_url;
    }
    setFotos(fotoMap);
  }

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setFotosForm(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setFotoPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }

  async function handleReport() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("perdidas").insert({ ...form, user_id: user.id }).select();
    if (data?.[0]) {
      const id = data[0].id;
      const urls: string[] = [];
      for (const file of fotosForm) {
        const path = `perdidas/${id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("comunidad").upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from("comunidad").getPublicUrl(path);
          urls.push(urlData.publicUrl);
        }
      }
      if (urls.length > 0) {
        await supabase.from("perdidas").update({ photo_urls: JSON.stringify(urls) }).eq("id", id);
        data[0].photo_urls = JSON.stringify(urls);
      }
      setPerdidas(prev => [data[0], ...prev]);
    }
    setForm({ pet_name: "", breed: "", color: "", zone: "", phone: "", description: "", lat: form.lat, lng: form.lng });
    setFotosForm([]);
    setFotoPreviews([]);
    if (fileRef.current) fileRef.current.value = "";
    setReporting(false);
    setLoading(false);
  }

  function daysSince(dateStr: string) {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  }

  const fields: [string, string][] = [
    ["Nombre de la mascota", "pet_name"],
    ["Raza", "breed"],
    ["Color / descripción física", "color"],
    ["Zona donde se perdió", "zone"],
    ["Teléfono de contacto", "phone"],
  ];

  return (
    <div>
      <button onClick={() => setReporting(!reporting)} style={{
        width: "100%", background: "#f8717122", color: "#f87171",
        border: "1px solid #f8717144", borderRadius: 12, padding: 12,
        fontWeight: 700, fontSize: 14, marginBottom: 16,
      }}>
        📍 Reportar mascota perdida
      </button>

      {reporting && (
        <Card style={{ border: "1px solid #f8717144" }}>
          <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 12 }}>Nueva alerta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fields.map(([label, key]) => (
              <input key={key} placeholder={label} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            ))}
            <textarea placeholder="Descripción adicional..." rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff", resize: "none" }} />
            {/* Fotos */}
            <div>
              <div style={{ fontSize: 12, color: "#7a8299", marginBottom: 8 }}>Fotos de la mascota</div>
              {fotoPreviews.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {fotoPreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={src} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #f8717133" }} />
                      <button onClick={() => { setFotosForm(p => p.filter((_, idx) => idx !== i)); setFotoPreviews(p => p.filter((_, idx) => idx !== i)); }} style={{
                        position: "absolute", top: -6, right: -6, background: "#f87171", color: "#fff",
                        border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} style={{
                background: "#252a3a", color: "#7a8299", border: "1px solid #353a4a",
                borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>📷 Agregar fotos</button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFotos} />
            </div>

            <button onClick={handleReport} disabled={loading} style={{
              background: "#f87171", color: "#fff", border: "none",
              borderRadius: 10, padding: 12, fontWeight: 800, opacity: loading ? 0.6 : 1,
            }}>{loading ? "Publicando..." : "Publicar alerta"}</button>
          </div>
        </Card>
      )}

      {perdidas.length === 0 && !reporting && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐾</div>
          <p style={{ color: "#7a8299", fontSize: 13 }}>No hay mascotas perdidas reportadas.</p>
        </Card>
      )}

      {perdidas.map((p: any, i: number) => {
        const owner = profiles[p.user_id];
        const foto = fotos[p.user_id];
        const isGato = p.breed?.toLowerCase().includes("gato") || p.breed?.toLowerCase().includes("cat");
        const days = daysSince(p.created_at);

        const uploadedPhotos: string[] = (() => { try { return JSON.parse(p.photo_urls || "[]"); } catch { return []; } })();

        return (
          <Card key={i} style={{ border: "1px solid #f8717122" }}>
            {/* Fotos subidas por el usuario */}
            {uploadedPhotos.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
                {uploadedPhotos.map((url, pi) => (
                  <img key={pi} src={url} style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #f8717133" }} />
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Foto de perfil del dueño (si no hay fotos subidas) */}
              {uploadedPhotos.length === 0 && (
                <div style={{
                  width: 64, height: 64, borderRadius: 12, flexShrink: 0,
                  background: "#252a3a", border: "2px solid #f8717133",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {foto
                    ? <img src={foto} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: 32 }}>{isGato ? "🐱" : "🐶"}</span>
                  }
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{p.pet_name}</span>
                  <span style={{
                    background: days <= 2 ? "#f8717122" : "#fb923c22",
                    color: days <= 2 ? "#f87171" : "#fb923c",
                    borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>hace {days}d</span>
                </div>

                <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 2 }}>
                  {p.breed}{p.color ? ` · ${p.color}` : ""}
                </div>
                {p.zone && (
                  <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 4 }}>📍 {p.zone}</div>
                )}
                {p.description && (
                  <div style={{ fontSize: 12, color: "#f0f4ff", marginBottom: 8, lineHeight: 1.4 }}>{p.description}</div>
                )}

                {/* Datos del dueño */}
                <div style={{ background: "#0f1117", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#7a8299", marginBottom: 4, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Contacto</div>
                  {owner?.full_name && (
                    <div style={{ fontSize: 13, color: "#f0f4ff", marginBottom: 2 }}>👤 {owner.full_name}</div>
                  )}
                  {(p.phone || owner?.phone) && (
                    <div style={{ fontSize: 12, color: "#7a8299" }}>📞 {p.phone || owner.phone}</div>
                  )}
                </div>

                {p.phone && (
                  <a href={"https://wa.me/" + p.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer" style={{
                    display: "inline-block", background: "#4ade8022", color: "#4ade80",
                    border: "1px solid #4ade8044", borderRadius: 8, padding: "6px 14px",
                    fontSize: 12, fontWeight: 700, textDecoration: "none",
                  }}>💬 Contactar por WhatsApp</a>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Comunidad() {
  const [tab, setTab] = useState<Tab>("adopciones");

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Comunidad 👥</h2>
      <p style={{ color: "#7a8299", fontSize: 12, marginBottom: 16 }}>Adopciones, mascotas perdidas y descuentos</p>

      <TabBar active={tab} onChange={setTab} />

      {tab === "adopciones" && <Adopciones />}
      {tab === "perdidas" && <TabPerdidas />}
      {tab === "descuentos" && <TabDescuentos />}
    </div>
  );
}
