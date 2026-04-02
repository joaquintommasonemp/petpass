"use client";
import { useEffect, useRef, useState } from "react";
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
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

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleReport() {
    setLoading(true);
    const authResult = await supabase.auth.getUser();
    const user = authResult.data.user;
    if (!user) { setLoading(false); return; }

    let photo_url: string | null = null;
    if (photoFile) {
      const allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-";
      const safeName = Array.from(photoFile.name as string).map(function(c: any) {
        return allowed.includes(c) ? c : "_";
      }).join("");
      const path = "perdidas/" + Date.now() + "_" + safeName;
      const uploadResult = await supabase.storage.from("comunidad").upload(path, photoFile);
      if (!uploadResult.error) {
        const urlResult = supabase.storage.from("comunidad").getPublicUrl(path);
        photo_url = urlResult.data.publicUrl;
      }
    }

    const { data } = await supabase.from("perdidas").insert({ ...form, user_id: user.id, photo_url }).select();
    if (data) setPerdidas(prev => [data[0], ...prev]);
    setReporting(false);
    setPhotoFile(null);
    setPhotoPreview(null);
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

            {/* Foto */}
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              {photoPreview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={photoPreview} style={{ height: 100, borderRadius: 10, border: "1px solid #f8717144", objectFit: "cover" }} />
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                    style={{
                      position: "absolute", top: -8, right: -8, background: "#f87171", color: "#fff",
                      border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 13,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >x</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: "100%", background: "#0f1117", border: "1px dashed #f8717155",
                    borderRadius: 10, padding: 12, color: "#f87171", fontWeight: 700,
                    fontSize: 13, cursor: "pointer",
                  }}
                >
                  📷 Agregar foto de la mascota
                </button>
              )}
            </div>

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
        const isGato = p.breed?.toLowerCase().includes("gato") || p.breed?.toLowerCase().includes("cat");
        return (
          <Card key={i}>
            {p.photo_url && (
              <img
                src={p.photo_url}
                style={{ width: "100%", borderRadius: 10, marginBottom: 12, maxHeight: 200, objectFit: "cover" }}
              />
            )}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {!p.photo_url && (
                <div style={{ fontSize: 36, flexShrink: 0 }}>{isGato ? "🐱" : "🐶"}</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.pet_name}</div>
                <div style={{ color: "#7a8299", fontSize: 12 }}>{p.breed}{p.color ? " - " + p.color : ""}</div>
                {p.zone && <div style={{ color: "#7a8299", fontSize: 12 }}>📍 {p.zone}</div>}
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
            </div>
          </Card>
        );
      })}
    </div>
  );
}
