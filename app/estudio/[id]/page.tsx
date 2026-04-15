"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function EstudioPublico() {
  const params = useParams();
  const id = params?.id as string;
  const [info, setInfo] = useState<{ link: any; mascota: any } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [vetName, setVetName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("petpass_vet_nombre") || "" : ""
  );
  const [note, setNote] = useState("");
  const [studyType, setStudyType] = useState("Otro");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/estudio/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setNotFound(true);
        else setInfo(data);
      });
  }, [id]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setFilePreview(null);
    }
  }

  async function handleSend() {
    if (!file) return;
    setSending(true);
    if (vetName) localStorage.setItem("petpass_vet_nombre", vetName);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(",")[1];
      const res = await fetch(`/api/estudio/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vetName, note, fileBase64: base64, fileName: file.name, fileType: file.type, studyType }),
      });
      const data = await res.json();
      if (data.ok) {
        setSent(true);
        setAiSummary(data.aiSummary || null);
      } else {
        setUploadError(data.error || "Error al subir el archivo. Intentá de nuevo.");
      }
      setSending(false);
    };
    reader.readAsDataURL(file);
  }

  if (!info && !notFound) return (
    <div style={{ maxWidth: 440, margin: "0 auto", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(160deg, #EEF2FF 0%, #F4F6FB 70%)", padding: "24px 20px 20px", borderBottom: "1px solid #E2E8F0" }}>
        <div className="skeleton" style={{ width: 90, height: 44, borderRadius: 8, marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ height: 24, width: "55%" }} />
            <div className="skeleton" style={{ height: 14, width: "70%" }} />
          </div>
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px", textAlign: "center", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
      <h2 style={{ color: "#1C3557", marginBottom: 8 }}>Link inválido o expirado</h2>
      <p style={{ color: "#64748B", fontSize: 13 }}>Este link fue revocado o no existe.</p>
    </div>
  );

  const { mascota } = info!;
  const isGato = mascota?.breed?.toLowerCase().includes("gato");

  if (sent) return (
    <div className="study-public-page study-public-success-page" style={{ maxWidth: 440, margin: "0 auto", padding: "40px 24px", textAlign: "center", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>¡Estudio enviado!</h2>
      <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
        El estudio de <strong style={{ color: "#1C3557" }}>{mascota?.name}</strong> llegó al historial del dueño.
      </p>
      {aiSummary && (
        <div style={{ background: "#FFFFFF", border: "1px solid #2CB8AD33", borderRadius: 16, padding: 16, textAlign: "left", marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#2CB8AD", fontWeight: 700, marginBottom: 8 }}>🤖 Análisis automático de la imagen</div>
          <div style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 10 }}>{aiSummary}</div>
          <div style={{ fontSize: 11, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "6px 10px" }}>
            ⚕️ Este análisis es orientativo y no reemplaza la interpretación de un veterinario matriculado.
          </div>
        </div>
      )}
      <button onClick={() => { setSent(false); setFile(null); setFilePreview(null); setNote(""); setAiSummary(null); }} style={{
        background: "#E2E8F0", color: "#64748B", border: "none",
        borderRadius: 12, padding: "10px 20px", fontSize: 13, cursor: "pointer",
      }}>Enviar otro archivo</button>
    </div>
  );

  return (
    <main className="study-public-page" style={{ maxWidth: 440, margin: "0 auto", background: "#F4F6FB", minHeight: "100vh" }}>

      {/* Header */}
      <div className="study-public-hero" style={{
        background: "linear-gradient(160deg, #EEF2FF 0%, #F4F6FB 70%)",
        padding: "24px 20px 20px", borderBottom: "1px solid #E2E8F0",
      }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", marginBottom: 16 }}>
          <Image src="/logo-brand-official.png" alt="PetPass" width={160} height={44} priority style={{ height: 44, width: "auto", objectFit: "contain" }} />
        </Link>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", flexShrink: 0,
            background: "#E2E8F0", border: "2px solid #60a5fa44",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {mascota?.photo_url
              ? <img src={mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 32 }}>{isGato ? "🐱" : "🐕"}</span>}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 22, fontFamily: "Georgia, serif" }}>{mascota?.name}</div>
            <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>{mascota?.breed}{mascota?.age ? ` · ${mascota.age}` : ""}</div>
            <span style={{ background: "#60a5fa22", color: "#60a5fa", borderRadius: 20, padding: "2px 10px", fontSize: 10, fontWeight: 700, border: "1px solid #60a5fa44", display: "inline-block", marginTop: 4 }}>
              🔬 Portal de estudios
            </span>
          </div>
        </div>

        {info!.link.notes && (
          <div style={{ marginTop: 14, background: "#F4F6FB", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#60a5fa", fontWeight: 700, marginBottom: 4 }}>📋 Indicaciones del tutor</div>
            <div style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.5 }}>{info!.link.notes}</div>
          </div>
        )}
      </div>

      <div className="study-public-content" style={{ padding: "20px 20px 60px" }}>

        <div className="study-public-form" style={{ background: "#FFFFFF", border: "1px solid #60a5fa44", borderRadius: 16, padding: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#60a5fa", marginBottom: 16 }}>
            📤 Subir estudio o resultado
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              placeholder="Tu nombre o clínica (ej: Clínica VetCentro)"
              value={vetName}
              onChange={e => setVetName(e.target.value)}
            />
            <select
              value={studyType}
              onChange={e => setStudyType(e.target.value)}
              style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: "#1C3557", fontSize: 13, fontWeight: 700 }}
            >
              {["Radiografia","Ecografia","Laboratorio","Tomografia","Resonancia","Electrocardiograma","Biopsia","Receta","Otro"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <textarea
              placeholder="Notas o indicaciones del estudio (ej: Resultados dentro de los valores normales, repetir en 6 meses...)"
              value={note}
              rows={3}
              onChange={e => setNote(e.target.value)}
              style={{
                background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10,
                padding: "10px 14px", color: "#1C3557", resize: "none", fontFamily: "inherit", outline: "none",
              }}
            />

            {/* Selector de archivo */}
            {file ? (
              <div style={{ background: "#F4F6FB", borderRadius: 12, padding: 12 }}>
                {filePreview ? (
                  <img src={filePreview} style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover", marginBottom: 8 }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 24 }}>📄</span>
                    <span style={{ fontSize: 13, color: "#1C3557" }}>{file.name}</span>
                  </div>
                )}
                <button onClick={() => { setFile(null); setFilePreview(null); if (fileRef.current) fileRef.current.value = ""; }} style={{
                  background: "#f8717122", color: "#f87171", border: "none",
                  borderRadius: 8, padding: "4px 12px", fontSize: 12, cursor: "pointer",
                }}>Cambiar archivo</button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{
                background: "#E2E8F0", color: "#64748B", border: "1px dashed #E2E8F0",
                borderRadius: 12, padding: 20, textAlign: "center", cursor: "pointer", width: "100%",
              }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>📎</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Seleccionar archivo</div>
                <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>PDF, JPG, PNG — radiografías, análisis, ecografías</div>
              </button>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: "none" }} onChange={handleFile} />

            {uploadError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", color: "#EF4444", fontSize: 12 }}>
                ❌ {uploadError}
              </div>
            )}
            {file && (
              <button onClick={() => { setUploadError(null); handleSend(); }} disabled={sending} style={{
                background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                color: "#fff", border: "none", borderRadius: 12, padding: 14,
                fontWeight: 900, fontSize: 15, cursor: "pointer",
                opacity: sending ? 0.6 : 1,
              }}>
                {sending ? "Enviando y analizando..." : "Enviar al historial de " + mascota?.name}
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: "center", color: "#64748B", fontSize: 11, lineHeight: 1.6 }}>
          El estudio llegará directamente al historial clínico digital del tutor.<br />
          Si es una imagen, la IA extrae los datos más relevantes automáticamente.
        </div>
      </div>
    </main>
  );
}
