"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type Message = { role: string; text: string; image?: string };

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise(function(resolve) {
    const reader = new FileReader();
    reader.onload = function() { resolve((reader.result as string).split(",")[1]); };
    reader.readAsDataURL(blob);
  });
}

function renderMsg(text: string) {
  return text.split('\n').map(function(line, li) {
    const isBullet = line.startsWith('- ') || line.startsWith('* ');
    const isNumbered = /^\d+\. /.test(line);
    const content = isBullet ? line.slice(2) : isNumbered ? line.replace(/^\d+\. /, '') : line;
    const parts = content.split('**');
    const rendered = parts.map(function(p, pi) {
      if (pi % 2 === 1) return <strong key={pi}>{p}</strong>;
      return p || null;
    });
    if (!line.trim()) return <div key={li} style={{ height: 6 }} />;
    if (isBullet) return <div key={li} style={{ paddingLeft: 4, marginBottom: 3 }}>{"• "}{rendered}</div>;
    if (isNumbered) return <div key={li} style={{ paddingLeft: 4, marginBottom: 3 }}>{li + 1}{". "}{rendered}</div>;
    return <div key={li} style={{ marginBottom: 2 }}>{rendered}</div>;
  });
}

const FREE_LIMIT = 5;

export default function Chat() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [usedCount, setUsedCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [chatKey, setChatKey] = useState<string | null>(null);
  const [solicitandoPremium, setSolicitandoPremium] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function loadMascota(m: any, userId: string) {
    setMascota(m);
    setHistorial([]);
    const [{ data: hist }, { data: vacs }, { data: alim }] = await Promise.all([
      supabase.from("historial").select("*").eq("mascota_id", m.id).order("created_at", { ascending: false }),
      supabase.from("vacunas").select("*").eq("mascota_id", m.id),
      supabase.from("alimentacion").select("*").eq("mascota_id", m.id),
    ]);
    setHistorial([...(hist || []), ...(vacs || []), ...(alim || [])]);
    const welcome: Message = {
      role: "assistant",
      text: `Hola! Soy el veterinario IA de ${m.name}. Tengo acceso a su historial, vacunas, alimentación y documentos. ¿En qué te ayudo?`,
    };
    const key = `pp_chat_${userId}_${m.id}`;
    setChatKey(key);
    try {
      const saved = localStorage.getItem(key);
      const parsed: Message[] = saved ? JSON.parse(saved) : [];
      setMessages(parsed.length > 0 ? parsed : [welcome]);
    } catch {
      setMessages([welcome]);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        setAuthToken(session.access_token);

        const user = session.user;
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [{ data: allMascotas }, { data: profile }] = await Promise.all([
          supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true),
          supabase.from("profiles").select("ia_uses_count, ia_uses_month, is_premium").eq("id", user.id).single(),
        ]);
        setIsPremium(profile?.is_premium === true);
        const sameMonth = profile?.ia_uses_month === currentMonth;
        setUsedCount(sameMonth ? (profile?.ia_uses_count || 0) : 0);
        if (allMascotas && allMascotas.length > 0) {
          setMascotas(allMascotas);
          await loadMascota(allMascotas[0], user.id);
        }
      } finally {
        setLoadingInit(false);
      }
    }
    load();
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Persistir mensajes (sin imágenes, últimos 30) en cada actualización
  useEffect(() => {
    if (!chatKey || messages.length <= 1) return;
    try {
      const toSave = messages.filter(m => !m.image).slice(-30);
      localStorage.setItem(chatKey, JSON.stringify(toSave));
    } catch {}
  }, [messages, chatKey]);

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

  // Parsea el formato "archivo.pdf::url||nota::texto||ia::resumen"
  function parseDocSummary(raw: string): { fileName: string; url: string; nota: string; ia: string } {
    const segments = raw.split("||");
    const firstSep = segments[0].indexOf("::");
    const fileName = firstSep >= 0 ? segments[0].slice(0, firstSep) : segments[0];
    const url = firstSep >= 0 ? segments[0].slice(firstSep + 2) : "";
    let nota = "", ia = "";
    for (let i = 1; i < segments.length; i++) {
      const sep = segments[i].indexOf("::");
      if (sep < 0) continue;
      const key = segments[i].slice(0, sep);
      const val = segments[i].slice(sep + 2);
      if (key === "nota") nota = val;
      if (key === "ia") ia = val;
    }
    return { fileName, url, nota, ia };
  }

  function buildSystemPrompt() {
    const vacunas = historial.filter((h: any) => h.name && h.date && !h.title);
    const consultas = historial.filter((h: any) => h.title && !["Actualizacion de peso","Peso inicial","📅 Cita"].includes(h.title) && !(typeof h.summary === "string" && h.summary.includes("::")));
    const docItems = historial.filter((h: any) => typeof h.summary === "string" && h.summary.includes("::"));
    const citas = historial.filter((h: any) => h.title === "📅 Cita");
    const alim = historial.filter((h: any) => h.marca !== undefined || (h.tipo && !h.title));

    const vacsText = vacunas.length > 0
      ? vacunas.map((v: any) => {
          const next = v.next_date ? ", proxima " + v.next_date : "";
          return "- " + v.name + ": aplicada " + v.date + next + ", estado: " + (v.status || "ok");
        }).join("\n")
      : "- Sin vacunas registradas";
    const consultasText = consultas.length > 0
      ? consultas.slice(0, 8).map((h: any) => {
          const sum = h.summary ? " - " + h.summary : "";
          const vet = h.vet ? " (Vet: " + h.vet + ")" : "";
          return "- " + (h.date || "sin fecha") + ": " + h.title + sum + vet;
        }).join("\n")
      : "- Sin consultas registradas";
    const alimentText = alim.length > 0
      ? alim.map((a: any) => {
          const notas = a.notas ? " (" + a.notas + ")" : "";
          return "- " + (a.marca || a.tipo || "alimento") + ": " + (a.frecuencia || "") + notas;
        }).join("\n")
      : "- No registrada";
    // Incluye nombre, notas y resumen IA de cada documento
    const docsText = docItems.length > 0
      ? docItems.map((d: any) => {
          const { fileName, nota, ia } = parseDocSummary(d.summary);
          const lines = [`- ${fileName} (${d.date || "sin fecha"}) — ${d.title || "Documento"}`];
          if (nota) lines.push(`  Notas del veterinario: ${nota}`);
          if (ia) lines.push(`  Análisis IA del archivo: ${ia}`);
          return lines.join("\n");
        }).join("\n\n")
      : "- Sin documentos";
    const citasText = citas.length > 0
      ? citas.map((c: any) => {
          const vet = c.vet ? " con " + c.vet : "";
          return "- " + c.date + ": " + c.summary + vet;
        }).join("\n")
      : "- Sin citas agendadas";

    const castrado = mascota?.castrado ? "Castrado/a: " + mascota.castrado : "";
    if (!mascota) return "Sos VetIA de PetPass. Veterinario digital. Responde en espanol rioplatense, claro y empatico. Analiza fotos y documentos si te los mandan. Siempre indica cuando ir al veterinario.";
    return [
      "Sos VetIA, el veterinario digital de PetPass. Tenes acceso al perfil medico COMPLETO de " + mascota.name + " y debes usarlo en cada respuesta.",
      "",
      "PERFIL DE " + mascota.name.toUpperCase() + ":",
      "- Especie/Raza: " + (mascota.breed || "N/A") + " | Edad: " + (mascota.age || "N/A") + " | Peso: " + (mascota.weight || "N/A") + "kg | Sexo: " + (mascota.sex || "N/A"),
      "- Color: " + (mascota.color || "N/A") + " | Chip: " + (mascota.chip || "N/A") + " | Zona: " + (mascota.location || "N/A") + (castrado ? " | " + castrado : ""),
      "",
      "VACUNAS Y DESPARASITACIONES:",
      vacsText,
      "",
      "HISTORIAL CLINICO:",
      consultasText,
      "",
      "ALIMENTACION:",
      alimentText,
      "",
      "ESTUDIOS Y DOCUMENTOS MEDICOS:",
      "IMPORTANTE: El campo 'Analisis IA' de cada estudio ES el contenido real del archivo, extraido automaticamente al momento de su carga. Tratalo como si hubieras leido el archivo vos mismo. No digas que no podes acceder al contenido — ya lo tenes en el analisis.",
      docsText,
      "",
      "PROXIMAS CITAS:",
      citasText,
      "",
      "INSTRUCCIONES DE RESPUESTA:",
      "1. Usa SIEMPRE el nombre " + mascota.name + " y los datos del perfil para personalizar cada respuesta.",
      "2. Estructura tus respuestas con secciones claras cuando sea necesario (que pasa, que hacer, cuando ir al vet).",
      "3. Si el sintoma puede ser urgente, marcalo claramente con 'ATENCION URGENTE' al principio.",
      "4. Si la pregunta es vaga o necesitas mas datos, hace UNA pregunta puntual y concisa.",
      "5. Cuando analices fotos o documentos medicos: describe detalladamente lo que ves, valores importantes y recomendaciones.",
      "6. Si te mandan imagenes de estudios (radiografia, ecografia, analisis): interpreta los valores, compara con rangos normales para la especie/raza/edad y explica en terminos simples.",
      "7. Menciona cuando algo puede estar relacionado con su historial, vacunas o alimentacion registrada.",
      "8. Siempre termina con una linea breve sobre cuando consultar al veterinario presencialmente.",
      "9. Responde en espanol rioplatense, tono calido y profesional. Maximo 300 palabras salvo que sea un analisis de documento complejo.",
      "10. Tu orientacion no reemplaza la consulta veterinaria presencial.",
      "11. NUNCA digas que no podes abrir, leer o acceder a los archivos. El analisis de cada estudio ya esta incluido arriba y ES el contenido del archivo.",
    ].join("\n");
  }

  async function callChatAPI(userContent: any[], displayText: string, displayImage?: string) {
    const systemPrompt = buildSystemPrompt();
    const newMsg: Message = { role: "user", text: displayText, image: displayImage };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const apiMessages = [
        ...messages.filter(m => !m.image).map(m => ({ role: m.role, content: m.text })),
        { role: "user", content: userContent },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": "Bearer " + authToken } : {}),
        },
        body: JSON.stringify({ system: systemPrompt, messages: apiMessages }),
      });
      const data = await res.json();

      if (data.limitReached) {
        setShowUpgrade(true);
        setLoading(false);
        return;
      }
      if (data.used !== undefined) setUsedCount(data.used);
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Error de conexion. Intentá de nuevo." }]);
    }
    setLoading(false);
  }

  async function sendMessage() {
    if ((!input.trim() && !imageData) || loading) return;
    if (!isPremium && usedCount >= FREE_LIMIT) { setShowUpgrade(true); return; }

    const userMsg = input.trim();
    setInput("");
    const userContent: any[] = [];
    if (imageData) {
      userContent.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageData } });
    }
    userContent.push({ type: "text", text: userMsg || "Analizá esta foto de mi mascota" });

    await callChatAPI(userContent, userMsg || "Analizá esta foto de mi mascota", imagePreview || undefined);
    clearImage();
  }

  async function analyzeDocuments() {
    if (loading || loadingDocs) return;
    if (!isPremium && usedCount >= FREE_LIMIT) { setShowUpgrade(true); return; }

    const docItems = historial.filter((h: any) => typeof h.summary === "string" && h.summary.includes("::"));
    if (!docItems.length) {
      setMessages(prev => [...prev, { role: "assistant", text: "No tenés documentos ni estudios cargados todavía. Podés subir resultados de análisis, radiografías, ecografías u otros archivos desde la sección Historia Clínica > Docs." }]);
      return;
    }

    setLoadingDocs(true);
    const userContent: any[] = [];

    for (let i = 0; i < Math.min(docItems.length, 5); i++) {
      const doc = docItems[i];
      const { fileName, url } = parseDocSummary(doc.summary);
      if (!url) continue;
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      const isPdf = /\.pdf$/i.test(fileName);
      if (!isImage && !isPdf) continue;

      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const blob = await res.blob();
        const b64 = await blobToBase64(blob);
        if (isImage) {
          userContent.push({ type: "image", source: { type: "base64", media_type: blob.type || "image/jpeg", data: b64 } });
        } else {
          userContent.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } });
        }
        userContent.push({ type: "text", text: "Archivo: " + fileName + " | Fecha: " + (doc.date || "sin fecha") + " | Tipo estudio: " + (doc.title || "Documento") });
      } catch {}
    }

    setLoadingDocs(false);

    if (!userContent.length) {
      setMessages(prev => [...prev, { role: "assistant", text: "No pude cargar los documentos. Solo puedo leer imágenes (JPG/PNG) y PDFs por ahora." }]);
      return;
    }

    userContent.push({ type: "text", text: "Analizá estos estudios y documentos médicos de " + (mascota?.name || "mi mascota") + ". Interpretá los valores, compará con rangos normales, y decime si hay algo relevante o preocupante." });
    await callChatAPI(userContent, "Analizá mis estudios y documentos médicos");
  }

  function resetChat() {
    if (chatKey) localStorage.removeItem(chatKey);
    setMessages([{
      role: "assistant",
      text: mascota
        ? `Hola! Soy el veterinario IA de ${mascota.name}. Tengo acceso a su historial, vacunas, alimentación y documentos. ¿En qué te ayudo?`
        : "Hola! Soy VetIA de PetPass. ¿En qué te ayudo?",
    }]);
  }

  const remaining = Math.max(0, FREE_LIMIT - usedCount);
  const SUGGESTIONS = mascota
    ? [`Cuándo vacunar a ${mascota.name}?`, "Se rasca mucho", "Cuánto debería pesar?"]
    : ["Cómo sé si mi perro está enfermo?"];

  if (loadingInit) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "4px 0" }}>
      <div className="skeleton" style={{ height: 36, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 36, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
    </div>
  );

  return (
    <div className="vet-chat-page" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>

      {/* Selector de mascota */}
      {mascotas.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", paddingBottom: 2 }}>
          {mascotas.map(m => {
            const selected = mascota?.id === m.id;
            return (
              <button key={m.id} onClick={async () => {
                if (selected) return;
                const { data: { session } } = await supabase.auth.getSession();
                if (session) await loadMascota(m, session.user.id);
              }} style={{
                flexShrink: 0, border: `1px solid ${selected ? "#2CB8AD" : "#E2E8F0"}`,
                background: selected ? "#E5F7F6" : "#FFFFFF",
                borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700,
                color: selected ? "#2CB8AD" : "#64748B", cursor: "pointer",
              }}>
                {m.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Banner info / uso */}
      {isPremium ? (
        <div className="vet-chat-banner vet-chat-banner-premium" style={{ background: "#FDF2F8", border: "1px solid #FBCFE8", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12, color: "#EC4899", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>✨ <strong>Premium</strong> · Consultas ilimitadas activas</span>
          <button onClick={resetChat} style={{ background: "none", border: "none", color: "#EC4899", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "2px 8px" }}>+ Nueva</button>
        </div>
      ) : (
        <div className="vet-chat-banner" style={{
          background: usedCount >= FREE_LIMIT ? "#FFF0F0" : "#E5F7F6",
          border: `1px solid ${usedCount >= FREE_LIMIT ? "#FECACA" : "#B2E8E5"}`,
          borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12,
          color: usedCount >= FREE_LIMIT ? "#EF4444" : "#2CB8AD",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>🤖 {usedCount >= FREE_LIMIT ? "Límite mensual alcanzado" : `${remaining} consulta${remaining !== 1 ? "s" : ""} gratis restante${remaining !== 1 ? "s" : ""} este mes`}</span>
          <div style={{ display: "flex", gap: 6 }}>
            {messages.length > 1 && (
              <button onClick={resetChat} style={{
                background: "none", border: "none",
                color: usedCount >= FREE_LIMIT ? "#EF4444" : "#2CB8AD",
                fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "2px 8px",
              }}>+ Nueva</button>
            )}
            {usedCount >= FREE_LIMIT && (
              <button onClick={() => setShowUpgrade(true)} style={{
                background: "#EF4444", color: "#fff", border: "none",
                borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer",
              }}>Ver Premium</button>
            )}
          </div>
        </div>
      )}

      {/* Aviso médico legal */}
      <div className="vet-chat-disclaimer" style={{
        background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10,
        padding: "8px 14px", marginBottom: 10,
        fontSize: 11, color: "#92400E", lineHeight: 1.5,
        display: "flex", gap: 8, alignItems: "flex-start",
      }}>
        <span style={{ flexShrink: 0, fontSize: 14 }}>⚕️</span>
        <span>
          <strong>Aviso:</strong> Vet IA brinda orientación informativa y{" "}
          <strong>no reemplaza la consulta con un veterinario matriculado.</strong>{" "}
          No constituye diagnóstico ni prescripción veterinaria. Ante cualquier emergencia, llevá a tu mascota al veterinario de inmediato.
        </span>
      </div>

      {/* Botones de análisis */}
      <div className="vet-chat-tools" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 10,
            background: "#F4F6FB", border: "1px solid #BFDBFE", borderRadius: 12,
            padding: "10px 14px", cursor: "pointer", textAlign: "left",
          }}
        >
          <span style={{ fontSize: 22 }}>📷</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#3B82F6" }}>Foto</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Analizar síntomas</div>
          </div>
        </button>
        <button
          onClick={analyzeDocuments}
          disabled={loadingDocs || loading}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 10,
            background: "#F4F6FB", border: "1px solid #DDD6FE", borderRadius: 12,
            padding: "10px 14px", cursor: "pointer", textAlign: "left",
            opacity: loadingDocs || loading ? 0.6 : 1,
          }}
        >
          <span style={{ fontSize: 22 }}>📋</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#8B5CF6" }}>
              {loadingDocs ? "Cargando..." : "Estudios"}
            </div>
            <div style={{ fontSize: 10, color: "#64748B" }}>
              {historial.filter((h: any) => typeof h.summary === "string" && h.summary.includes("::")).length > 0
                ? historial.filter((h: any) => typeof h.summary === "string" && h.summary.includes("::")).length + " doc(s)"
                : "Sin documentos"}
            </div>
          </div>
        </button>
      </div>

      {/* Mensajes */}
      <div className="vet-chat-messages" style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "msg-enter-right" : "msg-enter-left"}
            style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            <div style={{
              maxWidth: "82%",
              background: m.role === "user" ? "linear-gradient(135deg, #2CB8AD, #229E94)" : "#F4F6FB",
              color: m.role === "user" ? "#fff" : "#1C3557",
              borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "10px 14px", fontSize: 13, lineHeight: 1.5,
              border: m.role === "assistant" ? "1px solid #E2E8F0" : "none",
              boxShadow: m.role === "user" ? "0 2px 8px rgba(44,184,173,0.25)" : "none",
            }}>
              {m.image && <img src={m.image} style={{ width: "100%", borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: "cover" }} />}
              {m.role === "assistant" ? renderMsg(m.text) : m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: "16px 16px 16px 4px", padding: "10px 18px", color: "#64748B", fontSize: 13 }}>
              Analizando{imageData ? " la foto" : ""}...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Preview imagen */}
      {imagePreview && (
        <div style={{ position: "relative", marginBottom: 8, display: "inline-block" }}>
          <img src={imagePreview} style={{ height: 80, borderRadius: 8, border: "1px solid #B2E8E5" }} />
          <button onClick={clearImage} style={{
            position: "absolute", top: -6, right: -6, background: "#EF4444", color: "#fff",
            border: "none", borderRadius: "50%", width: 20, height: 20, fontSize: 12,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
      )}

      {/* Input */}
      <div className="vet-chat-composer" style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => fileRef.current?.click()} style={{
          background: "#F4F6FB", border: "1px solid #E2E8F0", borderRadius: 12,
          padding: "10px 12px", fontSize: 18, cursor: "pointer",
        }}>📷</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={usedCount >= FREE_LIMIT && !isPremium ? "Límite alcanzado — activá Premium" : "Preguntá o mandá una foto..."}
          disabled={usedCount >= FREE_LIMIT && !isPremium}
          style={{ flex: 1 }} />
        <button onClick={sendMessage} disabled={loading || (!input.trim() && !imageData)} style={{
          background: "#2CB8AD", color: "#fff", border: "none", borderRadius: 12,
          padding: "10px 18px", fontWeight: 800, fontSize: 14,
          opacity: loading || (!input.trim() && !imageData) ? 0.5 : 1, cursor: "pointer",
        }}>↑</button>
      </div>

      <div className="vet-chat-suggestions" style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        {SUGGESTIONS.map(q => (
          <button key={q} onClick={() => setInput(q)} style={{
            background: "transparent", border: "1px solid #E2E8F0", borderRadius: 20,
            padding: "4px 12px", color: "#64748B", fontSize: 11, cursor: "pointer",
          }}>{q}</button>
        ))}
      </div>

      {/* Modal upgrade */}
      {showUpgrade && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000090", zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "#F4F6FB", border: "1px solid #FBCFE8",
            borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Límite del plan gratuito</h3>
            <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Usaste tus <strong style={{ color: "#1C3557" }}>{FREE_LIMIT} consultas gratuitas</strong> de este mes.<br />
              Activá Premium para tener consultas ilimitadas con la IA veterinaria.
            </p>

            <div style={{ background: "#F4F6FB", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" }}>
              <div style={{ fontWeight: 800, color: "#EC4899", marginBottom: 10, textAlign: "center" }}>✨ Premium · $3.000/mes</div>
              {["Consultas IA ilimitadas", "Análisis de fotos ilimitado", "Historial clínico completo", "Soporte prioritario"].map(f => (
                <div key={f} style={{ fontSize: 13, color: "#1C3557", padding: "4px 0", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#2CB8AD" }}>✓</span> {f}
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                setSolicitandoPremium(true);
                try {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) return;
                  const res = await fetch("/api/suscripcion/crear", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${session.access_token}` },
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } finally {
                  setSolicitandoPremium(false);
                }
              }}
              disabled={solicitandoPremium}
              style={{
                display: "block", width: "100%",
                background: "linear-gradient(135deg, #EC4899, #DB2777)",
                color: "#fff", border: "none", borderRadius: 12, padding: "13px 20px",
                fontWeight: 900, fontSize: 15, cursor: "pointer", marginBottom: 10,
                opacity: solicitandoPremium ? 0.6 : 1,
              }}
            >{solicitandoPremium ? "Redirigiendo..." : "✨ Activar Premium · $3.000/mes →"}</button>

            <button onClick={() => setShowUpgrade(false)} style={{
              background: "transparent", border: "1px solid #E2E8F0",
              color: "#64748B", borderRadius: 12, padding: "10px 20px",
              fontSize: 13, cursor: "pointer", width: "100%",
            }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
