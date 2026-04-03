"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

export default function PaseoPublico() {
  const params = useParams();
  const id = params?.id as string;
  const [session, setSession] = useState<any>(null);
  const [mascota, setMascota] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [message, setMessage] = useState("");
  const [authorName, setAuthorName] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("petpass_cuidador_nombre") || "" : ""
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    const { data: sess } = await supabase.from("paseo_sessions").select("*").eq("id", id).single();
    if (!sess) { setNotFound(true); setLoading(false); return; }
    setSession(sess);
    // Guardar sesión en historial local del cuidador
    if (typeof window !== "undefined") {
      const prev = JSON.parse(localStorage.getItem("petpass_sesiones_cuidador") || "[]");
      if (!prev.includes(id)) {
        localStorage.setItem("petpass_sesiones_cuidador", JSON.stringify([id, ...prev].slice(0, 20)));
      }
    }
    const { data: m } = await supabase.from("mascotas").select("*").eq("id", sess.mascota_id).single();
    setMascota(m);
    const { data: upds } = await supabase.from("paseo_updates")
      .select("*").eq("session_id", id).order("created_at", { ascending: false });
    setUpdates(upds || []);
    setLoading(false);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function sendUpdate() {
    if (!message.trim()) return;
    setSending(true);
    if (authorName) localStorage.setItem("petpass_cuidador_nombre", authorName);

    let photo_url: string | null = null;
    if (photoFile) {
      const path = `paseos/${id}/${Date.now()}_${photoFile.name}`;
      const { error } = await supabase.storage.from("comunidad").upload(path, photoFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from("comunidad").getPublicUrl(path);
        photo_url = urlData.publicUrl;
      }
    }

    const entry = {
      session_id: id,
      mascota_id: session.mascota_id,
      message: message.trim(),
      author_name: authorName || "Cuidador",
      photo_url,
    };
    const { data } = await supabase.from("paseo_updates").insert(entry).select();
    if (data) setUpdates(prev => [data[0], ...prev]);
    setMessage("");
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setSending(false);
  }

  if (loading) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px", textAlign: "center", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ color: "#64748B" }}>Cargando...</div>
    </div>
  );

  if (notFound || !session?.active) return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "60px 24px", textAlign: "center", background: "#F4F6FB", minHeight: "100vh" }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
      <h2 style={{ color: "#1C3557", marginBottom: 8 }}>Sesión no disponible</h2>
      <p style={{ color: "#64748B", fontSize: 13 }}>Esta sesión no existe o ya fue finalizada por el dueño.</p>
    </div>
  );

  const isGato = mascota?.breed?.toLowerCase().includes("gato");

  return (
    <main style={{ maxWidth: 440, margin: "0 auto", background: "#F4F6FB", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(160deg, #E5F7F6 0%, #F4F6FB 70%)",
        padding: "24px 20px 20px", borderBottom: "1px solid #E2E8F0",
      }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", marginBottom: 16 }}>
          <img src="/logo.png" alt="PetPass" style={{ height: 32, width: "auto", objectFit: "contain" }} />
        </Link>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: "#E2E8F0", border: "3px solid #2CB8AD44",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            {mascota?.photo_url
              ? <img src={mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 36 }}>{isGato ? "🐱" : "🐕"}</span>}
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, fontFamily: "Georgia, serif", marginBottom: 4 }}>{mascota?.name}</h1>
            <div style={{ color: "#64748B", fontSize: 12, marginBottom: 6 }}>
              {mascota?.breed}{mascota?.age ? ` · ${mascota.age}` : ""}
            </div>
            <span style={{
              background: "#2CB8AD22", color: "#2CB8AD", borderRadius: 20, padding: "2px 10px",
              fontSize: 11, fontWeight: 700, border: "1px solid #2CB8AD44",
            }}>Sesión activa</span>
          </div>
        </div>

        {session.notes && (
          <div style={{ marginTop: 14, background: "#F4F6FB", borderRadius: 12, padding: "10px 14px" }}>
            <div style={{ fontSize: 11, color: "#2CB8AD", fontWeight: 700, marginBottom: 4 }}>📋 Instrucciones del dueño</div>
            <div style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.5 }}>{session.notes}</div>
          </div>
        )}
      </div>

      <div style={{ padding: "20px 20px 60px" }}>

        {/* Formulario de actualización */}
        <div style={{ background: "#FFFFFF", border: "1px solid #2CB8AD44", borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: "#2CB8AD" }}>
            📢 Enviá una novedad al dueño
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              placeholder="Tu nombre (ej: Lucía)"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              style={{ fontSize: 14 }}
            />
            <textarea
              placeholder={`¿Cómo está ${mascota?.name}? Contá una novedad...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              style={{
                background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 10,
                padding: "10px 14px", color: "#1C3557", resize: "none", fontSize: 14,
                fontFamily: "inherit", outline: "none",
              }}
            />

            {photoPreview && (
              <div style={{ position: "relative", display: "inline-block" }}>
                <img src={photoPreview} style={{ width: "100%", borderRadius: 10, maxHeight: 200, objectFit: "cover" }} />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{
                  position: "absolute", top: 6, right: 6, background: "#f87171", color: "#fff",
                  border: "none", borderRadius: "50%", width: 24, height: 24,
                  cursor: "pointer", fontWeight: 800, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                }}>×</button>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => fileRef.current?.click()} style={{
                background: "#E2E8F0", color: "#64748B", border: "1px solid #E2E8F0",
                borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>📷 Foto</button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
              <button onClick={sendUpdate} disabled={sending || !message.trim()} style={{
                flex: 1, background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff", border: "none", borderRadius: 10, padding: 12,
                fontWeight: 900, fontSize: 15, cursor: "pointer",
                opacity: sending || !message.trim() ? 0.6 : 1,
              }}>{sending ? "Enviando..." : "Enviar novedad"}</button>
            </div>
          </div>
        </div>

        {/* Timeline de updates */}
        {updates.length > 0 && (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Novedades ({updates.length})
            </div>
            {updates.map((u: any, i: number) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>👤 {u.author_name || "Cuidador"}</span>
                  <span style={{ fontSize: 11, color: "#64748B" }}>{timeAgo(u.created_at)}</span>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.5 }}>{u.message}</div>
                {u.photo_url && (
                  <img src={u.photo_url} style={{ width: "100%", borderRadius: 10, marginTop: 8, maxHeight: 240, objectFit: "cover" }} />
                )}
              </div>
            ))}
          </>
        )}

        {updates.length === 0 && (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#64748B", fontSize: 13 }}>
            Aún no hay novedades. ¡Enviá la primera!
          </div>
        )}

        {/* Link a panel multi-sesión */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Link href="/paseo" style={{
            fontSize: 12, color: "#64748B", textDecoration: "none",
            background: "#FFFFFF", border: "1px solid #E2E8F0",
            borderRadius: 10, padding: "8px 16px", display: "inline-block",
          }}>
            📋 Ver todas mis sesiones activas →
          </Link>
        </div>
      </div>
    </main>
  );
}
