"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import Adopciones from "@/components/Adopciones";
import { timeAgo } from "@/lib/utils";
import { UiCard } from "@/components/ui";
import { MUNICIPIOS_POR_PROVINCIA, PROVINCIAS_LIST, buildZona } from "@/lib/locations";

type Tab = "explorar" | "juntadas" | "adopciones" | "perdidas" | "profesionales" | "descuentos";

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
    <UiCard className="community-card" style={style}>
      {children}
    </UiCard>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "explorar", label: "Explorar", icon: "🐾" },
    { key: "juntadas", label: "Juntadas", icon: "🦮" },
    { key: "adopciones", label: "Adopción", icon: "❤️" },
    { key: "perdidas", label: "Pérdidas", icon: "📍" },
    { key: "profesionales", label: "Cartilla", icon: "🏥" },
    { key: "descuentos", label: "Beneficios", icon: "🎁" },
  ];
  return (
    <div className="community-tabs" style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
      {tabs.map(t => (
        <button key={t.key} className={active === t.key ? "community-tab community-tab-active" : "community-tab"} onClick={() => onChange(t.key)} style={{
          flex: "0 0 auto", borderRadius: 20,
          padding: "7px 14px",
          background: active === t.key ? "#1C3557" : "#FFFFFF",
          color: active === t.key ? "#fff" : "#64748B",
          fontWeight: 700, fontSize: 12, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          boxShadow: active === t.key ? "0 2px 8px rgba(28,53,87,0.2)" : "0 1px 3px rgba(0,0,0,0.06)",
          border: active === t.key ? "none" : "1px solid #E2E8F0",
          whiteSpace: "nowrap",
          transition: "all 0.15s",
        } as any}>
          <span style={{ fontSize: 14 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Tab: Explorar (Tinder de mascotas + Mural) ───────────────────────────────
function TabExplorar() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [raza, setRaza] = useState("");
  const [razas, setRazas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [miMascota, setMiMascota] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [msgTag, setMsgTag] = useState<string | null>(null);
  const supabase = createClient();

  const MURAL_TAGS = [
    { tag: null, label: "General", icon: "💬" },
    { tag: "🦮 Paseo", label: "Paseo", icon: "🦮" },
    { tag: "💡 Consejo", label: "Consejo", icon: "💡" },
    { tag: "📸 Foto", label: "Foto", icon: "📸" },
    { tag: "🔍 Busco compañero", label: "Busco compañero", icon: "🔍" },
    { tag: "❓ Pregunta", label: "Pregunta", icon: "❓" },
  ];

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let result = mascotas;
    if (raza) result = result.filter(m => m.breed === raza);
    if (search) result = result.filter(m =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.breed?.toLowerCase().includes(search.toLowerCase()) ||
      m.location?.toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(result);
  }, [mascotas, raza, search]);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data }, { data: msgs }, { data: miMs }] = await Promise.all([
      supabase.from("mascotas").select("*, profiles(full_name, phone)").eq("is_public", true).eq("active", true).neq("user_id", user?.id || ""),
      supabase.from("comunidad_mensajes").select("*").not("author_name", "ilike", "SOLICITUD:%").order("created_at", { ascending: false }).limit(30),
      supabase.from("mascotas").select("name, breed").eq("user_id", user?.id || "").eq("active", true).limit(1),
    ]);
    const ms = data || [];
    setMascotas(ms);
    setFiltered(ms);
    setMensajes(msgs || []);
    if (miMs?.[0]) setMiMascota(miMs[0]);
    const uniqueRazas = Array.from(new Set(ms.map((m: any) => m.breed).filter(Boolean))) as string[];
    setRazas(uniqueRazas);
    setLoading(false);
  }

  async function sendMsg() {
    if (!msgText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSendingMsg(true);

    let photo_url: string | null = null;
    if (photoFile) {
      const path = `mural/${Date.now()}_${photoFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("comunidad").upload(path, photoFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from("comunidad").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const messageWithTag = msgTag ? `${msgTag} — ${msgText.trim()}` : msgText.trim();
    const entry = {
      user_id: user.id,
      author_name: miMascota?.name ? `Tutor de ${miMascota.name}` : "Tutor",
      mascota_name: miMascota?.name || null,
      message: messageWithTag,
      photo_url,
    };
    const { data: saved } = await supabase.from("comunidad_mensajes").insert(entry).select();
    if (saved?.[0]) setMensajes(prev => [saved[0], ...prev]);
    setMsgText("");
    setMsgTag(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setSendingMsg(false);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }


  if (loading) return (
    <div style={{ padding: "16px 0" }}>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: 10 }} />
      ))}
    </div>
  );

  return (
    <div className="community-tab-panel community-tab-explorar">
      <p className="community-section-copy" style={{ color: "#64748B", fontSize: 13, marginBottom: 14 }}>
        Mascotas públicas para coordinar paseos, viajes o simplemente conectar con tutores de la misma raza.
      </p>

      {/* Buscador y filtro */}
      <div className="community-filter-row" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="🔍 Buscar por nombre, raza o zona..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, fontSize: 13 }}
        />
      </div>
      {razas.length > 0 && (
        <div className="community-chip-row" style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          <button onClick={() => setRaza("")} style={{
            background: !raza ? "#E5F7F6" : "#FFFFFF",
            border: `1px solid ${!raza ? "#2CB8AD" : "#E2E8F0"}`,
            color: !raza ? "#2CB8AD" : "#64748B",
            borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>Todas</button>
          {razas.map(r => (
            <button key={r} onClick={() => setRaza(r === raza ? "" : r)} style={{
              background: raza === r ? "#E5F7F6" : "#FFFFFF",
              border: `1px solid ${raza === r ? "#2CB8AD" : "#E2E8F0"}`,
              color: raza === r ? "#2CB8AD" : "#64748B",
              borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>{r}</button>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🐾</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Sin mascotas públicas todavía</div>
          <p style={{ color: "#64748B", fontSize: 13 }}>
            Activá el perfil público de tu mascota desde la pestaña Perfil para aparecer acá.
          </p>
        </Card>
      )}

      <div className="community-pet-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filtered.map((m: any, i: number) => {
          const isGato = m.breed?.toLowerCase().includes("gato");
          const owner = m.profiles;
          return (
            <div key={i} className="community-pet-card" style={{
              background: "#FFFFFF", border: "1px solid #E2E8F0",
              borderRadius: 16, overflow: "hidden",
            }}>
              {/* Foto */}
              <div style={{
                height: 120, background: "#E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {m.photo_url
                  ? <img src={m.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 52 }}>{isGato ? "🐱" : "🐕"}</span>
                }
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ color: "#64748B", fontSize: 11, marginBottom: 6 }}>
                  {m.breed}{m.age ? ` · ${m.age}` : ""}{m.sex ? ` · ${m.sex}` : ""}
                </div>
                {m.location && (
                  <div style={{ fontSize: 11, color: "#3B82F6", marginBottom: 8 }}>📍 {m.location}</div>
                )}
                {owner?.phone && (
                  <a href={"https://wa.me/" + owner.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer"
                    style={{
                      display: "block", background: "#E5F7F6", color: "#2CB8AD",
                      border: "1px solid #B2E8E5", borderRadius: 8, padding: "6px 0",
                      fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center",
                    }}>Contactar</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mural de la comunidad ── */}
      <div className="community-mural" style={{ marginTop: 28, marginBottom: 8 }}>
        <div className="community-kicker" style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
          Mural de la comunidad
        </div>

        {/* Formulario de publicación */}
        <div className="community-compose-card" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 14, marginBottom: 16 }}>
          {/* Chips de categoría */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
            {MURAL_TAGS.map(t => (
              <button key={t.label} onClick={() => setMsgTag(t.tag === msgTag ? null : t.tag)} style={{
                background: msgTag === t.tag ? "#E5F7F6" : "#F4F6FB",
                border: `1px solid ${msgTag === t.tag ? "#2CB8AD" : "#E2E8F0"}`,
                color: msgTag === t.tag ? "#2CB8AD" : "#64748B",
                borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
              }}>{t.icon} {t.label}</button>
            ))}
          </div>
          <textarea
            placeholder={msgTag ? `${msgTag}...` : (miMascota ? `Compartí algo sobre ${miMascota.name}...` : "Compartí algo con la comunidad...")}
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            rows={3}
            style={{
              background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10,
              padding: "10px 14px", color: "#1C3557", resize: "none", width: "100%",
              fontSize: 13, marginBottom: 10,
            }}
          />
          {photoPreview && (
            <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
              <img src={photoPreview} style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "1px solid #B2E8E5" }} />
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }} style={{
                position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff",
                border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>
          )}
          <div className="community-compose-actions" style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fileRef.current?.click()} style={{
              background: "#E2E8F0", color: "#64748B", border: "1px solid #CBD5E1",
              borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
            <button onClick={sendMsg} disabled={sendingMsg || !msgText.trim()} style={{
              flex: 1, background: msgText.trim() ? "linear-gradient(135deg, #2CB8AD, #229E94)" : "#E2E8F0",
              color: msgText.trim() ? "#000" : "#64748B", border: "none",
              borderRadius: 10, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer",
              opacity: sendingMsg ? 0.6 : 1,
            }}>{sendingMsg ? "Publicando..." : "Publicar"}</button>
          </div>
        </div>

        {/* Feed de mensajes */}
        {mensajes.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#64748B", fontSize: 13 }}>
            Sé el primero en publicar algo.
          </div>
        )}
        {mensajes.map((msg: any, i: number) => (
          <div key={i} className="community-message-card" style={{
            background: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: 14, padding: 14, marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "#E5F7F6",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                }}>🐾</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{msg.author_name || "Tutor"}</div>
                  {msg.mascota_name && (
                    <div style={{ fontSize: 11, color: "#2CB8AD" }}>🐕 {msg.mascota_name}</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#64748B" }}>{timeAgo(msg.created_at)}</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: msg.photo_url ? 10 : 0 }}>{msg.message}</p>
            {msg.photo_url && (
              <img src={msg.photo_url} style={{ width: "100%", borderRadius: 10, maxHeight: 280, objectFit: "cover" }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Juntadas ────────────────────────────────────────────────────────────
type TipoJuntada = "paseo" | "juntada" | "encuentro";

const TIPO_JUNTADA: { key: TipoJuntada; label: string; icon: string; color: string }[] = [
  { key: "paseo", label: "Paseo grupal", icon: "🦮", color: "#2CB8AD" },
  { key: "juntada", label: "Juntada", icon: "🎉", color: "#8B5CF6" },
  { key: "encuentro", label: "Encuentro", icon: "🐾", color: "#F97316" },
];

function TabJuntadas() {
  const [juntadas, setJuntadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<TipoJuntada | "todos">("todos");
  const [showForm, setShowForm] = useState(false);
  const [miMascota, setMiMascota] = useState<any>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: "", tipo: "paseo" as TipoJuntada,
    descripcion: "", fecha: "", hora: "", telefono: "",
  });
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const supabase = createClient();

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setMyUserId(user?.id || null);
    const [{ data: jData }, { data: miMs }] = await Promise.all([
      supabase.from("juntadas").select("*").eq("active", true).order("fecha", { ascending: true }),
      user ? supabase.from("mascotas").select("name, breed").eq("user_id", user.id).eq("active", true).limit(1) : { data: null },
    ]);
    setJuntadas(jData || []);
    if (miMs?.[0]) setMiMascota(miMs[0]);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.titulo.trim() || !form.fecha || !provincia) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const zona = buildZona(provincia, municipio);
    const authorName = miMascota?.name ? `Tutor de ${miMascota.name}` : "Tutor";
    const { data } = await supabase.from("juntadas").insert({
      user_id: user.id, author_name: authorName,
      titulo: form.titulo, tipo: form.tipo,
      descripcion: form.descripcion, fecha: form.fecha,
      hora: form.hora, zona, provincia, municipio,
      telefono: form.telefono, asistentes: 1, active: true,
    }).select();
    if (data?.[0]) setJuntadas(prev => [...prev, data[0]].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "")));
    setForm({ titulo: "", tipo: "paseo", descripcion: "", fecha: "", hora: "", telefono: "" });
    setProvincia(""); setMunicipio("");
    setShowForm(false); setSaving(false);
  }

  async function handleAnotarse(j: any) {
    const newCount = (j.asistentes || 1) + 1;
    await supabase.from("juntadas").update({ asistentes: newCount }).eq("id", j.id);
    setJuntadas(prev => prev.map(x => x.id === j.id ? { ...x, asistentes: newCount } : x));
  }

  const today = new Date().toISOString().split("T")[0];
  const listaFiltrada = juntadas
    .filter(j => !j.fecha || j.fecha >= today)
    .filter(j => filtro === "todos" || j.tipo === filtro);

  if (loading) return (
    <div style={{ padding: "16px 0" }}>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14, marginBottom: 10 }} />
      ))}
    </div>
  );

  return (
    <div className="community-tab-panel community-tab-juntadas">
      <p style={{ color: "#64748B", fontSize: 13, marginBottom: 14 }}>
        Organizá paseos grupales, juntadas en el parque y encuentros con otras mascotas 🦮
      </p>

      {/* Filtros de tipo */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        <button onClick={() => setFiltro("todos")} style={{
          background: filtro === "todos" ? "#1C3557" : "#FFFFFF",
          color: filtro === "todos" ? "#fff" : "#64748B",
          border: filtro === "todos" ? "none" : "1px solid #E2E8F0",
          borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700,
          cursor: "pointer", whiteSpace: "nowrap",
        }}>Todos</button>
        {TIPO_JUNTADA.map(t => (
          <button key={t.key} onClick={() => setFiltro(t.key === filtro ? "todos" : t.key)} style={{
            background: filtro === t.key ? t.color : "#FFFFFF",
            color: filtro === t.key ? "#fff" : "#64748B",
            border: filtro === t.key ? "none" : "1px solid #E2E8F0",
            borderRadius: 20, padding: "5px 14px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Botón crear */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} style={{
          width: "100%", background: "linear-gradient(135deg, #2CB8AD, #229E94)",
          color: "#000", border: "none", borderRadius: 14, padding: "12px 16px",
          fontWeight: 800, fontSize: 14, cursor: "pointer", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>🦮 Organizar una juntada</button>
      )}

      {/* Formulario crear */}
      {showForm && (
        <Card style={{ border: "1px solid #B2E8E5", marginBottom: 16 }}>
          <div style={{ fontWeight: 800, color: "#1C3557", marginBottom: 14 }}>Nueva juntada</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Título — ej: Paseo por el parque Centenario *" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              {TIPO_JUNTADA.map(t => (
                <button key={t.key} onClick={() => setForm(f => ({ ...f, tipo: t.key }))} style={{
                  flex: 1, border: `1px solid ${form.tipo === t.key ? t.color : "#E2E8F0"}`,
                  background: form.tipo === t.key ? t.color + "20" : "#FFFFFF",
                  color: form.tipo === t.key ? t.color : "#64748B",
                  borderRadius: 10, padding: "8px 4px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}>{t.icon}<br /><span style={{ fontSize: 10 }}>{t.label}</span></button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} style={{ flex: 1 }} />
              <input type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} style={{ flex: 1 }} />
            </div>
            <select value={provincia} onChange={e => { setProvincia(e.target.value); setMunicipio(""); }} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: provincia ? "#1C3557" : "#94a3b8", fontSize: 13 }}>
              <option value="">Provincia *</option>
              {PROVINCIAS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {provincia && (
              <select value={municipio} onChange={e => setMunicipio(e.target.value)} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: municipio ? "#1C3557" : "#94a3b8", fontSize: 13 }}>
                <option value="">Ciudad / Barrio</option>
                {(MUNICIPIOS_POR_PROVINCIA[provincia] || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            <textarea placeholder="Descripción del encuentro, punto de reunión..." rows={2} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", resize: "none" }} />
            <input placeholder="WhatsApp de contacto" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} disabled={saving || !form.titulo.trim() || !form.fecha || !provincia} style={{
                flex: 1, background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#000", border: "none", borderRadius: 10, padding: 12,
                fontWeight: 800, fontSize: 14, cursor: "pointer",
                opacity: (saving || !form.titulo.trim() || !form.fecha || !provincia) ? 0.6 : 1,
              }}>{saving ? "Creando..." : "Publicar juntada →"}</button>
              <button onClick={() => setShowForm(false)} style={{
                background: "#E2E8F0", color: "#64748B", border: "none",
                borderRadius: 10, padding: "12px 16px", cursor: "pointer",
              }}>Cancelar</button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista vacía */}
      {listaFiltrada.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🦮</div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Todavía no hay juntadas</div>
          <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.5 }}>
            Sé el primero en organizar un paseo grupal o una juntada en tu zona
          </p>
        </Card>
      )}

      {/* Cards de juntadas */}
      {listaFiltrada.map((j: any) => {
        const tipoInfo = TIPO_JUNTADA.find(t => t.key === j.tipo) || TIPO_JUNTADA[0];
        const fechaStr = j.fecha
          ? new Date(j.fecha + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })
          : null;
        const isOwner = j.user_id === myUserId;
        return (
          <Card key={j.id} style={{ border: `1px solid ${tipoInfo.color}30` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{
                    background: tipoInfo.color + "20", color: tipoInfo.color,
                    borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, flexShrink: 0,
                  }}>{tipoInfo.icon} {tipoInfo.label}</span>
                  {(j.asistentes || 0) > 1 && (
                    <span style={{ color: "#64748B", fontSize: 11 }}>👥 {j.asistentes} van</span>
                  )}
                </div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{j.titulo}</div>
              </div>
              {fechaStr && (
                <div style={{
                  background: "#F4F6FB", borderRadius: 10, padding: "6px 10px",
                  textAlign: "center", flexShrink: 0, marginLeft: 10, minWidth: 72,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1C3557" }}>{fechaStr}</div>
                  {j.hora && <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>⏰ {j.hora}</div>}
                </div>
              )}
            </div>
            {j.descripcion && (
              <p style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5, marginBottom: 8 }}>{j.descripcion}</p>
            )}
            {j.zona && <div style={{ fontSize: 12, color: "#3B82F6", marginBottom: 10 }}>📍 {j.zona}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              {j.telefono && !isOwner && (
                <a href={"https://wa.me/" + j.telefono.replace(/\D/g, "")} target="_blank" rel="noreferrer" style={{
                  flex: 1, background: "#E5F7F6", color: "#2CB8AD",
                  border: "1px solid #B2E8E5", borderRadius: 8, padding: "7px 0",
                  fontSize: 12, fontWeight: 700, textDecoration: "none", textAlign: "center",
                }}>💬 Contactar</a>
              )}
              {!isOwner && (
                <button onClick={() => handleAnotarse(j)} style={{
                  flex: 1, background: "#F4F6FB", color: "#1C3557",
                  border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 0",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>🐾 Me anoto</button>
              )}
              {isOwner && (
                <div style={{
                  flex: 1, textAlign: "center", fontSize: 12,
                  color: "#64748B", padding: "7px 0",
                }}>Tu juntada ✨</div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Tab: Descuentos ──────────────────────────────────────────────────────────
function TabDescuentos() {
  const [showForm, setShowForm] = useState(false);
  const [bizForm, setBizForm] = useState({ nombre: "", rubro: "", email: "", descuento: "" });
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSendBiz() {
    if (!bizForm.nombre || !bizForm.email) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("solicitudes_descuento").insert({
      user_id: user?.id ?? null,
      nombre: bizForm.nombre,
      rubro: bizForm.rubro,
      email: bizForm.email,
      descuento: bizForm.descuento,
    });
    setSent(true);
    setShowForm(false);
  }

  return (
    <div className="community-tab-panel community-tab-descuentos">
      <p className="community-section-copy" style={{ color: "#64748B", fontSize: 13, marginBottom: 16 }}>
        Beneficios exclusivos para miembros PetPass.
      </p>
      {DESCUENTOS.map((d, i) => (
        <Card key={i} style={{ display: "flex", gap: 14, alignItems: "center", opacity: 0.6 }}>
          <div style={{
            fontSize: 28, width: 48, height: 48, borderRadius: 12, background: "#E2E8F0",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>{d.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{d.nombre}</span>
              <span style={{
                background: "#E2E8F0", color: "#64748B", border: "1px solid #CBD5E1",
                borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 800,
              }}>Próximamente</span>
            </div>
            <div style={{ color: "#64748B", fontSize: 12 }}>{d.descripcion}</div>
          </div>
        </Card>
      ))}

      {/* CTA para negocios */}
      <div style={{ marginTop: 8 }}>
        {sent ? (
          <Card style={{ textAlign: "center", border: "1px solid #B2E8E5" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>¡Recibimos tu consulta!</div>
            <div style={{ color: "#64748B", fontSize: 13 }}>Te contactamos pronto para sumar tu negocio.</div>
          </Card>
        ) : (
          <Card style={{ border: "1px solid #FBCFE8", background: "#FFFFFF" }}>
            <div className="community-cta-row" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: showForm ? 14 : 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "#FDF2F8",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
              }}>🏪</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>¿Tenés un negocio pet-friendly?</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>Sumá tu descuento y llegá a miles de tutores</div>
              </div>
              <button onClick={() => setShowForm(!showForm)} style={{
                background: "linear-gradient(135deg, #EC4899, #DB2777)",
                color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px",
                fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0,
              }}>Quiero aparecer</button>
            </div>
            {showForm && (
              <div className="community-form" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre del negocio *" value={bizForm.nombre} onChange={e => setBizForm(f => ({ ...f, nombre: e.target.value }))} />
                <input placeholder="Rubro (ej: veterinaria, peluquería)" value={bizForm.rubro} onChange={e => setBizForm(f => ({ ...f, rubro: e.target.value }))} />
                <input placeholder="Email de contacto *" type="email" value={bizForm.email} onChange={e => setBizForm(f => ({ ...f, email: e.target.value }))} />
                <input placeholder="Descuento que ofrecés (ej: 15% en consultas)" value={bizForm.descuento} onChange={e => setBizForm(f => ({ ...f, descuento: e.target.value }))} />
                <button onClick={handleSendBiz} style={{
                  background: "linear-gradient(135deg, #EC4899, #DB2777)",
                  color: "#fff", border: "none", borderRadius: 10, padding: 12,
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}>Enviar consulta</button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Mascotas Perdidas ───────────────────────────────────────────────────
type SubTab = "perdidas" | "encontradas";

function TabPerdidas() {
  const [subTab, setSubTab] = useState<SubTab>("perdidas");
  const [perdidas, setPerdidas] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [reporting, setReporting] = useState(false);
  const [reportingType, setReportingType] = useState<"perdida" | "encontrada">("perdida");
  const [form, setForm] = useState({
    pet_name: "", breed: "", color: "", zone: "", phone: "", description: "",
    lat: -34.6037, lng: -58.3816,
  });
  const [fotosForm, setFotosForm] = useState<File[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [zonaProvince, setZonaProvince] = useState("");
  const [zonaMuni, setZonaMuni] = useState("");
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
    const zone = buildZona(zonaProvince, zonaMuni);
    const { data } = await supabase.from("perdidas").insert({ ...form, zone, user_id: user.id, tipo: reportingType }).select();
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
    setZonaProvince("");
    setZonaMuni("");
    setFotosForm([]);
    setFotoPreviews([]);
    if (fileRef.current) fileRef.current.value = "";
    setReporting(false);
    setLoading(false);
  }

  function daysSince(dateStr: string) {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  }

  const fieldsTop: [string, string][] = [
    ["Nombre de la mascota", "pet_name"],
    ["Raza", "breed"],
    ["Color / descripción física", "color"],
  ];
  const fieldsBottom: [string, string][] = [
    ["Teléfono de contacto", "phone"],
  ];

  const perdidasFiltradas = perdidas.filter(p =>
    subTab === "perdidas" ? (!p.tipo || p.tipo === "perdida") : p.tipo === "encontrada"
  );

  return (
    <div className="community-tab-panel community-tab-perdidas">
      {/* Sub-tabs Perdidas / Encontradas */}
      <div className="community-segmented" style={{ display: "flex", gap: 8, marginBottom: 16, background: "#F4F6FB", borderRadius: 12, padding: 4 }}>
        {([["perdidas", "Perdidas", "#EF4444"], ["encontradas", "Encontradas", "#2CB8AD"]] as const).map(([key, label, color]) => (
          <button key={key} onClick={() => setSubTab(key)} style={{
            flex: 1, border: "none", borderRadius: 10, padding: "8px 4px",
            background: subTab === key ? "#E2E8F0" : "transparent",
            color: subTab === key ? color : "#64748B",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* Botones de reporte */}
      <div className="community-action-row" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setReportingType("perdida"); setReporting(!reporting || reportingType !== "perdida"); }} style={{
          flex: 1, background: "#FFF0F0", color: "#EF4444",
          border: "1px solid #FECACA", borderRadius: 12, padding: 12,
          fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          Reportar pérdida
        </button>
        <button onClick={() => { setReportingType("encontrada"); setReporting(!reporting || reportingType !== "encontrada"); }} style={{
          flex: 1, background: "#E5F7F6", color: "#2CB8AD",
          border: "1px solid #B2E8E5", borderRadius: 12, padding: 12,
          fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          Encontré una
        </button>
      </div>

      {reporting && (
        <Card style={{ border: `1px solid ${reportingType === "perdida" ? "#FECACA" : "#B2E8E5"}` }}>
          <div style={{ fontWeight: 700, color: reportingType === "perdida" ? "#EF4444" : "#2CB8AD", marginBottom: 12 }}>
            {reportingType === "perdida" ? "Nueva alerta de mascota perdida" : "Reportar mascota encontrada"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fieldsTop.map(([label, key]) => (
              <input key={key} placeholder={label} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            ))}
            <select
              value={zonaProvince}
              onChange={e => { setZonaProvince(e.target.value); setZonaMuni(""); }}
              style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: zonaProvince ? "#1C3557" : "#94a3b8", fontSize: 13 }}
            >
              <option value="">Provincia donde se perdió</option>
              {PROVINCIAS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {zonaProvince && (
              <select
                value={zonaMuni}
                onChange={e => setZonaMuni(e.target.value)}
                style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: zonaMuni ? "#1C3557" : "#94a3b8", fontSize: 13 }}
              >
                <option value="">Ciudad / Localidad</option>
                {(MUNICIPIOS_POR_PROVINCIA[zonaProvince] || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {fieldsBottom.map(([label, key]) => (
              <input key={key} placeholder={label} value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
            ))}
            <textarea placeholder="Descripción adicional..." rows={2} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", resize: "none" }} />
            {/* Fotos */}
            <div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>Fotos de la mascota</div>
              {fotoPreviews.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {fotoPreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={src} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #FECACA" }} />
                      <button onClick={() => { setFotosForm(p => p.filter((_, idx) => idx !== i)); setFotoPreviews(p => p.filter((_, idx) => idx !== i)); }} style={{
                        position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff",
                        border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12,
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => fileRef.current?.click()} style={{
                background: "#E2E8F0", color: "#64748B", border: "1px solid #CBD5E1",
                borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>📷 Agregar fotos</button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFotos} />
            </div>

            <button onClick={handleReport} disabled={loading} style={{
              background: reportingType === "perdida" ? "#EF4444" : "#2CB8AD",
              color: reportingType === "perdida" ? "#fff" : "#000", border: "none",
              borderRadius: 10, padding: 12, fontWeight: 800, opacity: loading ? 0.6 : 1, cursor: "pointer",
            }}>{loading ? "Publicando..." : "Publicar"}</button>
          </div>
        </Card>
      )}

      {perdidasFiltradas.length === 0 && !reporting && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{subTab === "perdidas" ? "📍" : "✅"}</div>
          <p style={{ color: "#64748B", fontSize: 13 }}>
            {subTab === "perdidas" ? "No hay mascotas perdidas reportadas." : "No hay mascotas encontradas reportadas."}
          </p>
        </Card>
      )}

      {perdidasFiltradas.map((p: any, i: number) => {
        const owner = profiles[p.user_id];
        const foto = fotos[p.user_id];
        const isGato = p.breed?.toLowerCase().includes("gato") || p.breed?.toLowerCase().includes("cat");
        const days = daysSince(p.created_at);

        const uploadedPhotos: string[] = (() => { try { return JSON.parse(p.photo_urls || "[]"); } catch { return []; } })();

        const isEncontrada = p.tipo === "encontrada";
        return (
          <Card key={i} style={{ border: `1px solid ${isEncontrada ? "#B2E8E5" : "#FFF0F0"}` }}>
            {/* Fotos subidas por el usuario */}
            {uploadedPhotos.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
                {uploadedPhotos.map((url, pi) => (
                  <img key={pi} src={url} style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #FECACA" }} />
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Foto de perfil del dueño (si no hay fotos subidas) */}
              {uploadedPhotos.length === 0 && (
                <div style={{
                  width: 64, height: 64, borderRadius: 12, flexShrink: 0,
                  background: "#E2E8F0", border: "2px solid #FECACA",
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{p.pet_name}</span>
                    {isEncontrada && (
                      <span style={{ background: "#E5F7F6", color: "#2CB8AD", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>ENCONTRADA</span>
                    )}
                  </div>
                  <span style={{
                    background: days <= 2 ? "#FFF0F0" : "#FFF7ED",
                    color: days <= 2 ? "#EF4444" : "#F97316",
                    borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}>hace {days}d</span>
                </div>

                <div style={{ color: "#64748B", fontSize: 12, marginBottom: 2 }}>
                  {p.breed}{p.color ? ` · ${p.color}` : ""}
                </div>
                {p.zone && (
                  <div style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>📍 {p.zone}</div>
                )}
                {p.description && (
                  <div style={{ fontSize: 12, color: "#1C3557", marginBottom: 8, lineHeight: 1.4 }}>{p.description}</div>
                )}

                {/* Datos del dueño */}
                <div style={{ background: "#F4F6FB", borderRadius: 10, padding: "8px 12px", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Contacto</div>
                  {owner?.full_name && (
                    <div style={{ fontSize: 13, color: "#1C3557", marginBottom: 2 }}>👤 {owner.full_name}</div>
                  )}
                  {(p.phone || owner?.phone) && (
                    <div style={{ fontSize: 12, color: "#64748B" }}>📞 Disponible por WhatsApp</div>
                  )}
                </div>

                {p.phone && (
                  <a href={"https://wa.me/" + p.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer" style={{
                    display: "inline-block", background: "#E5F7F6", color: "#2CB8AD",
                    border: "1px solid #B2E8E5", borderRadius: 8, padding: "6px 14px",
                    fontSize: 12, fontWeight: 700, textDecoration: "none",
                  }}>Contactar por WhatsApp</a>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Tab: Profesionales ───────────────────────────────────────────────────────
const ESPECIALIDADES_GENERALES = ["Veterinario", "Peluquero", "Adestrador", "Guarderia", "Nutricionista", "Otro"];

const ESPECIALIDADES_MEDICAS = [
  "Dermatología", "Oncología", "Gastroenterología", "Cardiología",
  "Etología", "Endocrinología", "Oftalmología", "Neurología",
  "Traumatología", "Odontología", "Nefrología", "Reproducción", "Exóticos",
];

const iconEsp: Record<string, string> = {
  // Generales
  Veterinario: "🏥", Peluquero: "✂️", Adestrador: "🎓",
  Guarderia: "🏠", Nutricionista: "🥗", Otro: "🐾",
  // Especialistas
  "Dermatología": "🔬", "Oncología": "🩺", "Gastroenterología": "💊",
  "Cardiología": "❤️", "Etología": "🧠", "Endocrinología": "⚗️",
  "Oftalmología": "👁️", "Neurología": "🧬", "Traumatología": "🦴",
  "Odontología": "🦷", "Nefrología": "💧", "Reproducción": "🐣",
  "Exóticos": "🦜",
};

const FORM_EMPTY = { nombre: "", especialidad: "Veterinario", descripcion: "", direccion: "", telefono: "", instagram: "", email: "" };

function ProfCard({ p }: { p: any }) {
  const isEspecialista = ESPECIALIDADES_MEDICAS.includes(p.especialidad);
  return (
    <div style={{
      background: "#fff",
      border: isEspecialista ? "1px solid #E9D5FF" : "1px solid #E2E8F0",
      borderRadius: 14,
      padding: "14px 16px",
      marginBottom: 10,
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: isEspecialista ? "#F5F3FF" : "#F0FDF4",
        border: isEspecialista ? "1px solid #E9D5FF" : "1px solid #BBF7D0",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
      }}>
        {iconEsp[p.especialidad] || "🐾"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: "#1C3557" }}>{p.nombre}</span>
          {p.verified && <span style={{ fontSize: 10, background: "#D1FAE5", color: "#065F46", borderRadius: 20, padding: "1px 7px", fontWeight: 700 }}>✓ Verificado</span>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: isEspecialista ? "#8B5CF6" : "#3B82F6", marginTop: 2 }}>
          {p.especialidad}
        </div>
        {p.descripcion && <div style={{ color: "#64748B", fontSize: 12, marginTop: 4, lineHeight: 1.4 }}>{p.descripcion}</div>}
        {p.zona && <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 4 }}>📍 {p.zona}</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {p.telefono && (
            <a href={`https://wa.me/${p.telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{
              background: "#25D366", color: "#fff", borderRadius: 8, padding: "4px 10px",
              fontSize: 11, fontWeight: 700, textDecoration: "none",
            }}>WhatsApp</a>
          )}
          {p.instagram && (
            <a href={`https://instagram.com/${p.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={{
              background: "#F1F5F9", color: "#64748B", borderRadius: 8, padding: "4px 10px",
              fontSize: 11, fontWeight: 700, textDecoration: "none",
            }}>Instagram</a>
          )}
          {p.email && (
            <a href={`mailto:${p.email}`} style={{
              background: "#F1F5F9", color: "#64748B", borderRadius: 8, padding: "4px 10px",
              fontSize: 11, fontWeight: 700, textDecoration: "none",
            }}>Email</a>
          )}
        </div>
      </div>
    </div>
  );
}

function TabProfesionales() {
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("Todos");
  const [subfiltro, setSubfiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [miPerfil, setMiPerfil] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<typeof FORM_EMPTY>(FORM_EMPTY);
  const [provincia, setProvincia] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmBaja, setConfirmBaja] = useState(false);
  const supabase = createClient();

  useEffect(function() { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
    const { data } = await supabase
      .from("profesionales")
      .select("*")
      .eq("active", true)
      .order("verified", { ascending: false })
      .order("created_at", { ascending: false });
    const lista = data || [];
    setProfesionales(lista);
    if (user) {
      const mio = lista.find((p: any) => p.user_id === user.id);
      if (mio) setMiPerfil(mio);
    }
    setLoading(false);
  }

  function openCreate() {
    setForm(FORM_EMPTY);
    setProvincia("");
    setMunicipio("");
    setEditMode(false);
    setShowForm(true);
  }

  function openEdit() {
    if (!miPerfil) return;
    setForm({
      nombre: miPerfil.nombre || "",
      especialidad: miPerfil.especialidad || "Veterinario",
      descripcion: miPerfil.descripcion || "",
      direccion: miPerfil.direccion || "",
      telefono: miPerfil.telefono || "",
      instagram: miPerfil.instagram || "",
      email: miPerfil.email || "",
    });
    setProvincia(miPerfil.provincia || "");
    setMunicipio(miPerfil.municipio || "");
    setEditMode(true);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.nombre.trim()) return;
    setSaving(true);
    const zona = buildZona(provincia, municipio);
    const payload = { ...form, zona, provincia, municipio, updated_at: new Date().toISOString() };
    if (editMode && miPerfil) {
      const { data } = await supabase.from("profesionales").update(payload).eq("id", miPerfil.id).select().single();
      if (data) {
        setMiPerfil(data);
        setProfesionales(prev => prev.map(p => p.id === data.id ? data : p));
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profesionales").insert({ ...payload, user_id: user!.id, active: true }).select().single();
      if (data) {
        setMiPerfil(data);
        setProfesionales(prev => [data, ...prev]);
      }
    }
    setSaving(false);
    setShowForm(false);
  }

  async function handleBaja() {
    if (!miPerfil) return;
    await supabase.from("profesionales").update({ active: false }).eq("id", miPerfil.id);
    setProfesionales(prev => prev.filter(p => p.id !== miPerfil.id));
    setMiPerfil(null);
    setConfirmBaja(false);
  }

  const lista = (() => {
    if (filtro === "Todos") return profesionales;
    if (filtro === "Especialistas") {
      const base = profesionales.filter(p => ESPECIALIDADES_MEDICAS.includes(p.especialidad));
      return subfiltro === "Todos" ? base : base.filter(p => p.especialidad === subfiltro);
    }
    return profesionales.filter(p => p.especialidad === filtro);
  })();

  const especialistas = profesionales.filter(p => ESPECIALIDADES_MEDICAS.includes(p.especialidad));
  const generales = profesionales.filter(p => !ESPECIALIDADES_MEDICAS.includes(p.especialidad));

  if (loading) return (
    <div style={{ padding: "16px 0" }}>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14, marginBottom: 10 }} />
      ))}
    </div>
  );

  return (
    <div className="community-tab-panel community-tab-profesionales">
      <p style={{ color: "#64748B", fontSize: 13, marginBottom: 14 }}>
        Cartilla de veterinarios, peluqueros y especialistas de la comunidad.
      </p>

      {/* Mi perfil activo */}
      {miPerfil && (
        <Card style={{ border: "1px solid #BFDBFE", background: "linear-gradient(135deg,#EFF6FF,#fff)", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#3B82F6", letterSpacing: 1, textTransform: "uppercase" }}>
              {miPerfil.verified ? "✅ Perfil verificado" : "Tu perfil en la cartilla"}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={openEdit} style={{
                background: "#EFF6FF", color: "#3B82F6", border: "1px solid #BFDBFE",
                borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>Editar</button>
              <button onClick={() => setConfirmBaja(true)} style={{
                background: "#FFF0F0", color: "#EF4444", border: "1px solid #FECACA",
                borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>Dar de baja</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "#EFF6FF", border: "1px solid #BFDBFE",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, overflow: "hidden",
            }}>
              {iconEsp[miPerfil.especialidad] || "🐾"}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{miPerfil.nombre}</div>
              <div style={{ color: "#3B82F6", fontSize: 11, marginTop: 2 }}>{miPerfil.especialidad}</div>
              {miPerfil.zona && <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>📍 {miPerfil.zona}</div>}
              {miPerfil.direccion && <div style={{ color: "#64748B", fontSize: 11, marginTop: 1 }}>🏠 {miPerfil.direccion}</div>}
            </div>
          </div>
          {confirmBaja && (
            <div style={{ marginTop: 12, background: "#FFF0F0", borderRadius: 10, padding: "10px 14px" }}>
              <div style={{ fontSize: 13, color: "#EF4444", fontWeight: 700, marginBottom: 8 }}>
                ¿Dar de baja tu perfil de la cartilla?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleBaja} style={{
                  background: "#EF4444", color: "#fff", border: "none",
                  borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
                }}>Confirmar</button>
                <button onClick={() => setConfirmBaja(false)} style={{
                  background: "#E2E8F0", color: "#64748B", border: "none",
                  borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer",
                }}>Cancelar</button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Filtros principales */}
      <div className="community-chip-row" style={{ display: "flex", gap: 6, marginBottom: 8, overflowX: "auto", paddingBottom: 4 }}>
        {["Todos", ...ESPECIALIDADES_GENERALES, "Especialistas"].map(e => (
          <button key={e} onClick={() => { setFiltro(e); setSubfiltro("Todos"); }} style={{
            background: filtro === e ? (e === "Especialistas" ? "#F5F3FF" : "#EFF6FF") : "#FFFFFF",
            border: "1px solid " + (filtro === e ? (e === "Especialistas" ? "#8B5CF6" : "#3B82F6") : "#E2E8F0"),
            color: filtro === e ? (e === "Especialistas" ? "#8B5CF6" : "#3B82F6") : "#64748B",
            borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {e === "Especialistas" ? "🔬 Especialistas" : e}
          </button>
        ))}
      </div>

      {/* Sub-filtros de especialidades médicas */}
      {filtro === "Especialistas" && (
        <div className="community-chip-row" style={{ display: "flex", gap: 5, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {["Todos", ...ESPECIALIDADES_MEDICAS].map(s => (
            <button key={s} onClick={() => setSubfiltro(s)} style={{
              background: subfiltro === s ? "#F5F3FF" : "#FAFAFA",
              border: "1px solid " + (subfiltro === s ? "#8B5CF6" : "#E2E8F0"),
              color: subfiltro === s ? "#8B5CF6" : "#94A3B8",
              borderRadius: 20, padding: "4px 10px", fontSize: 10, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>
              {s !== "Todos" && (iconEsp[s] + " ")}{s}
            </button>
          ))}
        </div>
      )}

      {/* Vista "Todos": sección especial de especialistas + generales */}
      {filtro === "Todos" && especialistas.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px" }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#8B5CF6" }}>🔬 Especialistas</span>
            <div style={{ flex: 1, height: 1, background: "#E9D5FF" }} />
          </div>
          {especialistas.map((p: any) => <ProfCard key={p.id} p={p} />)}
          {generales.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0 10px" }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#3B82F6" }}>🏥 Generales</span>
              <div style={{ flex: 1, height: 1, background: "#BFDBFE" }} />
            </div>
          )}
        </>
      )}

      {/* Lista filtrada */}
      {lista.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>La cartilla está vacía por ahora</div>
          <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>
            Sé el primero en aparecer en la cartilla de tu zona.
          </p>
        </Card>
      )}

      {filtro === "Todos"
        ? generales.map((p: any) => <ProfCard key={p.id} p={p} />)
        : lista.map((p: any) => <ProfCard key={p.id} p={p} />)
      }

      {/* CTA unirse a la cartilla */}
      {!miPerfil && (
        <Card style={{ border: "1px solid #BFDBFE", background: "linear-gradient(135deg,#EFF6FF,#fff)", marginTop: 8 }}>
          {showForm ? (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#1C3557", marginBottom: 14 }}>
                Registrar mi perfil profesional
              </div>
              <div className="community-form" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre / Nombre del negocio *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
                <select value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", fontSize: 13 }}>
                  <optgroup label="Generales">
                    {ESPECIALIDADES_GENERALES.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                  </optgroup>
                  <optgroup label="Especialistas médicos">
                    {ESPECIALIDADES_MEDICAS.map(esp => <option key={esp} value={esp}>{iconEsp[esp]} {esp}</option>)}
                  </optgroup>
                </select>
                <input placeholder="Descripción breve de tus servicios" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
                <select value={provincia} onChange={e => { setProvincia(e.target.value); setMunicipio(""); }} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: provincia ? "#1C3557" : "#94a3b8", fontSize: 13 }}>
                  <option value="">Provincia</option>
                  {PROVINCIAS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                {provincia && (
                  <select value={municipio} onChange={e => setMunicipio(e.target.value)} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: municipio ? "#1C3557" : "#94a3b8", fontSize: 13 }}>
                    <option value="">Ciudad / Barrio</option>
                    {(MUNICIPIOS_POR_PROVINCIA[provincia] || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
                <input placeholder="Dirección (ej: Av. Corrientes 1234)" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
                <input placeholder="WhatsApp (con código de área)" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
                <input placeholder="Instagram (@usuario)" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
                <input placeholder="Email de contacto" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleSave} disabled={saving || !form.nombre.trim()} style={{
                    flex: 1, background: "linear-gradient(135deg,#3B82F6,#2563EB)",
                    color: "#fff", border: "none", borderRadius: 10, padding: 12,
                    fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: (saving || !form.nombre.trim()) ? 0.6 : 1,
                  }}>{saving ? "Guardando..." : "Publicar perfil"}</button>
                  <button onClick={() => setShowForm(false)} style={{
                    background: "#E2E8F0", color: "#64748B", border: "none",
                    borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                  }}>Cancelar</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="community-cta-row" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🏥</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>¿Sos profesional del mundo animal?</div>
                <div style={{ color: "#64748B", fontSize: 12 }}>Registrá tu perfil y aparecé en la cartilla al instante</div>
              </div>
              <button onClick={openCreate} style={{
                background: "linear-gradient(135deg,#3B82F6,#2563EB)",
                color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px",
                fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0,
              }}>Unirme</button>
            </div>
          )}
        </Card>
      )}

      {/* Modal edición */}
      {showForm && editMode && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setShowForm(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "24px 20px",
            width: "100%", maxWidth: 420, maxHeight: "85vh", overflowY: "auto",
            boxShadow: "0 8px 48px rgba(28,53,87,0.18)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 900, fontSize: 16, color: "#1C3557", marginBottom: 16 }}>Editar mi perfil</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input placeholder="Nombre *" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              <select value={form.especialidad} onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", fontSize: 13 }}>
                <optgroup label="Generales">
                  {ESPECIALIDADES_GENERALES.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                </optgroup>
                <optgroup label="Especialistas médicos">
                  {ESPECIALIDADES_MEDICAS.map(esp => <option key={esp} value={esp}>{iconEsp[esp]} {esp}</option>)}
                </optgroup>
              </select>
              <input placeholder="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              <select value={provincia} onChange={e => { setProvincia(e.target.value); setMunicipio(""); }} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: provincia ? "#1C3557" : "#94a3b8", fontSize: 13 }}>
                <option value="">Provincia</option>
                {PROVINCIAS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {provincia && (
                <select value={municipio} onChange={e => setMunicipio(e.target.value)} style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: municipio ? "#1C3557" : "#94a3b8", fontSize: 13 }}>
                  <option value="">Ciudad / Barrio</option>
                  {(MUNICIPIOS_POR_PROVINCIA[provincia] || []).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
              <input placeholder="WhatsApp" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
              <input placeholder="Instagram (@usuario)" value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} />
              <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 1, background: "linear-gradient(135deg,#3B82F6,#2563EB)",
                  color: "#fff", border: "none", borderRadius: 10, padding: 12,
                  fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: saving ? 0.6 : 1,
                }}>{saving ? "Guardando..." : "Guardar cambios"}</button>
                <button onClick={() => setShowForm(false)} style={{
                  background: "#E2E8F0", color: "#64748B", border: "none",
                  borderRadius: 10, padding: "12px 16px", cursor: "pointer",
                }}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Comunidad() {
  const [tab, setTab] = useState<Tab>("adopciones");

  return (
    <div className="community-page">
      <div className="community-hero">
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Comunidad 👥</h2>
        <p style={{ color: "#64748B", fontSize: 12, marginBottom: 16 }}>Tu espacio para conocer tutores, organizar juntadas y compartir experiencias</p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === "explorar" && <TabExplorar />}
      {tab === "juntadas" && <TabJuntadas />}
      {tab === "adopciones" && <Adopciones />}
      {tab === "perdidas" && <TabPerdidas />}
      {tab === "profesionales" && <TabProfesionales />}
      {tab === "descuentos" && <TabDescuentos />}
    </div>
  );
}
