"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 900, fontSize: 15, color: "#1C3557" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{ color: "#94A3B8", fontSize: 13, padding: "12px 0", fontStyle: "italic" }}>{text}</div>
  );
}

export default function HistorialPublico() {
  const { token } = useParams() as { token: string };
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/historial-compartido?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo cargar el historial. Revisá tu conexión e intentá de nuevo.");
        setLoading(false);
      });
  }, [token]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px" }}>
        <div className="skeleton" style={{ width: 120, height: 44, borderRadius: 8, marginBottom: 24 }} />
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 24 }}>
          <div className="skeleton" style={{ width: 72, height: 72, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ height: 24, width: "45%" }} />
            <div className="skeleton" style={{ height: 13, width: "60%" }} />
          </div>
        </div>
        {[1,2,3].map(i => (
          <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14, marginBottom: 12 }} />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontWeight: 900, fontSize: 22, color: "#1C3557", marginBottom: 8 }}>Link inválido o expirado</h2>
        <p style={{ color: "#64748B", fontSize: 14, lineHeight: 1.6 }}>
          Este link fue revocado, venció o no existe.<br />
          Pedile al tutor que genere un nuevo link desde PetPass.
        </p>
        <Link href="/" style={{ display: "inline-block", marginTop: 20, color: "#2CB8AD", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          Conocer PetPass →
        </Link>
      </div>
    </div>
  );

  const { mascota, historial, vacunas, alimentacion, expires_at, label } = data;
  const expiresDate = new Date(expires_at).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  const consultas = historial.filter((h: any) => !h.title?.startsWith("📅"));
  const turnos = historial.filter((h: any) => h.title?.startsWith("📅"));
  const vacunasVigentes = vacunas.filter((v: any) => v.next_date && new Date(v.next_date) >= new Date());
  const vacunasVencidas = vacunas.filter((v: any) => !v.next_date || new Date(v.next_date) < new Date());

  return (
    <main style={{ background: "#F4F6FB", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1C3557 0%, #2CB8AD 100%)",
        padding: "24px 20px 28px",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <Link href="/">
            <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 36, filter: "brightness(0) invert(1)", marginBottom: 20, display: "block" }} />
          </Link>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              background: "rgba(255,255,255,0.2)", border: "3px solid rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {mascota?.photo_url
                ? <img src={mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 36 }}>🐾</span>}
            </div>
            <div>
              <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 24, margin: 0, letterSpacing: "-0.3px" }}>
                {mascota?.name}
              </h1>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 3 }}>
                {[mascota?.breed, mascota?.age ? `${mascota.age}` : null, mascota?.weight ? `${mascota.weight} kg` : null].filter(Boolean).join(" · ")}
              </div>
              {mascota?.chip && (
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 4 }}>
                  Chip: {mascota.chip}
                </div>
              )}
            </div>
          </div>

          {label && (
            <div style={{ marginTop: 14, background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.9)", fontSize: 13 }}>
              📋 {label}
            </div>
          )}
        </div>
      </div>

      {/* Expiry banner */}
      <div style={{ background: "#FFFBEB", borderBottom: "1px solid #FDE68A", padding: "8px 20px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#92400E", fontWeight: 600 }}>
          🔗 Historial compartido · Acceso disponible hasta el {expiresDate}
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Datos generales */}
        {(mascota?.sex || mascota?.sterilized !== undefined || mascota?.blood_type) && (
          <div style={{
            background: "#fff", borderRadius: 16, padding: "16px 18px",
            border: "1px solid #E2E8F0", marginBottom: 20,
            display: "flex", flexWrap: "wrap", gap: "12px 24px",
          }}>
            {mascota?.sex && (
              <div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Sexo</div>
                <div style={{ fontSize: 14, color: "#1C3557", fontWeight: 700, marginTop: 2 }}>{mascota.sex}</div>
              </div>
            )}
            {mascota?.sterilized !== undefined && mascota?.sterilized !== null && (
              <div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Castrado/a</div>
                <div style={{ fontSize: 14, color: "#1C3557", fontWeight: 700, marginTop: 2 }}>{mascota.sterilized ? "Sí" : "No"}</div>
              </div>
            )}
            {mascota?.blood_type && (
              <div>
                <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Grupo sanguíneo</div>
                <div style={{ fontSize: 14, color: "#1C3557", fontWeight: 700, marginTop: 2 }}>{mascota.blood_type}</div>
              </div>
            )}
            {mascota?.allergies && (
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>⚠️ Alergias</div>
                <div style={{ fontSize: 14, color: "#1C3557", marginTop: 2 }}>{mascota.allergies}</div>
              </div>
            )}
          </div>
        )}

        {/* Vacunas */}
        <Section title="Vacunas" icon="💉">
          {vacunas.length === 0 ? <EmptyState text="Sin vacunas registradas" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vacunas.map((v: any) => {
                const vencida = v.next_date && new Date(v.next_date) < new Date();
                const hoy = new Date();
                const proxima = v.next_date && new Date(v.next_date);
                const diasRestantes = proxima ? Math.ceil((proxima.getTime() - hoy.getTime()) / 86400000) : null;
                return (
                  <div key={v.id} style={{
                    background: "#fff", border: `1px solid ${vencida ? "#FECACA" : "#E2E8F0"}`,
                    borderRadius: 12, padding: "12px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: "#1C3557" }}>{v.name}</div>
                      <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                        Aplicada: {v.date ? new Date(v.date).toLocaleDateString("es-AR") : "—"}
                        {v.vet && ` · ${v.vet}`}
                      </div>
                    </div>
                    {v.next_date && (
                      <div style={{
                        background: vencida ? "#FEF2F2" : diasRestantes !== null && diasRestantes <= 30 ? "#FFF7ED" : "#E5F7F6",
                        color: vencida ? "#EF4444" : diasRestantes !== null && diasRestantes <= 30 ? "#F97316" : "#2CB8AD",
                        borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800, whiteSpace: "nowrap",
                      }}>
                        {vencida ? "Vencida" : diasRestantes === 0 ? "Vence hoy" : diasRestantes === 1 ? "Vence mañana" : `Refuerzo ${new Date(v.next_date).toLocaleDateString("es-AR")}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Historia clínica */}
        <Section title="Historia clínica" icon="📋">
          {consultas.length === 0 ? <EmptyState text="Sin consultas registradas" /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {consultas.map((h: any) => (
                <div key={h.id} style={{
                  background: "#fff", border: "1px solid #E2E8F0",
                  borderRadius: 12, padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#1C3557" }}>{h.title}</div>
                    <div style={{ color: "#94A3B8", fontSize: 11, whiteSpace: "nowrap", marginLeft: 8 }}>
                      {h.date ? new Date(h.date).toLocaleDateString("es-AR") : ""}
                    </div>
                  </div>
                  {h.vet && <div style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>Dr/a. {h.vet}</div>}
                  {h.summary && (
                    <div style={{ color: "#475569", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{h.summary}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Alimentación */}
        {alimentacion && (
          <Section title="Alimentación actual" icon="🍽️">
            <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "14px 16px" }}>
              {alimentacion.marca && <div style={{ fontWeight: 800, fontSize: 14, color: "#1C3557", marginBottom: 4 }}>{alimentacion.marca}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
                {alimentacion.tipo && <span style={{ fontSize: 13, color: "#64748B" }}>Tipo: <strong>{alimentacion.tipo}</strong></span>}
                {alimentacion.cantidad && <span style={{ fontSize: 13, color: "#64748B" }}>Cantidad: <strong>{alimentacion.cantidad}</strong></span>}
                {alimentacion.frecuencia && <span style={{ fontSize: 13, color: "#64748B" }}>Frecuencia: <strong>{alimentacion.frecuencia}</strong></span>}
              </div>
              {alimentacion.notas && <div style={{ color: "#64748B", fontSize: 12, marginTop: 8 }}>{alimentacion.notas}</div>}
            </div>
          </Section>
        )}

        {/* Turnos */}
        {turnos.length > 0 && (
          <Section title="Próximos turnos" icon="📅">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {turnos.map((h: any) => (
                <div key={h.id} style={{
                  background: "#fff", border: "1px solid #E2E8F0",
                  borderRadius: 12, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1C3557" }}>{h.summary}</div>
                    {h.vet && <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{h.vet}</div>}
                  </div>
                  {h.date && (
                    <div style={{ color: "#2CB8AD", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {new Date(h.date).toLocaleDateString("es-AR")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 32, padding: "20px", background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0" }}>
          <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 32, width: "auto", objectFit: "contain", marginBottom: 8 }} />
          <p style={{ color: "#94A3B8", fontSize: 12, lineHeight: 1.6, margin: 0 }}>
            Historial generado por PetPass · El pasaporte digital de tu mascota 🐾<br />
            <Link href="/" style={{ color: "#2CB8AD", fontWeight: 700, textDecoration: "none" }}>{(process.env.NEXT_PUBLIC_SITE_URL || "mipetpass.com").replace("https://", "")}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
