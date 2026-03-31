"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type Message = { role: string; text: string; image?: string };

export default function Chat() {
  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: mascotas } = await supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true).limit(1);
      if (mascotas && mascotas[0]) {
        setMascota(mascotas[0]);
        const { data: hist } = await supabase.from("historial").select("*").eq("mascota_id", mascotas[0].id);
        const { data: vacs } = await supabase.from("vacunas").select("*").eq("mascota_id", mascotas[0].id);
        setHistorial([...(hist || []), ...(vacs || [])]);
        setMessages([{
          role: "assistant",
          text: `Hola! Soy el veterinario IA de ${mascotas[0].name}. Conozco su historial completo. Podés escribirme o mandarme una foto para que analice. ¿En qué te ayudo?`,
        }]);
      }
    }
    load();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageData(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageData(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function sendMessage() {
    if ((!input.trim() && !imageData) || loading) return;
    const userMsg = input.trim();
    setInput("");
    const newMsg: Message = { role: "user", text: userMsg || "Analizá esta foto de mi mascota", image: imagePreview || undefined };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    const systemPrompt = mascota
      ? `Sos un veterinario IA. Tenés acceso al perfil completo de ${mascota.name}:
- Raza: ${mascota.breed}, Edad: ${mascota.age}, Peso: ${mascota.weight}, Sexo: ${mascota.sex}, Color: ${mascota.color}
- Zona: ${mascota.location}
- Historial clínico: ${JSON.stringify(historial.slice(0, 10))}
Si te mandan una foto, analizala en detalle: describí lo que ves, identificá posibles síntomas, erupciones, heridas, o comportamientos anormales.
Respondé en español rioplatense, sé empático y claro. Siempre recordá que tu orientación no reemplaza una consulta veterinaria presencial.`
      : "Sos un veterinario IA. Respondé en español. Si te mandan fotos, analizalas.";

    try {
      const userContent: any[] = [];
      if (imageData) {
        userContent.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData } });
      }
      userContent.push({ type: "text", text: userMsg || "Analizá esta foto de mi mascota" });

      const apiMessages = [
        ...messages.filter(m => !m.image).map(m => ({ role: m.role, content: m.text })),
        { role: "user", content: userContent },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, messages: apiMessages }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Error de conexión. Intentá de nuevo." }]);
    }
    clearImage();
    setLoading(false);
  }

  const SUGGESTIONS = mascota
    ? [`Cuándo vacunar a ${mascota.name}?`, "Se rasca mucho", "Cuánto debería pesar?"]
    : ["Cómo sé si mi perro está enfermo?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>
      <div style={{ background: "#4ade8022", border: "1px solid #4ade8033", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12, color: "#4ade80" }}>
        🤖 IA con historial de {mascota?.name || "tu mascota"} · No reemplaza al veterinario
      </div>

      {/* Acceso rápido análisis de foto */}
      <button
        onClick={() => fileRef.current?.click()}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 12,
          background: "#181c27", border: "1px solid #60a5fa33", borderRadius: 12,
          padding: "10px 14px", marginBottom: 12, cursor: "pointer", textAlign: "left",
        }}
      >
        <span style={{ fontSize: 26 }}>📷</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#60a5fa" }}>Analizar foto de {mascota?.name || "tu mascota"}</div>
          <div style={{ fontSize: 11, color: "#7a8299", marginTop: 1 }}>Subí una foto y la IA detecta síntomas visibles</div>
        </div>
        <span style={{ marginLeft: "auto", color: "#60a5fa", fontSize: 18 }}>›</span>
      </button>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "82%",
              background: m.role === "user" ? "#4ade80" : "#181c27",
              color: m.role === "user" ? "#000" : "#f0f4ff",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
              border: m.role === "assistant" ? "1px solid #252a3a" : "none",
            }}>
              {m.image && (
                <img src={m.image} style={{ width: "100%", borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: "cover" }} />
              )}
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: "16px 16px 16px 4px", padding: "10px 18px", color: "#7a8299", fontSize: 13 }}>
              Analizando{imageData ? " la foto" : " historial"}...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Preview imagen */}
      {imagePreview && (
        <div style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
          <img src={imagePreview} style={{ height: 80, borderRadius: 8, border: "1px solid #4ade8044" }} />
          <button onClick={clearImage} style={{
            position: "absolute", top: -6, right: -6, background: "#f87171", color: "#fff",
            border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => fileRef.current?.click()} style={{
          background: "#181c27", border: "1px solid #252a3a", borderRadius: 12,
          padding: "10px 12px", fontSize: 18, cursor: "pointer",
        }}>📷</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Preguntá o mandá una foto..."
          style={{ flex: 1 }} />
        <button onClick={sendMessage} disabled={loading || (!input.trim() && !imageData)} style={{
          background: "#4ade80", color: "#000", border: "none", borderRadius: 12,
          padding: "10px 18px", fontWeight: 800, fontSize: 14,
          opacity: loading || (!input.trim() && !imageData) ? 0.5 : 1, cursor: "pointer",
        }}>↑</button>
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {SUGGESTIONS.map(q => (
          <button key={q} onClick={() => setInput(q)} style={{
            background: "transparent", border: "1px solid #252a3a", borderRadius: 20,
            padding: "4px 12px", color: "#7a8299", fontSize: 11, cursor: "pointer",
          }}>{q}</button>
        ))}
      </div>
    </div>
  );
}
