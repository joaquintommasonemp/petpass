"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function CarnetDigital() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/carnet/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true);
        else setData(d);
      });
  }, [id]);

  if (!data && !notFound) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #EEF2FF 0%, #F4F6FB 60%)", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="skeleton" style={{ width: 100, height: 42, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 90, height: 36, borderRadius: 10 }} />
      </div>
      <div style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 8px 40px rgba(28,53,87,0.14)" }}>
        <div className="skeleton" style={{ height: 140 }} />
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}
          </div>
          <div className="skeleton" style={{ height: 100, borderRadius: 14 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div className="skeleton" style={{ width: 80, height: 80, borderRadius: 10 }} />
            <div className="skeleton" style={{ width: 80, height: 40, borderRadius: 8 }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <p style={{ color: "#64748B", fontSize: 14 }}>Carnet no encontrado.</p>
    </div>
  );

  const { mascota, tutorName, vacunas } = data;
  const isGato = mascota?.breed?.toLowerCase().includes("gato");
  const carnetUrl = typeof window !== "undefined" ? window.location.href : `https://petpass.app/carnet/${id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(carnetUrl)}&bgcolor=ffffff&color=1C3557&margin=8`;

  const ultimaVacuna = vacunas[0] || null;

  function handlePrint() {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 100);
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .carnet-card { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <main className="carnet-page" style={{ minHeight: "100vh", background: "linear-gradient(160deg, #EEF2FF 0%, #F4F6FB 60%)", padding: "24px 16px 60px", display: "flex", flexDirection: "column", alignItems: "center" }}>

        {/* Header */}
        <div className="no-print carnet-toolbar" style={{ width: "100%", maxWidth: 420, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 42, objectFit: "contain" }} />
          </Link>
          <button onClick={handlePrint} disabled={printing} style={{
            background: "#1C3557", color: "#fff", border: "none",
            borderRadius: 10, padding: "8px 16px", fontSize: 12,
            fontWeight: 700, cursor: "pointer", opacity: printing ? 0.6 : 1,
          }}>🖨️ Imprimir</button>
        </div>

        {/* Carnet */}
        <div className="carnet-card" style={{
          width: "100%", maxWidth: 420,
          background: "#FFFFFF",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 8px 40px rgba(28,53,87,0.14), 0 2px 8px rgba(0,0,0,0.06)",
          animation: "fadeIn 0.4s ease both",
        }}>

          {/* Top strip */}
          <div style={{
            background: "linear-gradient(135deg, #2CB8AD 0%, #1C3557 100%)",
            padding: "24px 24px 20px",
            position: "relative",
          }}>
            {/* Subtle pattern */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.05,
              backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }} />

            <div style={{ position: "relative", display: "flex", gap: 18, alignItems: "flex-end" }}>
              {/* Photo */}
              <div style={{
                width: 90, height: 90, borderRadius: 18,
                border: "3px solid rgba(255,255,255,0.5)",
                overflow: "hidden", flexShrink: 0,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}>
                {mascota.photo_url
                  ? <img src={mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 44 }}>{isGato ? "🐱" : "🐕"}</span>}
              </div>

              <div style={{ flex: 1, paddingBottom: 4 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.1 }}>{mascota.name}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                  {mascota.breed}{mascota.age ? ` · ${mascota.age}` : ""}
                </div>
                {mascota.sex && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                    {mascota.sex === "Macho" ? "♂" : "♀"} {mascota.sex}
                    {mascota.castrado === "Sí" ? " · Castrado/a" : ""}
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    background: "rgba(255,255,255,0.2)", color: "#fff",
                    borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 800,
                    border: "1px solid rgba(255,255,255,0.3)", letterSpacing: 1,
                    textTransform: "uppercase",
                  }}>🪪 Carnet Digital</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px 24px" }}>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {mascota.weight && (
                <InfoCell icon="⚖️" label="Peso" value={mascota.weight} />
              )}
              {mascota.chip && (
                <InfoCell icon="📡" label="Microchip" value={`...${mascota.chip.slice(-6)}`} />
              )}
              {tutorName && (
                <InfoCell icon="👤" label="Tutor/a" value={tutorName} />
              )}
              {ultimaVacuna && (
                <InfoCell icon="💉" label="Última vacuna" value={ultimaVacuna.name} />
              )}
              {mascota.obra_social && (
                <InfoCell icon="🏥" label="Obra social" value={mascota.obra_social} />
              )}
              {mascota.os_numero && (
                <InfoCell icon="🪪" label="N° socio/póliza" value={mascota.os_numero} />
              )}
            </div>
            {mascota.obra_social && mascota.os_plan && (
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>🏥</span>
                <div>
                  <div style={{ fontSize: 10, color: "#3B82F6", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>Cobertura veterinaria</div>
                  <div style={{ fontSize: 12, color: "#1C3557", fontWeight: 700 }}>{mascota.obra_social} — {mascota.os_plan}</div>
                  {mascota.os_numero && <div style={{ fontSize: 11, color: "#64748B" }}>Socio/Póliza: {mascota.os_numero}</div>}
                </div>
              </div>
            )}

            {/* Vacunas */}
            {vacunas.length > 0 && (
              <div style={{ background: "#F4F6FB", borderRadius: 14, padding: "12px 14px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#1C3557", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  💉 Vacunación
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {vacunas.slice(0, 4).map((v: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#1C3557", fontWeight: 600 }}>{v.name}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{v.date}</div>
                        {v.next_date && (
                          <div style={{ fontSize: 10, color: "#2CB8AD", fontWeight: 700 }}>Próx: {v.next_date}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QR + PetPass brand */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontSize: 10, color: "#64748B", marginBottom: 6, fontWeight: 700 }}>Historial completo</div>
                <img
                  src={qrUrl}
                  alt="QR carnet"
                  style={{ width: 80, height: 80, borderRadius: 10, border: "1px solid #E2E8F0" }}
                />
              </div>
              <div style={{ textAlign: "right" }}>
                <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 30, objectFit: "contain", opacity: 0.7 }} />
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>petpass.app</div>
                <div style={{ fontSize: 10, color: "#CBD5E1", marginTop: 2 }}>Carnet digital verificado</div>
              </div>
            </div>
          </div>
        </div>

        {/* Compartir */}
        <div className="no-print carnet-share" style={{ marginTop: 20, width: "100%", maxWidth: 420 }}>
          <button onClick={() => {
            navigator.clipboard.writeText(carnetUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          }} style={{
            width: "100%",
            background: copied ? "#E5F7F6" : "#E5F7F6",
            color: copied ? "#229E94" : "#2CB8AD",
            border: `1px solid ${copied ? "#229E94" : "#B2E8E5"}`,
            borderRadius: 12, padding: "12px", fontWeight: 800, fontSize: 13, cursor: "pointer",
            transition: "all 0.2s",
          }}>{copied ? "✅ Link copiado" : "📋 Copiar link del carnet"}</button>
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 11, color: "#94A3B8" }}>
            Compartí el QR o el link para que veterinarios y guarderías puedan ver el historial de {mascota.name}.
          </div>
        </div>
      </main>
    </>
  );
}

function InfoCell({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "10px 12px", border: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 2 }}>{icon} {label}</div>
      <div style={{ fontSize: 12, color: "#1C3557", fontWeight: 700, lineHeight: 1.3 }}>{value}</div>
    </div>
  );
}
