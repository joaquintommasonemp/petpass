"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function PerdidaPublica() {
  const params = useParams();
  const id = params?.id as string;
  const [perdida, setPerdida] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ nombre: "", ubicacion: "", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`/api/perdida/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setNotFound(true);
        else setPerdida(data);
      });
  }, [id]);

  async function handleEnviar() {
    if (!form.mensaje.trim()) { setError("El mensaje es obligatorio"); return; }
    setEnviando(true);
    setError("");
    const res = await fetch(`/api/perdida/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.ok) {
      setEnviado(true);
    } else {
      setError(data.error || "Error al enviar. Intentá de nuevo.");
    }
    setEnviando(false);
  }

  function daysSince(dateStr: string) {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }

  if (!perdida && !notFound) return (
    <div style={{ maxWidth: 440, margin: "0 auto", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ background: "linear-gradient(160deg, #FFF0F0 0%, #F4F6FB 70%)", padding: "24px 20px 20px", borderBottom: "1px solid #FECACA" }}>
        <div className="skeleton" style={{ width: 90, height: 42, borderRadius: 8, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: 120, height: 24, borderRadius: 20, marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div className="skeleton" style={{ width: 72, height: 72, borderRadius: 14, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ height: 28, width: "60%" }} />
            <div className="skeleton" style={{ height: 14, width: "80%" }} />
            <div className="skeleton" style={{ height: 14, width: "50%" }} />
          </div>
        </div>
      </div>
      <div style={{ padding: "20px" }}>
        <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px", textAlign: "center", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
      <h2 style={{ color: "#1C3557", marginBottom: 8 }}>Alerta no encontrada</h2>
      <p style={{ color: "#64748B", fontSize: 13 }}>Esta mascota ya fue encontrada o la alerta fue desactivada.</p>
      <Link href="/" style={{ display: "inline-block", marginTop: 20, color: "#2CB8AD", fontWeight: 700, textDecoration: "none", fontSize: 13 }}>
        Ir a PetPass →
      </Link>
    </div>
  );

  const days = daysSince(perdida.created_at);
  const isGato = perdida.breed?.toLowerCase().includes("gato") || perdida.breed?.toLowerCase().includes("cat");

  return (
    <main className="lost-public-page" style={{ maxWidth: 440, margin: "0 auto", background: "#F4F6FB", minHeight: "100vh" }}>

      {/* Header */}
      <div className="lost-public-hero" style={{
        background: "linear-gradient(160deg, #FFF0F0 0%, #F4F6FB 70%)",
        padding: "24px 20px 20px", borderBottom: "1px solid #FECACA",
      }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", marginBottom: 16 }}>
          <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 42, width: "auto", objectFit: "contain" }} />
        </Link>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
          <span style={{
            background: "#FFF0F0", color: "#EF4444",
            borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 800,
            border: "1px solid #FECACA",
          }}>🚨 MASCOTA PERDIDA</span>
          <span style={{ fontSize: 11, color: "#64748B" }}>hace {days}d</span>
        </div>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 14, flexShrink: 0,
            background: "#F4F6FB", border: "2px solid #FECACA",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {perdida.photo_url
              ? <img src={perdida.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 36 }}>{isGato ? "🐱" : "🐶"}</span>}
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 24, fontFamily: "Georgia, serif", color: "#1C3557" }}>
              {perdida.pet_name}
            </div>
            {perdida.breed && (
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 2 }}>
                {perdida.breed}{perdida.color ? ` · ${perdida.color}` : ""}
              </div>
            )}
            {perdida.zone && (
              <div style={{ color: "#EF4444", fontSize: 12, fontWeight: 700, marginTop: 3 }}>
                📍 {perdida.zone}
              </div>
            )}
          </div>
        </div>

        {perdida.description && (
          <div style={{ marginTop: 14, background: "#FFF0F0", borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#EF4444", fontWeight: 700, marginBottom: 4 }}>Descripción</div>
            <p style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.6, margin: 0 }}>{perdida.description}</p>
          </div>
        )}
      </div>

      {/* Formulario de avistamiento */}
      <div className="lost-public-content" style={{ padding: "20px 20px 60px" }}>
        {enviado ? (
          <div className="lost-public-success" style={{
            background: "#FFFFFF", border: "1px solid #B2E8E5",
            borderRadius: 16, padding: 28, textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontWeight: 900, fontSize: 18, color: "#1C3557", marginBottom: 8 }}>
              ¡Mensaje enviado!
            </h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              El tutor de <strong style={{ color: "#1C3557" }}>{perdida.pet_name}</strong> recibió tu avistamiento. Gracias por ayudar.
            </p>
            <button
              onClick={() => { setEnviado(false); setForm({ nombre: "", ubicacion: "", mensaje: "" }); }}
              style={{
                background: "#E2E8F0", color: "#64748B", border: "none",
                borderRadius: 10, padding: "9px 20px", fontSize: 13, cursor: "pointer",
              }}
            >Enviar otro aviso</button>
          </div>
        ) : (
          <div className="lost-public-form" style={{ background: "#FFFFFF", border: "1px solid #FECACA", borderRadius: 16, padding: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#EF4444", marginBottom: 4 }}>
              👋 ¿La viste? Avisanos
            </div>
            <p style={{ color: "#64748B", fontSize: 12, lineHeight: 1.5, marginBottom: 16 }}>
              Tu nombre es opcional. El tutor recibirá tu aviso de forma privada.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder="Tu nombre (opcional)"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
              <input
                placeholder="¿Dónde la viste? (ej: Av. Corrientes y Pueyrredón)"
                value={form.ubicacion}
                onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
              />
              <textarea
                placeholder="Contanos más detalles: cuándo, cómo estaba, si alguien la tiene..."
                value={form.mensaje}
                rows={3}
                onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                style={{
                  background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10,
                  padding: "10px 14px", color: "#1C3557", resize: "none",
                  fontFamily: "inherit", fontSize: 13, outline: "none",
                }}
              />
              {error && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px", color: "#EF4444", fontSize: 12 }}>
                  {error}
                </div>
              )}
              <button
                onClick={handleEnviar}
                disabled={enviando || !form.mensaje.trim()}
                style={{
                  background: "linear-gradient(135deg, #EF4444, #DC2626)",
                  color: "#fff", border: "none", borderRadius: 12, padding: 14,
                  fontWeight: 900, fontSize: 15, cursor: "pointer",
                  opacity: enviando || !form.mensaje.trim() ? 0.6 : 1,
                }}
              >
                {enviando ? "Enviando..." : "Enviar avistamiento"}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 20, lineHeight: 1.6 }}>
          PetPass protege tu privacidad.<br />
          Nunca compartimos tu información con terceros.
        </p>
      </div>
    </main>
  );
}
