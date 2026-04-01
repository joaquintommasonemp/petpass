"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

function Card({ children, style = {} }: any) {
  return <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>{children}</div>;
}

export default function Adopciones() {
  const [adopciones, setAdopciones] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", breed: "", age: "", sex: "Macho", zone: "", description: "", phone: "" });
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotoPreviews, setFotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("adopciones").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setAdopciones(data || []));
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
    if (!form.name || !form.phone || !form.zone) {
      alert("Completá nombre, teléfono y zona");
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("adopciones").insert(form).select();
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
    setFotos([]);
    setFotoPreviews([]);
    if (fileRef.current) fileRef.current.value = "";
    setAdding(false);
    setLoading(false);
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800 }}>Adopciones ❤️</h3>
        <button onClick={() => setAdding(!adding)} style={{
          background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>+ Publicar</button>
      </div>

      {adding && (
        <Card style={{ border: "1px solid #f472b644" }}>
          <div style={{ fontWeight: 700, color: "#f472b6", marginBottom: 12 }}>Dar en adopción</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input placeholder="Nombre de la mascota" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <input placeholder="Raza (ej: Mestizo, Labrador, Gato ELH)" value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input placeholder="Edad (ej: 1 año)" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
              <select value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff" }}>
                <option>Macho</option>
                <option>Hembra</option>
              </select>
            </div>
            <input placeholder="Zona (ej: Boedo, CABA)" value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))} />
            <textarea placeholder="Descripción: carácter, vacunas, situación..." rows={3} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{ background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: "#f0f4ff", resize: "none" }} />
            <input placeholder="Teléfono / WhatsApp" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />

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

      {adopciones.map((a: any, i: number) => {
        const photos = parsePhotos(a.photo_urls);
        return (
          <Card key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ fontSize: 44, flexShrink: 0 }}>{photos.length === 0 && getEmoji(a.breed)}</div>
            <div style={{ flex: 1 }}>
              {photos.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
                  {photos.map((url, pi) => (
                    <img key={pi} src={url} style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid #252a3a" }} />
                  ))}
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 16 }}>{a.name}</div>
              <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 4 }}>
                {a.breed}{a.age ? ` · ${a.age}` : ""}{a.sex ? ` · ${a.sex}` : ""}
              </div>
              {a.zone && <div style={{ color: "#7a8299", fontSize: 12 }}>📍 {a.zone}</div>}
              {a.description && (
                <div style={{ fontSize: 12, color: "#f0f4ff", marginTop: 6, lineHeight: 1.5 }}>{a.description}</div>
              )}
              {a.phone && (
                <a href={`https://wa.me/${a.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{
                  display: "inline-block", marginTop: 10, background: "#f472b622", color: "#f472b6",
                  border: "1px solid #f472b644", borderRadius: 8, padding: "6px 14px",
                  fontSize: 12, fontWeight: 700, textDecoration: "none",
                }}>❤️ Me interesa</a>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
