"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

function Card({ children, style = {} }: any) {
  return <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>{children}</div>;
}

export default function Adopciones() {
  const [adopciones, setAdopciones] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", breed: "", age: "", sex: "Macho", zone: "", description: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("adopciones").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setAdopciones(data || []));
  }, []);

  async function handleAdd() {
    if (!form.name || !form.phone) return;
    setLoading(true);
    const { data } = await supabase.from("adopciones").insert(form).select();
    if (data) setAdopciones(prev => [data[0], ...prev]);
    setForm({ name: "", breed: "", age: "", sex: "Macho", zone: "", description: "", phone: "" });
    setAdding(false);
    setLoading(false);
  }

  function getEmoji(breed: string) {
    if (!breed) return "🐾";
    if (breed.toLowerCase().includes("gato") || breed.toLowerCase().includes("persa") || breed.toLowerCase().includes("siamés")) return "🐱";
    if (breed.toLowerCase().includes("conejo")) return "🐰";
    return "🐕";
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800 }}>Adopciones ❤️</h3>
        <button onClick={() => setAdding(!adding)} style={{
          background: "#f472b622", color: "#f472b6", border: "1px solid #f472b644",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
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
            <button onClick={handleAdd} disabled={loading} style={{
              background: "#f472b6", color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 800,
              opacity: loading ? 0.6 : 1,
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

      {adopciones.map((a: any, i: number) => (
        <Card key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ fontSize: 44 }}>{getEmoji(a.breed)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{a.name}</div>
            <div style={{ color: "#7a8299", fontSize: 12, marginBottom: 4 }}>
              {a.breed}{a.age ? ` · ${a.age}` : ""}{a.sex ? ` · ${a.sex}` : ""}
            </div>
            {a.zone && <div style={{ color: "#7a8299", fontSize: 12 }}>📍 {a.zone}</div>}
            {a.description && (
              <div style={{ fontSize: 12, color: "#f0f4ff", marginTop: 6, lineHeight: 1.5 }}>{a.description}</div>
            )}
            {a.phone && (
              <a href={`https://wa.me/${a.phone.replace(/\D/g, "")}`} target="_blank" style={{
                display: "inline-block", marginTop: 10, background: "#f472b622", color: "#f472b6",
                border: "1px solid #f472b644", borderRadius: 8, padding: "6px 14px",
                fontSize: 12, fontWeight: 700, textDecoration: "none",
              }}>❤️ Me interesa</a>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
