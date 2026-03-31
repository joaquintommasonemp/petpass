"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

export default function Perdidas() {
  const [perdidas, setPerdidas] = useState<any[]>([]);
  const [reporting, setReporting] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [form, setForm] = useState({
    pet_name: "", breed: "", color: "", zone: "", phone: "", description: "",
    lat: -34.6037, lng: -58.3816,
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("perdidas").select("*").eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPerdidas(data || []));

    navigator.geolocation?.getCurrentPosition(pos => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
      setUserLocation(coords);
      setForm(f => ({ ...f, lat: coords[0], lng: coords[1] }));
    });
  }, []);

  async function handleReport() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("perdidas").insert({ ...form, user_id: user.id }).select();
    if (data) setPerdidas(prev => [data[0], ...prev]);
    setReporting(false);
    setLoading(false);
  }

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  const fields: [string, string][] = [
    ["Nombre de la mascota", "pet_name"],
    ["Raza", "breed"],
    ["Color / descripcion fisica", "color"],
    ["Zona donde se perdio", "zone"],
    ["Telefono de contacto", "phone"],
  ];

  return (
    <div>
      <button
        onClick={() => setReporting(!reporting)}
        style={{
          width: "100%", background: "#f8717122", color: "#f87171",
          border: "1px solid #f8717144", borderRadius: 12, padding: 12,
          fontWeight: 700, fontSize: 14, marginBottom: 16,
        }}
      >
        Reportar mascota perdida
      </button>

      {reporting && (
        <Card style={{ border: "1px solid #f8717144" }}>
          <div style={{ fontWeight: 700, color: "#f87171", marginBottom: 12 }}>Nueva alerta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fields.map(([label, key]) => (
              <input
                key={key}
                placeholder={label}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            ))}
            <textarea
              placeholder="Descripcion adicional..."
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              style={{
                background: "#0f1117", border: "1px solid #252a3a", borderRadius: 10,
                padding: "10px 14px", color: "#f0f4ff", resize: "none",
              }}
            />
            <button
              onClick={handleReport}
              disabled={loading}
              style={{
                background: "#f87171", color: "#fff", border: "none",
                borderRadius: 10, padding: 12, fontWeight: 800,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Publicando..." : "Publicar alerta"}
            </button>
          </div>
        </Card>
      )}

      <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, height: 220 }}>
        <MapComponent perdidas={perdidas} center={userLocation ?? undefined} />
      </div>

      <div style={{
        color: "#7a8299", fontSize: 11, fontWeight: 700,
        letterSpacing: 2, textTransform: "uppercase", marginBottom: 10,
      }}>
        Alertas activas
      </div>

      {perdidas.length === 0 && (
        <Card>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40 }}>🐾</div>
            <p style={{ color: "#7a8299", fontSize: 13, marginTop: 8 }}>
              No hay mascotas perdidas reportadas en este momento.
            </p>
          </div>
        </Card>
      )}

      {perdidas.map((p: any, i: number) => {
        const days = daysSince(p.created_at);
        return (
          <Card key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ fontSize: 36 }}>{p.breed?.toLowerCase().includes("gato") || p.breed?.toLowerCase().includes("cat") ? "🐱" : "🐶"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.pet_name}</div>
              <div style={{ color: "#7a8299", fontSize: 12 }}>{p.breed} - {p.color}</div>
              <div style={{ color: "#7a8299", fontSize: 12 }}>{p.zone}</div>
              {p.description && (
                <div style={{ fontSize: 12, color: "#f0f4ff", marginTop: 4 }}>{p.description}</div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <span style={{
                background: days <= 2 ? "#f8717122" : "#fb923c22",
                color: days <= 2 ? "#f87171" : "#fb923c",
                borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
              }}>
                hace {days}d
              </span>
              {p.phone && (
                <a
                  href={"https://wa.me/" + p.phone.replace(/\D/g, "")}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block", marginTop: 6, background: "#4ade8022",
                    color: "#4ade80", border: "1px solid #4ade8044", borderRadius: 8,
                    padding: "4px 8px", fontSize: 11, fontWeight: 700, textDecoration: "none",
                  }}
                >
                  Contactar
                </a>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
