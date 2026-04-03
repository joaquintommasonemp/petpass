"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

function Badge({ children, color = "#2CB8AD" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      background: color + "22", color, borderRadius: 20, padding: "3px 12px",
      fontSize: 12, fontWeight: 700, border: `1px solid ${color}44`,
    }}>{children}</span>
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

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function load() {
    const { data: m } = await supabase.from("mascotas").select("*").eq("id", id).single();
    if (!m || !m.is_public) { setNotFound(true); setLoading(false); return; }
    setMascota(m);

    const [{ data: vacs }, { data: profile }] = await Promise.all([
      supabase.from("vacunas").select("*").eq("mascota_id", id),
      supabase.from("profiles").select("full_name, phone").eq("id", m.user_id).single(),
    ]);

    setVacunas(vacs || []);
    setOwner(profile);
    setLoading(false);
  }

  if (loading) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px", textAlign: "center", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ color: "#64748B" }}>Cargando perfil...</div>
    </div>
  );

  if (notFound) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px", textAlign: "center", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
      <h2 style={{ color: "#1C3557", marginBottom: 8 }}>Perfil no encontrado</h2>
      <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24 }}>Este perfil no existe o fue desactivado.</p>
      <Link href="/" style={{ color: "#2CB8AD", textDecoration: "none", fontWeight: 700 }}>Ir al inicio →</Link>
    </div>
  );

  const isGato = mascota?.breed?.toLowerCase().includes("gato") || mascota?.breed?.toLowerCase().includes("cat");
  const sortedVacs = [...vacunas].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const lastVac = sortedVacs[0];
  const nextVac = [...vacunas].filter(v => v.next_date).sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime())[0];

  return (
    <main style={{ maxWidth: 440, margin: "0 auto", background: "#F4F6FB", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #E5F7F6 0%, #F4F6FB 70%)",
        padding: "32px 20px 24px", borderBottom: "1px solid #E2E8F0",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, #2CB8AD20, transparent 70%)", pointerEvents: "none" }} />
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", marginBottom: 20 }}>
          <img src="/logo.png" alt="PetPass" style={{ height: 36, width: "auto", objectFit: "contain" }} />
        </Link>

        {/* Foto + nombre */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{
            width: 88, height: 88, borderRadius: "50%", flexShrink: 0,
            background: "#E2E8F0", border: "3px solid #2CB8AD44",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {mascota.photo_url
              ? <img src={mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 48 }}>{isGato ? "🐱" : "🐕"}</span>
            }
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, fontFamily: "Georgia, serif", marginBottom: 4 }}>{mascota.name}</h1>
            <div style={{ color: "#64748B", fontSize: 13, marginBottom: 8 }}>
              {mascota.breed}{mascota.age ? ` · ${mascota.age}` : ""}{mascota.sex ? ` · ${mascota.sex}` : ""}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {mascota.chip && <Badge color="#2CB8AD">Chip: {mascota.chip}</Badge>}
              {mascota.weight && <Badge color="#fb923c">{mascota.weight}</Badge>}
              {mascota.location && <Badge color="#60a5fa">{mascota.location}</Badge>}
            </div>
          </div>
        </div>

        {/* Alerta encontré esta mascota */}
        <div style={{
          marginTop: 20, background: "#2CB8AD15", border: "1px solid #2CB8AD30",
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🔍</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#2CB8AD", marginBottom: 2 }}>¿Encontraste a {mascota.name}?</div>
            <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.4 }}>
              Contactá al dueño usando los datos de contacto abajo.
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 60px" }}>

        {/* Contacto del dueño */}
        {(owner?.full_name || owner?.phone) && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Contacto del dueño</div>
            {owner.full_name && (
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>👤 {owner.full_name}</div>
            )}
            {owner.phone && (
              <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>📞 {owner.phone}</div>
            )}
            {owner.phone && (
              <a
                href={"https://wa.me/" + owner.phone.replace(/\D/g, "")}
                target="_blank" rel="noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                  color: "#fff", borderRadius: 12, padding: "13px 20px",
                  fontWeight: 900, fontSize: 15, textDecoration: "none",
                  boxShadow: "0 4px 20px #2CB8AD30",
                }}
              >
                💬 Contactar por WhatsApp
              </a>
            )}
          </div>
        )}

        {/* Información de la mascota */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Datos de la mascota</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Nombre", mascota.name],
              ["Especie/Raza", mascota.breed],
              ["Edad", mascota.age],
              ["Sexo", mascota.sex],
              ["Peso", mascota.weight],
              ["Ubicación habitual", mascota.location],
              ["Chip", mascota.chip],
              ["Color / señas", mascota.color],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #1a2030" }}>
                <span style={{ color: "#64748B" }}>{label}</span>
                <span style={{ fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vacunas */}
        {vacunas.length > 0 && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Vacunación</div>

            {lastVac && (
              <div style={{ background: "#F4F6FB", borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 2 }}>Última vacuna</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{lastVac.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 2 }}>Aplicada</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lastVac.date}</div>
                  </div>
                </div>
              </div>
            )}

            {nextVac && (
              <div style={{ background: "#E5F7F6", borderRadius: 10, padding: "10px 14px", border: "1px solid #2CB8AD30", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 2 }}>Próxima vacuna</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{nextVac.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748B", marginBottom: 2 }}>Fecha</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#2CB8AD" }}>{nextVac.next_date}</div>
                  </div>
                </div>
              </div>
            )}

            {vacunas.map((v: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a2030" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>Aplicada: {v.date}</div>
                </div>
                <span style={{
                  background: v.status === "ok" ? "#2CB8AD22" : "#f8717122",
                  color: v.status === "ok" ? "#2CB8AD" : "#f87171",
                  borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700,
                  border: `1px solid ${v.status === "ok" ? "#2CB8AD44" : "#f8717144"}`,
                }}>
                  {v.status === "ok" ? "Al día" : "Vencida"}
                </span>
              </div>
            ))}
          </div>
        )}


        {/* Footer PetPass */}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontSize: 11, color: "#64748B" }}>Perfil digital creado con</div>
            <div style={{
              fontFamily: "Georgia, serif", fontWeight: 800, fontSize: 16, marginTop: 4,
              background: "linear-gradient(135deg, #1C3557, #2CB8AD)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>🐾 PetPass</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
