"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { UiCard } from "@/components/ui";
import { MUNICIPIOS_POR_PROVINCIA, PROVINCIAS_LIST, buildZona } from "@/lib/locations";

const MAX_POSTULACIONES = 10;

function Card({ children, style = {} }: any) {
  return <UiCard className="community-card community-adoption-card" style={{ background: "#181c27", border: "1px solid #252a3a", ...style }}>{children}</UiCard>;
}

function getEmoji(breed: string) {
  if (!breed) return "🐾";
  if (breed.toLowerCase().includes("gato") || breed.toLowerCase().includes("persa") || breed.toLowerCase().includes("siamés")) return "🐱";
  if (breed.toLowerCase().includes("conejo")) return "🐰";
  return "🐕";
}

function parsePhotos(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ─── Formulario de postulación ────────────────────────────────────────────────
function FormPostulacion({ adopcionId, onDone }: { adopcionId: string; onDone: () => void }) {
  const [form, setForm] = useState({ nombre: "", mensaje: "", contacto: "" });
  const [zonaProvince, setZonaProvince] = useState("");
  const [zonaMuni, setZonaMuni] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSubmit() {
    if (!form.nombre || !form.mensaje || !form.contacto) {
      setError("Completá nombre, tu mensaje y un contacto");
      return;
    }
    setError("");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const zona = buildZona(zonaProvince, zonaMuni);
    const { error: err } = await supabase.from("adopciones_postulaciones").insert({
      adopcion_id: adopcionId,
      user_id: user?.id ?? null,
      nombre: form.nombre.trim(),
      zona,
      mensaje: form.mensaje.trim(),
      contacto: form.contacto.trim(),
    });
    setLoading(false);
    if (err) { setError("Error al enviar. Intentá de nuevo."); return; }
    onDone();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #353a4a" }}>
      <div style={{ fontWeight: 700, color: "#f472b6", fontSize: 13, marginBottom: 2 }}>Contanos sobre vos</div>
      <input
        placeholder="Tu nombre *"
        value={form.nombre}
        onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
        style={{ background: "#0f1117", border: "1px solid #353a4a", borderRadius: 10, padding: "9px 14px", color: "#f0f4ff", fontSize: 13 }}
      />
      <select
        value={zonaProvince}
        onChange={e => { setZonaProvince(e.target.value); setZonaMuni(""); }}
        style={{ background: "#0f1117", border: "1px solid #353a4a", borderRadius: 10, padding: "9px 14px", color: zonaProvince ? "#f0f4ff" : "#7a8299", fontSize: 13 }}
      >
        <option value="">¿En qué provincia vivís?</option>
        {PROVINCIAS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      {zonaProvince && (
        <select
          value={zonaMuni}
          onChange={e => setZonaMuni(e.target.value)}
          style={{ background: "#0f1117", border: "1px solid #353a4a", borderRadius: 10, padding: "9px 14px", color: zonaMuni ? "#f0f4ff" : "#7a8299", fontSize: 13 }}
        >
          <option value="">Ciudad / Localidad</option>
          {(MUNICIPIOS_POR_PROVINCIA[zonaProvince] || []).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      )}
      <textarea
        placeholder="¿Por qué querés adoptarlo? ¿Tenés patio, otros animales, experiencia? (mín. 30 caracteres) *"
        rows={3}
        value={form.mensaje}
        onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
        style={{ background: "#0f1117", border: "1px solid #353a4a", borderRadius: 10, padding: "9px 14px", color: "#f0f4ff", resize: "none", fontSize: 13 }}
      />
      <input
        placeholder="Tu WhatsApp o email para que te contacten *"
        value={form.contacto}
        onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
        style={{ background: "#0f1117", border: "1px solid #353a4a", borderRadius: 10, padding: "9px 14px", color: "#f0f4ff", fontSize: 13 }}
      />
      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
          {error}
        </div>
      )}
      <button onClick={handleSubmit} disabled={loading} style={{
        background: "linear-gradient(135deg, #f472b6, #db2777)", color: "#fff",
        border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 800,
        fontSize: 13, cursor: "pointer", opacity: loading ? 0.6 : 1,
      }}>
        {loading ? "Enviando..." : "Enviar postulación"}
      </button>
    </div>
  );
}

// ─── Panel de postulaciones (dueño de la adopción) ───────────────────────────
function PanelPostulaciones({ adopcionId, onClose }: { adopcionId: string; onClose: () => void }) {
  const [postulaciones, setPostulaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("adopciones_postulaciones")
      .select("*")
      .eq("adopcion_id", adopcionId)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setPostulaciones(data || []); setLoading(false); });
  }, [adopcionId]);

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #353a4a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontWeight: 800, color: "#f472b6", fontSize: 13 }}>
          Postulaciones ({postulaciones.length}/{MAX_POSTULACIONES})
        </div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#7a8299", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
        </div>
      )}

      {!loading && postulaciones.length === 0 && (
        <div style={{ color: "#7a8299", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
          Aún no hay postulaciones.
        </div>
      )}

      {postulaciones.map((p, i) => (
        <div key={p.id} style={{
          background: "#0f1117", border: "1px solid #353a4a",
          borderRadius: 12, padding: "12px 14px", marginBottom: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#f0f4ff" }}>
              {i + 1}. {p.nombre}
            </div>
            <div style={{ fontSize: 11, color: "#7a8299" }}>
              {new Date(p.created_at).toLocaleDateString("es-AR")}
            </div>
          </div>
          {p.zona && (
            <div style={{ fontSize: 12, color: "#60a5fa", marginBottom: 4 }}>📍 {p.zona}</div>
          )}
          <p style={{ fontSize: 13, color: "#c4cad6", lineHeight: 1.6, marginBottom: 8 }}>{p.mensaje}</p>
          <div style={{ display: "flex", gap: 8 }}>
            {p.contacto.includes("@") ? (
              <a href={`mailto:${p.contacto}`} style={{
                background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
                borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none",
              }}>Contactar por email</a>
            ) : (
              <a href={`https://wa.me/${p.contacto.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{
                background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
                borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, textDecoration: "none",
              }}>Contactar por WhatsApp</a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Adopciones() {
  const [adopciones, setAdopciones] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", breed: "", age: "", sex: "Macho", zone: "", description: "", phone: "" });
  const [zonaProvince, setZonaProvince] = useState("");
  const [zonaMuni, setZonaMuni] = useState("");
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // por adopcion_id: "form" | "panel" | null
  const [estadoCard, setEstadoCard] = useState<Record<string, "form" | "panel" | "done">>({});
  // conteo de postulaciones por adopcion_id
  const [conteos, setConteos] = useState<Record<string, number>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data } = await supabase.from("adopciones").select("*").order("created_at", { ascending: false });
      setAdopciones(data || []);

      // Cargar conteos de postulaciones
      if (data && data.length > 0) {
        const ids = data.map((a: any) => a.id);
        const { data: posts } = await supabase
          .from("adopciones_postulaciones")
          .select("adopcion_id")
          .in("adopcion_id", ids);
        const counts: Record<string, number> = {};
        for (const p of (posts || [])) {
          counts[p.adopcion_id] = (counts[p.adopcion_id] || 0) + 1;
        }
        setConteos(counts);
      }
    }
    load();
  }, []);

  function handleFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setFotos(prev => [...prev, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setFotoPreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }

  function removeFoto(i: number) {
    setFotos(prev => prev.filter((_, idx) => idx !== i));
    setFotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleAdd() {
    if (!form.name || !form.phone || !zonaProvince) {
      setFormError("Completá nombre, teléfono y zona");
      return;
    }
    setFormError("");
    setLoading(true);
    const zone = buildZona(zonaProvince, zonaMuni);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("adopciones").insert({ ...form, zone, user_id: user?.id ?? null }).select();
    if (data?.[0]) {
      const id = data[0].id;
      const urls: string[] = [];
      for (const file of fotos) {
        const path = `adopciones/${id}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from("comunidad").upload(path, file);
        if (!error) {
          const { data: urlData } = supabase.storage.from("comunidad").getPublicUrl(path);
          urls.push(urlData.publicUrl);
        }
      }
      if (urls.length > 0) {
        await supabase.from("adopciones").update({ photo_urls: JSON.stringify(urls) }).eq("id", id);
        data[0].photo_urls = JSON.stringify(urls);
      }
      setAdopciones(prev => [data[0], ...prev]);
    }
    setForm({ name: "", breed: "", age: "", sex: "Macho", zone: "", description: "", phone: "" });
    setZonaProvince("");
    setZonaMuni("");
    setFotos([]);
    setFotoPreviews([]);
    if (fileRef.current) fileRef.current.value = "";
    setAdding(false);
    setLoading(false);
  }

  return (
    <div className="community-tab-panel community-tab-adopciones">
      <div className="community-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800 }}>Adopciones</h3>
        <button className="community-primary-action" onClick={() => setAdding(!adding)} style={{
          background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>+ Publicar</button>
      </div>

      {/* Formulario de nueva adopción */}
      {adding && (
        <Card style={{ border: "1px solid #f472b644" }}>
          <div style={{ fontWeight: 700, color: "#f472b6", marginBottom: 12 }}>Dar en adopción</div>
          <div className="community-form" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Nombre de la mascota" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="Raza (ej: Mestizo, Labrador, Gato ELH)" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} />
            <div className="community-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input placeholder="Edad (ej: 1 año)" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff" }}>
                <option>Macho</option>
                <option>Hembra</option>
              </select>
            </div>
            <select
              value={zonaProvince}
              onChange={e => { setZonaProvince(e.target.value); setZonaMuni(""); }}
              style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: zonaProvince ? "#f0f4ff" : "#7a8299", fontSize: 13 }}
            >
              <option value="">Provincia *</option>
              {PROVINCIAS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {zonaProvince && (
              <select
                value={zonaMuni}
                onChange={e => setZonaMuni(e.target.value)}
                style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: zonaMuni ? "#f0f4ff" : "#7a8299", fontSize: 13 }}
              >
                <option value="">Ciudad / Localidad</option>
                {(MUNICIPIOS_POR_PROVINCIA[zonaProvince] || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            <textarea placeholder="Descripción: carácter, vacunas, situación..." rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff", resize: "none" }} />
            <input placeholder="Tu WhatsApp (solo para uso interno)" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />

            {/* Fotos */}
            <div>
              <div style={{ fontSize: 12, color: "#7a8299", marginBottom: 8 }}>Fotos de la mascota</div>
              {fotoPreviews.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {fotoPreviews.map((src, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={src} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", border: "1px solid #252a3a" }} />
                      <button onClick={() => removeFoto(i)} style={{
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

            {formError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                {formError}
              </div>
            )}
            <button onClick={handleAdd} disabled={loading} style={{
              background: "#f472b6", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800,
              opacity: loading ? 0.6 : 1, cursor: "pointer",
            }}>{loading ? "Publicando..." : "Publicar adopción"}</button>
          </div>
        </Card>
      )}

      {adopciones.length === 0 && !adding && (
        <Card style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>❤️</div>
          <p style={{ color: "#7a8299", fontSize: 13 }}>No hay mascotas en adopción todavía.<br />Publicá la primera.</p>
        </Card>
      )}

      {adopciones.map((a: any) => {
        const photos = parsePhotos(a.photo_urls);
        const esOwner = currentUserId && a.user_id === currentUserId;
        const postCount = conteos[a.id] || 0;
        const lleno = postCount >= MAX_POSTULACIONES;
        const estado = estadoCard[a.id];

        return (
          <Card key={a.id}>
            {/* Fotos */}
            {photos.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
                {photos.map((url, pi) => (
                  <img key={pi} src={url} style={{ width: 88, height: 88, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #252a3a" }} />
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {photos.length === 0 && (
                <div style={{ fontSize: 44, flexShrink: 0 }}>{getEmoji(a.breed)}</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{a.name}</div>
                <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 4 }}>
                  {a.breed}{a.age ? ` · ${a.age}` : ""}{a.sex ? ` · ${a.sex}` : ""}
                </div>
                {a.zone && <div style={{ color: "#60a5fa", fontSize: 12, marginBottom: 4 }}>📍 {a.zone}</div>}
                {a.description && (
                  <div style={{ fontSize: 12, color: "#c4cad6", marginTop: 4, lineHeight: 1.5 }}>{a.description}</div>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
              {esOwner ? (
                // Dueño: ver postulaciones
                <button
                  onClick={() => setEstadoCard(prev => ({ ...prev, [a.id]: prev[a.id] === "panel" ? undefined as any : "panel" }))}
                  style={{
                    flex: 1, background: postCount > 0 ? "#f472b622" : "#252a3a",
                    color: postCount > 0 ? "#f472b6" : "#7a8299",
                    border: `1px solid ${postCount > 0 ? "#f472b644" : "#353a4a"}`,
                    borderRadius: 10, padding: "9px 0", fontWeight: 800, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {postCount === 0
                    ? "Sin postulaciones aún"
                    : `Ver ${postCount} postulación${postCount !== 1 ? "es" : ""} →`}
                </button>
              ) : estado === "done" ? (
                // Ya se postuló
                <div style={{
                  flex: 1, background: "#E5F7F6", border: "1px solid #B2E8E5",
                  borderRadius: 10, padding: "9px 0", fontWeight: 800, fontSize: 13,
                  color: "#2CB8AD", textAlign: "center",
                }}>
                  ✅ Postulación enviada
                </div>
              ) : lleno ? (
                // Cupo lleno
                <div style={{
                  flex: 1, background: "#252a3a", borderRadius: 10, padding: "9px 0",
                  fontWeight: 700, fontSize: 13, color: "#7a8299", textAlign: "center",
                  border: "1px solid #353a4a",
                }}>
                  Cupo completo ({MAX_POSTULACIONES}/{MAX_POSTULACIONES})
                </div>
              ) : (
                // Botón postularse
                <button
                  onClick={() => setEstadoCard(prev => ({ ...prev, [a.id]: prev[a.id] === "form" ? undefined as any : "form" }))}
                  style={{
                    flex: 1, background: estado === "form" ? "#252a3a" : "linear-gradient(135deg, #f472b6, #db2777)",
                    color: estado === "form" ? "#7a8299" : "#fff",
                    border: estado === "form" ? "1px solid #353a4a" : "none",
                    borderRadius: 10, padding: "9px 0", fontWeight: 800, fontSize: 13, cursor: "pointer",
                  }}
                >
                  {estado === "form" ? "Cancelar" : "❤️ Quiero adoptarlo"}
                </button>
              )}

              {/* Contador de postulaciones (visible para todos, excepto cuando es owner que ya lo tiene en el botón) */}
              {!esOwner && postCount > 0 && estado !== "done" && !lleno && (
                <div style={{ fontSize: 11, color: "#7a8299", flexShrink: 0 }}>
                  {postCount}/{MAX_POSTULACIONES}
                </div>
              )}
            </div>

            {/* Formulario de postulación */}
            {!esOwner && estado === "form" && (
              <FormPostulacion
                adopcionId={a.id}
                onDone={() => {
                  setEstadoCard(prev => ({ ...prev, [a.id]: "done" }));
                  setConteos(prev => ({ ...prev, [a.id]: (prev[a.id] || 0) + 1 }));
                }}
              />
            )}

            {/* Panel de postulaciones para el dueño */}
            {esOwner && estado === "panel" && (
              <PanelPostulaciones
                adopcionId={a.id}
                onClose={() => setEstadoCard(prev => ({ ...prev, [a.id]: undefined as any }))}
              />
            )}
          </Card>
        );
      })}
    </div>
  );
}
