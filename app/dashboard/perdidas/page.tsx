"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { MUNICIPIOS_POR_PROVINCIA, PROVINCIAS_LIST, buildZona } from "@/lib/locations";
import { EmptyState, UiCard } from "@/components/ui";

const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

function Card({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <UiCard className={`lost-card${className ? ` ${className}` : ""}`} style={style}>
      {children}
    </UiCard>
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
  const [zonaProvince, setZonaProvince] = useState("");
  const [zonaMuni, setZonaMuni] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locationAsked, setLocationAsked] = useState(false);
  const [avistamientos, setAvistamientos] = useState<any[]>([]);
  const [reportError, setReportError] = useState("");
  const [confirmEncontrada, setConfirmEncontrada] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedAvist, setExpandedAvist] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from("perdidas").select("*").eq("active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPerdidas(data || []));

    async function loadAvistamientos() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);
      const { data } = await supabase
        .from("comunidad_mensajes")
        .select("*")
        .eq("author_name", "AVISTAMIENTO")
        .order("created_at", { ascending: false });
      setAvistamientos(data || []);
    }
    loadAvistamientos();
  }, []);

  function requestLocation() {
    setLocationAsked(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setForm(f => ({ ...f, lat: coords[0], lng: coords[1] }));
      },
      function() { /* permiso denegado */ }
    );
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }

  async function handleReport() {
    setReportError("");
    if (!form.pet_name.trim()) { setReportError("El nombre de la mascota es obligatorio."); return; }
    if (!form.color.trim()) { setReportError("El color es obligatorio."); return; }
    if (!zonaProvince) { setReportError("Seleccioná una provincia."); return; }
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

    const zone = buildZona(zonaProvince, zonaMuni);
    const { data, error: insertError } = await supabase.from("perdidas").insert({ ...form, zone, user_id: user.id, photo_url }).select();
    if (insertError || !data) {
      setReportError("No se pudo publicar la alerta. Intentá de nuevo.");
      setLoading(false);
      return;
    }
    setPerdidas(prev => [data[0], ...prev]);
    setReporting(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setZonaProvince("");
    setZonaMuni("");
    setLoading(false);
  }

  async function marcarEncontrada(id: string) {
    await supabase.from("perdidas").update({ active: false }).eq("id", id);
    setPerdidas(prev => prev.filter(p => p.id !== id));
  }

  function daysSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  }

  const fieldsTop: [string, string][] = [
    ["Nombre de la mascota", "pet_name"],
    ["Raza", "breed"],
    ["Color / descripcion fisica", "color"],
  ];
  const fieldsBottom: [string, string][] = [
    ["Telefono de contacto", "phone"],
  ];

  return (
    <div className="lost-page">
      {!locationAsked && (
        <div className="lost-location-card" style={{
          background: "#EFF6FF", border: "1px solid #BFDBFE",
          borderRadius: 14, padding: 16, marginBottom: 16,
          display: "flex", gap: 14, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>📍</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#3B82F6", marginBottom: 4 }}>
              Activar ubicacion
            </div>
            <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.5, marginBottom: 10 }}>
              Para mostrar mascotas perdidas cerca tuyo y centrar el mapa en tu zona, necesitamos acceder a tu ubicacion. No la guardamos ni la compartimos.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={requestLocation} style={{
                background: "#3B82F6", color: "#fff", border: "none",
                borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
              }}>Aceptar</button>
              <button onClick={() => setLocationAsked(true)} style={{
                background: "transparent", border: "1px solid #E2E8F0",
                color: "#64748B", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer",
              }}>Omitir</button>
            </div>
          </div>
        </div>
      )}

      <button
        className="lost-report-cta"
        onClick={() => setReporting(!reporting)}
        style={{
          width: "100%", background: "#FFF0F0", color: "#EF4444",
          border: "1px solid #FECACA", borderRadius: 12, padding: 12,
          fontWeight: 700, fontSize: 14, marginBottom: 16,
        }}
      >
        Reportar mascota perdida
      </button>

      {reporting && (
        <Card className="lost-report-form" style={{ border: "1px solid #FECACA" }}>
          <div style={{ fontWeight: 700, color: "#EF4444", marginBottom: 12 }}>Nueva alerta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {fieldsTop.map(([label, key]) => (
              <input
                key={key}
                placeholder={label}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
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
                background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10,
                padding: "10px 14px", color: "#1C3557", resize: "none",
              }}
            />

            {/* Foto */}
            <div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              {photoPreview ? (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img src={photoPreview} style={{ height: 100, borderRadius: 10, border: "1px solid #FECACA", objectFit: "cover" }} />
                  <button
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                    style={{
                      position: "absolute", top: -8, right: -8, background: "#EF4444", color: "#fff",
                      border: "none", borderRadius: "50%", width: 22, height: 22, fontSize: 13,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >x</button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: "100%", background: "#F4F6FB", border: "1px dashed #FECACA",
                    borderRadius: 10, padding: 12, color: "#EF4444", fontWeight: 700,
                    fontSize: 13, cursor: "pointer",
                  }}
                >
                  📷 Agregar foto de la mascota
                </button>
              )}
            </div>

            {reportError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 13, marginBottom: 4 }}>
                {reportError}
              </div>
            )}
            <button
              onClick={handleReport}
              disabled={loading}
              style={{
                background: "#EF4444", color: "#fff", border: "none",
                borderRadius: 10, padding: 12, fontWeight: 800,
                opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Publicando..." : "Publicar alerta"}
            </button>
          </div>
        </Card>
      )}

      <div className="lost-map-card" style={{ borderRadius: 16, overflow: "hidden", marginBottom: 16, height: 220 }}>
        <MapComponent perdidas={perdidas} center={userLocation ?? undefined} />
      </div>

      <div style={{
        color: "#64748B", fontSize: 11, fontWeight: 700,
        letterSpacing: 2, textTransform: "uppercase", marginBottom: 10,
      }}>
        Alertas activas
      </div>

      {perdidas.length === 0 && (
        <Card>
          <EmptyState
            icon="🐾"
            description="No hay mascotas perdidas reportadas en este momento."
            style={{ padding: 0 }}
          />
        </Card>
      )}

      {perdidas.map((p: any) => {
        const days = daysSince(p.created_at);
        const isGato = p.breed?.toLowerCase().includes("gato") || p.breed?.toLowerCase().includes("cat");
        const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/perdida/${p.id}` : `/perdida/${p.id}`;
        const avistsDeEsta = avistamientos.filter(a => {
          try { return JSON.parse(a.message).perdida_id === p.id; } catch { return false; }
        });
        const isMia = currentUserId && p.user_id === currentUserId;

        return (
          <Card className="lost-alert-card" key={p.id}>
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
                <div style={{ color: "#64748B", fontSize: 12 }}>{p.breed}{p.color ? " - " + p.color : ""}</div>
                {p.zone && <div style={{ color: "#64748B", fontSize: 12 }}>📍 {p.zone}</div>}
                {p.description && (
                  <div style={{ fontSize: 12, color: "#1C3557", marginTop: 4 }}>{p.description}</div>
                )}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span style={{
                  background: days <= 2 ? "#FFF0F0" : "#FFF7ED",
                  color: days <= 2 ? "#EF4444" : "#F97316",
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
                      display: "block", marginTop: 6, background: "#E5F7F6",
                      color: "#2CB8AD", border: "1px solid #B2E8E5", borderRadius: 8,
                      padding: "4px 8px", fontSize: 11, fontWeight: 700, textDecoration: "none",
                    }}
                  >
                    Contactar
                  </a>
                )}
              </div>
            </div>

            {/* Acciones: Compartir + Avistamientos */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #F1F5F9", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(publicUrl);
                  setCopiedId(p.id);
                  setTimeout(() => setCopiedId(null), 2500);
                }}
                style={{
                  flex: 1, background: "#F4F6FB", border: "1px solid #E2E8F0",
                  borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                  color: copiedId === p.id ? "#2CB8AD" : "#64748B", cursor: "pointer",
                }}
              >
                {copiedId === p.id ? "✅ Link copiado" : "🔗 Compartir alerta"}
              </button>
              {isMia && (
                confirmEncontrada === p.id ? (
                  <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#065F46" }}>¿Confirmar?</span>
                    <button onClick={() => { marcarEncontrada(p.id); setConfirmEncontrada(null); }} style={{ background: "#2CB8AD", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>Sí</button>
                    <button onClick={() => setConfirmEncontrada(null)} style={{ background: "#E2E8F0", color: "#64748B", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>No</button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmEncontrada(p.id)}
                    style={{
                      background: "#D1FAE5", border: "1px solid #6EE7B7",
                      borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                      color: "#065F46", cursor: "pointer",
                    }}
                  >
                    ✓ Encontrada
                  </button>
                )
              )}
              {avistsDeEsta.length > 0 && (
                <button
                  onClick={() => setExpandedAvist(expandedAvist === p.id ? null : p.id)}
                  style={{
                    background: "#FFF0F0", border: "1px solid #FECACA",
                    borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700,
                    color: "#EF4444", cursor: "pointer",
                  }}
                >
                  👁 {avistsDeEsta.length} avistamiento{avistsDeEsta.length > 1 ? "s" : ""}
                </button>
              )}
            </div>

            {/* Avistamientos expandidos */}
            {expandedAvist === p.id && (
              <div style={{ marginTop: 10 }}>
                {avistsDeEsta.map((a: any) => {
                  let datos: any = {};
                  try { datos = JSON.parse(a.message); } catch {}
                  return (
                    <div key={a.id} style={{
                      background: "#FFF0F0", border: "1px solid #FECACA",
                      borderRadius: 10, padding: "10px 12px", marginBottom: 8,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#1C3557" }}>
                          {datos.nombre || "Anónimo"}
                        </span>
                        <span style={{ fontSize: 11, color: "#64748B" }}>
                          {new Date(a.created_at).toLocaleDateString("es-AR")}
                        </span>
                      </div>
                      {datos.ubicacion && (
                        <div style={{ fontSize: 12, color: "#EF4444", marginBottom: 4 }}>📍 {datos.ubicacion}</div>
                      )}
                      <p style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.5, margin: 0 }}>{datos.mensaje}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
