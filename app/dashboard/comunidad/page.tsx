"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import Adopciones from "@/components/Adopciones";
import { timeAgo } from "@/lib/utils";

type Tab = "explorar" | "adopciones" | "perdidas" | "profesionales" | "descuentos";

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
    { key: "explorar", label: "Explorar", icon: "🐾" },
    { key: "adopciones", label: "Adopcion", icon: "❤️" },
    { key: "perdidas", label: "Perdidas", icon: "📍" },
    { key: "profesionales", label: "Pros", icon: "🏥" },
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
  const supabase = createClient();

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
      supabase.from("comunidad_mensajes").select("*").order("created_at", { ascending: false }).limit(30),
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

    const entry = {
      user_id: user.id,
      author_name: miMascota?.name ? `Tutor de ${miMascota.name}` : "Tutor",
      mascota_name: miMascota?.name || null,
      message: msgText.trim(),
      photo_url,
    };
    const { data: saved } = await supabase.from("comunidad_mensajes").insert(entry).select();
    if (saved?.[0]) setMensajes(prev => [saved[0], ...prev]);
    setMsgText("");
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


  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#7a8299" }}>Cargando...</div>;

  return (
    <div>
      <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 14 }}>
        Mascotas públicas — coordiná paseos, viajes o simplemente conectá con tutores de la misma raza 🐾
      </p>

      {/* Buscador y filtro */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          placeholder="🔍 Buscar por nombre, raza o zona..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, fontSize: 13 }}
        />
      </div>
      {razas.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          <button onClick={() => setRaza("")} style={{
            background: !raza ? "#4ade8022" : "#181c27",
            border: `1px solid ${!raza ? "#4ade80" : "#252a3a"}`,
            color: !raza ? "#4ade80" : "#7a8299",
            borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>Todas</button>
          {razas.map(r => (
            <button key={r} onClick={() => setRaza(r === raza ? "" : r)} style={{
              background: raza === r ? "#4ade8022" : "#181c27",
              border: `1px solid ${raza === r ? "#4ade80" : "#252a3a"}`,
              color: raza === r ? "#4ade80" : "#7a8299",
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
          <p style={{ color: "#7a8299", fontSize: 13 }}>
            Activá el perfil público de tu mascota desde la pestaña Perfil para aparecer acá.
          </p>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {filtered.map((m: any, i: number) => {
          const isGato = m.breed?.toLowerCase().includes("gato");
          const owner = m.profiles;
          return (
            <div key={i} style={{
              background: "#181c27", border: "1px solid #252a3a",
              borderRadius: 16, overflow: "hidden",
            }}>
              {/* Foto */}
              <div style={{
                height: 120, background: "#252a3a",
                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
              }}>
                {m.photo_url
                  ? <img src={m.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 52 }}>{isGato ? "🐱" : "🐕"}</span>
                }
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 2 }}>{m.name}</div>
                <div style={{ color: "#7a8299", fontSize: 11, marginBottom: 6 }}>
                  {m.breed}{m.age ? ` · ${m.age}` : ""}{m.sex ? ` · ${m.sex}` : ""}
                </div>
                {m.location && (
                  <div style={{ fontSize: 11, color: "#60a5fa", marginBottom: 8 }}>📍 {m.location}</div>
                )}
                {owner?.phone && (
                  <a href={"https://wa.me/" + owner.phone.replace(/\D/g, "")} target="_blank" rel="noreferrer"
                    style={{
                      display: "block", background: "#4ade8022", color: "#4ade80",
                      border: "1px solid #4ade8044", borderRadius: 8, padding: "6px 0",
                      fontSize: 11, fontWeight: 700, textDecoration: "none", textAlign: "center",
                    }}>💬 Contactar</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mural de la comunidad ── */}
      <div style={{ marginTop: 28, marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>
          Mural de la comunidad
        </div>

        {/* Formulario de publicación */}
        <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 14, marginBottom: 16 }}>
          <textarea
            placeholder={miMascota ? `Compartí algo sobre ${miMascota.name}...` : "Compartí algo con la comunidad..."}
            value={msgText}
            onChange={e => setMsgText(e.target.value)}
            rows={3}
            style={{
              background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10,
              padding: "10px 14px", color: "#f0f4ff", resize: "none", width: "100%",
              fontSize: 13, marginBottom: 10,
            }}
          />
          {photoPreview && (
            <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
              <img src={photoPreview} style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", border: "1px solid #4ade8044" }} />
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }} style={{
                position: "absolute", top: -6, right: -6, background: "#f87171", color: "#fff",
                border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>×</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fileRef.current?.click()} style={{
              background: "#252a3a", color: "#7a8299", border: "1px solid #353a4a",
              borderRadius: 10, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>📷</button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
            <button onClick={sendMsg} disabled={sendingMsg || !msgText.trim()} style={{
              flex: 1, background: msgText.trim() ? "linear-gradient(135deg, #4ade80, #22c55e)" : "#252a3a",
              color: msgText.trim() ? "#000" : "#7a8299", border: "none",
              borderRadius: 10, padding: "8px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer",
              opacity: sendingMsg ? 0.6 : 1,
            }}>{sendingMsg ? "Publicando..." : "Publicar"}</button>
          </div>
        </div>

        {/* Feed de mensajes */}
        {mensajes.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#7a8299", fontSize: 13 }}>
            Sé el primero en publicar algo 🐾
          </div>
        )}
        {mensajes.map((msg: any, i: number) => (
          <div key={i} style={{
            background: "#181c27", border: "1px solid #252a3a",
            borderRadius: 14, padding: 14, marginBottom: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: "#4ade8022",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
                }}>🐾</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{msg.author_name || "Tutor"}</div>
                  {msg.mascota_name && (
                    <div style={{ fontSize: 11, color: "#4ade80" }}>🐕 {msg.mascota_name}</div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "#7a8299" }}>{timeAgo(msg.created_at)}</span>
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

// ─── Tab: Descuentos ──────────────────────────────────────────────────────────
function TabDescuentos() {
  const [showForm, setShowForm] = useState(false);
  const [bizForm, setBizForm] = useState({ nombre: "", rubro: "", email: "", descuento: "" });
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleSendBiz() {
    if (!bizForm.nombre || !bizForm.email) return;
    await supabase.from("descuento_requests").insert(bizForm).select();
    setSent(true);
    setShowForm(false);
  }

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

      {/* CTA para negocios */}
      <div style={{ marginTop: 8 }}>
        {sent ? (
          <Card style={{ textAlign: "center", border: "1px solid #4ade8044" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>¡Recibimos tu consulta!</div>
            <div style={{ color: "#7a8299", fontSize: 13 }}>Te contactamos pronto para sumar tu negocio.</div>
          </Card>
        ) : (
          <Card style={{ border: "1px solid #f472b633", background: "linear-gradient(135deg, #1a0f2a, #181c27)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: showForm ? 14 : 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: "#f472b622",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
              }}>🏪</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 2 }}>¿Tenés un negocio pet-friendly?</div>
                <div style={{ color: "#7a8299", fontSize: 12 }}>Sumá tu descuento y llegá a miles de tutores</div>
              </div>
              <button onClick={() => setShowForm(!showForm)} style={{
                background: "linear-gradient(135deg, #f472b6, #ec4899)",
                color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px",
                fontSize: 12, fontWeight: 800, cursor: "pointer", flexShrink: 0,
              }}>Quiero aparecer</button>
            </div>
            {showForm && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input placeholder="Nombre del negocio *" value={bizForm.nombre} onChange={e => setBizForm(f => ({ ...f, nombre: e.target.value }))} />
                <input placeholder="Rubro (ej: veterinaria, peluquería)" value={bizForm.rubro} onChange={e => setBizForm(f => ({ ...f, rubro: e.target.value }))} />
                <input placeholder="Email de contacto *" type="email" value={bizForm.email} onChange={e => setBizForm(f => ({ ...f, email: e.target.value }))} />
                <input placeholder="Descuento que ofrecés (ej: 15% en consultas)" value={bizForm.descuento} onChange={e => setBizForm(f => ({ ...f, descuento: e.target.value }))} />
                <button onClick={handleSendBiz} style={{
                  background: "linear-gradient(135deg, #f472b6, #ec4899)",
                  color: "#fff", border: "none", borderRadius: 10, padding: 12,
                  fontWeight: 800, fontSize: 14, cursor: "pointer",
                }}>Enviar consulta →</button>
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
    const { data } = await supabase.from("perdidas").insert({ ...form, user_id: user.id, tipo: reportingType }).select();
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

  const perdidasFiltradas = perdidas.filter(p =>
    subTab === "perdidas" ? (!p.tipo || p.tipo === "perdida") : p.tipo === "encontrada"
  );

  return (
    <div>
      {/* Sub-tabs Perdidas / Encontradas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, background: "#0f1117", borderRadius: 12, padding: 4 }}>
        {([["perdidas", "📍 Perdidas", "#f87171"], ["encontradas", "✅ Encontradas", "#4ade80"]] as const).map(([key, label, color]) => (
          <button key={key} onClick={() => setSubTab(key)} style={{
            flex: 1, border: "none", borderRadius: 10, padding: "8px 4px",
            background: subTab === key ? "#252a3a" : "transparent",
            color: subTab === key ? color : "#7a8299",
            fontWeight: 700, fontSize: 12, cursor: "pointer",
          }}>{label}</button>
        ))}
      </div>

      {/* Botones de reporte */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setReportingType("perdida"); setReporting(!reporting || reportingType !== "perdida"); }} style={{
          flex: 1, background: "#f8717122", color: "#f87171",
          border: "1px solid #f8717144", borderRadius: 12, padding: 12,
          fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          📍 Reportar perdida
        </button>
        <button onClick={() => { setReportingType("encontrada"); setReporting(!reporting || reportingType !== "encontrada"); }} style={{
          flex: 1, background: "#4ade8022", color: "#4ade80",
          border: "1px solid #4ade8044", borderRadius: 12, padding: 12,
          fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          ✅ Encontré una
        </button>
      </div>

      {reporting && (
        <Card style={{ border: `1px solid ${reportingType === "perdida" ? "#f8717144" : "#4ade8044"}` }}>
          <div style={{ fontWeight: 700, color: reportingType === "perdida" ? "#f87171" : "#4ade80", marginBottom: 12 }}>
            {reportingType === "perdida" ? "📍 Nueva alerta de mascota perdida" : "✅ Reportar mascota encontrada"}
          </div>
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
              background: reportingType === "perdida" ? "#f87171" : "#4ade80",
              color: reportingType === "perdida" ? "#fff" : "#000", border: "none",
              borderRadius: 10, padding: 12, fontWeight: 800, opacity: loading ? 0.6 : 1, cursor: "pointer",
            }}>{loading ? "Publicando..." : "Publicar"}</button>
          </div>
        </Card>
      )}

      {perdidasFiltradas.length === 0 && !reporting && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>{subTab === "perdidas" ? "📍" : "✅"}</div>
          <p style={{ color: "#7a8299", fontSize: 13 }}>
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
          <Card key={i} style={{ border: `1px solid ${isEncontrada ? "#4ade8033" : "#f8717122"}` }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 16 }}>{p.pet_name}</span>
                    {isEncontrada && (
                      <span style={{ background: "#4ade8022", color: "#4ade80", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>ENCONTRADA</span>
                    )}
                  </div>
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

// ─── Tab: Profesionales ───────────────────────────────────────────────────────
const ESPECIALIDADES = ["Todos", "Veterinario", "Peluquero", "Adestrador", "Guarderia", "Nutricionista", "Otro"];

function TabProfesionales() {
  const [profesionales, setProfesionales] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(function() {
    const url = "https://amyosmkbldgdxuqepxqu.supabase.co/storage/v1/object/public/comunidad/profesionales.json";
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        setProfesionales(Array.isArray(data) ? data.filter(function(p: any) { return p.active !== false; }) : []);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, []);

  const lista = filtro === "Todos" ? profesionales : profesionales.filter(function(p) { return p.especialidad === filtro; });

  const iconEsp: Record<string, string> = {
    Veterinario: "🏥", Peluquero: "✂️", Adestrador: "🎓",
    Guarderia: "🏠", Nutricionista: "🥗", Otro: "🐾",
  };

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#7a8299" }}>Cargando...</div>;

  return (
    <div>
      <p style={{ color: "#7a8299", fontSize: 13, marginBottom: 14 }}>
        Veterinarios, peluqueros y especialistas recomendados por la comunidad.
      </p>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {ESPECIALIDADES.map(function(e) {
          return (
            <button key={e} onClick={function() { setFiltro(e); }} style={{
              background: filtro === e ? "#60a5fa22" : "#181c27",
              border: "1px solid " + (filtro === e ? "#60a5fa" : "#252a3a"),
              color: filtro === e ? "#60a5fa" : "#7a8299",
              borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
            }}>{e}</button>
          );
        })}
      </div>

      {lista.length === 0 && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Sin profesionales todavia</div>
          <p style={{ color: "#7a8299", fontSize: 13, lineHeight: 1.6 }}>
            Pronto vamos a listar veterinarios, peluqueros y especialistas de tu zona.
          </p>
        </Card>
      )}

      {lista.map(function(p: any, i: number) {
        return (
          <Card key={i} style={{ border: "1px solid #60a5fa22" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "#60a5fa18", border: "1px solid #60a5fa33",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, overflow: "hidden",
              }}>
                {p.foto_url
                  ? <img src={p.foto_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : iconEsp[p.especialidad] || "🐾"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{p.nombre}</div>
                  <span style={{ background: "#60a5fa18", color: "#60a5fa", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 800, flexShrink: 0, marginLeft: 8 }}>
                    {p.especialidad}
                  </span>
                </div>
                {p.descripcion && <div style={{ color: "#7a8299", fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>{p.descripcion}</div>}
                {p.zona && <div style={{ color: "#60a5fa", fontSize: 12, marginTop: 4 }}>📍 {p.zona}</div>}
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {p.telefono && (
                    <a href={"https://wa.me/" + p.telefono.replace(/\D/g, "")} target="_blank" rel="noreferrer" style={{
                      background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
                      borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none",
                    }}>WhatsApp</a>
                  )}
                  {p.instagram && (
                    <a href={"https://instagram.com/" + p.instagram.replace("@", "")} target="_blank" rel="noreferrer" style={{
                      background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
                      borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none",
                    }}>Instagram</a>
                  )}
                  {p.email && (
                    <a href={"mailto:" + p.email} style={{
                      background: "#a78bfa22", color: "#a78bfa", border: "1px solid #a78bfa44",
                      borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none",
                    }}>Email</a>
                  )}
                </div>
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
      <p style={{ color: "#7a8299", fontSize: 12, marginBottom: 16 }}>Explora mascotas, adopciones, profesionales y descuentos</p>

      <TabBar active={tab} onChange={setTab} />

      {tab === "explorar" && <TabExplorar />}
      {tab === "adopciones" && <Adopciones />}
      {tab === "perdidas" && <TabPerdidas />}
      {tab === "profesionales" && <TabProfesionales />}
      {tab === "descuentos" && <TabDescuentos />}
    </div>
  );
}
