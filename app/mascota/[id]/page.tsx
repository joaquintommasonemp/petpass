"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function Badge({ children, color = "#2CB8AD" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      background: color + "20", color, borderRadius: 20, padding: "4px 12px",
      fontSize: 12, fontWeight: 700, border: `1px solid ${color}40`,
      display: "inline-block",
    }}>{children}</span>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
      <span style={{ color: "#64748B", fontSize: 13 }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 13, textAlign: "right", maxWidth: "58%", color: "#1C3557" }}>{value}</span>
    </div>
  );
}

export default function PerfilPublicoMascota() {
  const params = useParams();
  const id = params?.id as string;
  const [mascota, setMascota] = useState<any>(null);
  const [owner, setOwner] = useState<any>(null);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    const { data: m } = await supabase.from("mascotas").select("*").eq("id", id).single();
    if (!m || !m.is_public) { setNotFound(true); setLoading(false); return; }
    setMascota(m);
    const [{ data: vacs }, { data: profile }] = await Promise.all([
      supabase.from("vacunas").select("*").eq("mascota_id", id).order("date", { ascending: false }),
      supabase.from("profiles").select("full_name, phone").eq("id", m.user_id).single(),
    ]);
    setVacunas(vacs || []);
    setOwner(profile);
    setLoading(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB" }}>
      <div style={{ height: 56, background: "#fff", borderBottom: "1px solid #E2E8F0" }} />
      <div style={{ background: "linear-gradient(160deg, #1C3557 0%, #2CB8AD 100%)", padding: "40px 24px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 24, alignItems: "center" }}>
          <div className="skeleton" style={{ width: 110, height: 110, borderRadius: 24, flexShrink: 0, opacity: 0.3 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="skeleton" style={{ height: 36, width: "35%", opacity: 0.3 }} />
            <div className="skeleton" style={{ height: 14, width: "50%", opacity: 0.3 }} />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 200, borderRadius: 20 }} />
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24 }}>
      <div style={{ fontSize: 64 }}>🐾</div>
      <h2 style={{ color: "#1C3557", fontWeight: 900 }}>Perfil no encontrado</h2>
      <p style={{ color: "#64748B", fontSize: 14 }}>Este perfil no existe o fue desactivado.</p>
      <Link href="/" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>Ir al inicio →</Link>
    </div>
  );

  const isGato = mascota?.breed?.toLowerCase().includes("gato") || mascota?.breed?.toLowerCase().includes("cat");
  const lastVac = vacunas[0] || null;
  const nextVac = [...vacunas].filter(v => v.next_date).sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime())[0];
  const carnetUrl = typeof window !== "undefined" ? `${window.location.origin}/carnet/${id}` : `/carnet/${id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(carnetUrl)}&bgcolor=ffffff&color=1C3557&margin=6`;

  return (
    <main className="public-pet-page" style={{ minHeight: "100vh", background: "#F4F6FB" }}>

      {/* ── NAV ── */}
      <nav className="public-pet-nav" style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E8F0",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Image src="/logo-brand-official.png" alt="PetPass" width={160} height={44} priority style={{ height: 44, width: "auto", objectFit: "contain" }} />
          </Link>
          <Link href="/registro" style={{
            background: "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff", borderRadius: 10, padding: "7px 16px",
            fontSize: 12, fontWeight: 800, textDecoration: "none",
            boxShadow: "0 2px 12px rgba(44,184,173,0.3)",
          }}>Crear mi PetPass gratis</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="public-pet-hero" style={{
        background: "linear-gradient(160deg, #1C3557 0%, #2CB8AD 100%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 40px", position: "relative" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            {/* Foto */}
            <div style={{
              width: 110, height: 110, borderRadius: 24,
              border: "3px solid rgba(255,255,255,0.4)",
              overflow: "hidden", flexShrink: 0,
              background: "rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}>
              {mascota.photo_url
                ? <Image src={mascota.photo_url} alt={mascota.name} width={110} height={110} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 56 }}>{isGato ? "🐱" : "🐕"}</span>}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{mascota.name}</h1>
                <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 800, border: "1px solid rgba(255,255,255,0.3)" }}>
                  🐾 PetPass verificado
                </span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 12 }}>
                {mascota.breed}{mascota.age ? ` · ${mascota.age}` : ""}{mascota.sex ? ` · ${mascota.sex}` : ""}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {mascota.chip && (
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}>
                    📡 Chip: ...{mascota.chip.slice(-6)}
                  </span>
                )}
                {mascota.weight && (
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}>
                    ⚖️ {mascota.weight}
                  </span>
                )}
                {mascota.location && (
                  <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, border: "1px solid rgba(255,255,255,0.25)" }}>
                    📍 {mascota.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Banner encontré esta mascota */}
          <div className="public-pet-found-banner" style={{
            marginTop: 24, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 14, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)",
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🔍</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 2 }}>¿Encontraste a {mascota.name}?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                Contactá al dueño usando los datos de abajo. ¡Gracias por ayudar!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="public-pet-content" style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px 60px" }}>
        <div className="mascota-public-grid">

          {/* Columna principal */}
          <div>

            {/* Contacto */}
            {(owner?.full_name || owner?.phone) && (
              <div className="public-pet-card public-pet-contact-card" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: "20px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(28,53,87,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Contacto del dueño</div>
                {owner.full_name && (
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1C3557", marginBottom: 6 }}>👤 {owner.full_name}</div>
                )}
                {owner.phone && (
                  <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>📞 {owner.phone}</div>
                )}
                {owner.phone && (
                  <a
                    href={"https://wa.me/" + owner.phone.replace(/\D/g, "")}
                    target="_blank" rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                      color: "#fff", borderRadius: 14, padding: "14px 20px",
                      fontWeight: 900, fontSize: 15, textDecoration: "none",
                      boxShadow: "0 4px 20px rgba(44,184,173,0.28)",
                    }}
                  >
                    💬 Contactar por WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Datos */}
            <div className="public-pet-card" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: "20px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(28,53,87,0.06)" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Datos de la mascota</div>
              {[
                ["Nombre", mascota.name],
                ["Especie / Raza", mascota.breed],
                ["Edad", mascota.age],
                ["Sexo", mascota.sex],
                ["Castrado/a", mascota.castrado !== "No sé" ? mascota.castrado : null],
                ["Peso", mascota.weight],
                ["Ubicación habitual", mascota.location],
                ["Microchip", mascota.chip],
                ["Color / señas", mascota.color],
              ].filter(([, v]) => v).map(([label, value]) => (
                <DataRow key={label as string} label={label as string} value={value as string} />
              ))}
            </div>

          </div>

          {/* Columna lateral */}
          <div>

            {/* Vacunas */}
            {vacunas.length > 0 && (
              <div className="public-pet-card" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: "20px 24px", marginBottom: 16, boxShadow: "0 2px 12px rgba(28,53,87,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Vacunación</div>

                {lastVac && (
                  <div style={{ background: "#F4F6FB", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#64748B", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Última vacuna</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1C3557" }}>{lastVac.name}</div>
                    <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{lastVac.date}</div>
                  </div>
                )}

                {nextVac && (
                  <div style={{ background: "#E5F7F6", borderRadius: 12, padding: "12px 14px", border: "1px solid #B2E8E5", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: "#2CB8AD", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Próxima vacuna</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1C3557" }}>{nextVac.name}</div>
                    <div style={{ fontSize: 12, color: "#2CB8AD", fontWeight: 700, marginTop: 2 }}>{nextVac.next_date}</div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {vacunas.map((v: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < vacunas.length - 1 ? "1px solid #F1F5F9" : "none" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3557" }}>{v.name}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8" }}>{v.date}</div>
                      </div>
                      {(() => {
                        const alDia = v.next_date ? new Date(v.next_date) >= new Date() : true;
                        return (
                          <span style={{
                            background: alDia ? "#2CB8AD20" : "#f8717120",
                            color: alDia ? "#2CB8AD" : "#f87171",
                            borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
                            border: `1px solid ${alDia ? "#2CB8AD40" : "#f8717140"}`,
                            flexShrink: 0,
                          }}>
                            {alDia ? "Al día" : "Vencida"}
                          </span>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR Carnet */}
            <div className="public-pet-card public-pet-qr-card" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20, padding: "20px 24px", boxShadow: "0 2px 12px rgba(28,53,87,0.06)", textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Carnet digital</div>
              <img src={qrUrl} alt="QR Carnet" style={{ width: 100, height: 100, borderRadius: 10, border: "1px solid #E2E8F0", marginBottom: 10 }} />
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14, lineHeight: 1.5 }}>
                Escaneá para ver el carnet completo con vacunas y datos de {mascota.name}
              </div>
              <Link href={`/carnet/${id}`} target="_blank" style={{
                display: "block", background: "#EEF2FF", color: "#6366F1",
                border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "9px 16px",
                fontSize: 13, fontWeight: 700, textDecoration: "none",
              }}>🪪 Ver carnet</Link>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingTop: 32 }}>
          <Link href="/registro" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>Perfil digital creado con</div>
            <Image src="/logo-brand-official.png" alt="PetPass" width={120} height={36} style={{ height: 36, width: "auto", objectFit: "contain", opacity: 0.6 }} />
          </Link>
        </div>
      </div>
    </main>
  );
}
