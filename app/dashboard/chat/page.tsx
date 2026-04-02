"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type Message = { role: string; text: string; image?: string };

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
  const [mascota, setMascota] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [usedCount, setUsedCount] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setAuthToken(session.access_token);

      const user = session.user;
      const { data: mascotas } = await supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true).limit(1);
      if (mascotas?.[0]) {
        setMascota(mascotas[0]);
        const [{ data: hist }, { data: vacs }, { data: alim }] = await Promise.all([
          supabase.from("historial").select("*").eq("mascota_id", mascotas[0].id).order("created_at", { ascending: false }),
          supabase.from("vacunas").select("*").eq("mascota_id", mascotas[0].id),
          supabase.from("alimentacion").select("*").eq("mascota_id", mascotas[0].id),
        ]);
        setHistorial([...(hist || []), ...(vacs || []), ...(alim || [])]);
        setMessages([{
          role: "assistant",
          text: `Hola! Soy el veterinario IA de ${mascotas[0].name}. Tengo acceso a su historial, vacunas, alimentación y documentos. ¿En qué te ayudo?`,
        }]);
      }

      // Cargar uso actual
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: profile } = await supabase
        .from("profiles").select("ia_uses_count, ia_uses_month, is_premium").eq("id", user.id).single();
      setIsPremium(profile?.is_premium === true);
      const sameMonth = profile?.ia_uses_month === currentMonth;
      setUsedCount(sameMonth ? (profile?.ia_uses_count || 0) : 0);
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

    if (!isPremium && usedCount >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    const userMsg = input.trim();
    setInput("");
    const newMsg: Message = { role: "user", text: userMsg || "Analizá esta foto de mi mascota", image: imagePreview || undefined };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    const vacunas = historial.filter((h: any) => h.name && h.date && !h.title);
    const consultas = historial.filter((h: any) => h.title && !["Actualización de peso","Peso inicial","📄 Documento","📅 Cita"].includes(h.title));
    const docs = historial.filter((h: any) => h.title === "📄 Documento");
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
    const docsText = docs.length > 0
      ? docs.map((d: any) => "- " + (d.summary?.split("::")?.[0] || "documento") + " (" + (d.date || "sin fecha") + ")").join("\n")
      : "- Sin documentos";
    const citasText = citas.length > 0
      ? citas.map((c: any) => {
          const vet = c.vet ? " con " + c.vet : "";
          return "- " + c.date + ": " + c.summary + vet;
        }).join("\n")
      : "- Sin citas agendadas";

    const castrado = mascota?.castrado ? "Castrado/a: " + mascota.castrado : "";
    const systemPromptLines = mascota ? [
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
      "DOCUMENTOS Y ESTUDIOS:",
      docsText,
      "",
      "PROXIMAS CITAS:",
      citasText,
      "",
      "INSTRUCCIONES DE RESPUESTA:",
      "1. Usa SIEMPRE el nombre " + mascota.name + " y los datos del perfil para personalizar cada respuesta.",
      "2. Estructura tus respuestas con secciones claras cuando sea necesario (que pasa, que hacer, cuando ir al vet).",
      "3. Si el sintoma puede ser urgente, marcalo claramente con 'ATENCION URGENTE' al principio.",
      "4. Si la pregunta es vaga o necesitas mas datos para dar una buena orientacion, hace UNA pregunta puntual y concisa.",
      "5. Cuando analices fotos: describe detalladamente lo que ves, posibles causas y recomendaciones.",
      "6. Menciona cuando algo puede estar relacionado con su historial, vacunas o alimentacion registrada.",
      "7. Siempre termina con una linea breve sobre cuando consultar al veterinario presencialmente.",
      "8. Responde en espanol rioplatense, tono calido y profesional. Maximo 250 palabras salvo que sea complejo.",
      "9. Tu orientacion no reemplaza la consulta veterinaria presencial.",
    ] : null;
    const systemPrompt = systemPromptLines
      ? systemPromptLines.join("\n")
      : "Sos VetIA de PetPass. Veterinario digital. Responde en espanol rioplatense, claro y empatico. Analiza fotos si te las mandan. Siempre indica cuando ir al veterinario.";

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
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ system: systemPrompt, messages: apiMessages }),
      });
      const data = await res.json();

      if (data.limitReached) {
        setShowUpgrade(true);
        setLoading(false);
        clearImage();
        return;
      }

      if (data.used) setUsedCount(data.used);
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Error de conexión. Intentá de nuevo." }]);
    }
    clearImage();
    setLoading(false);
  }

  const remaining = Math.max(0, FREE_LIMIT - usedCount);
  const SUGGESTIONS = mascota
    ? [`Cuándo vacunar a ${mascota.name}?`, "Se rasca mucho", "Cuánto debería pesar?"]
    : ["Cómo sé si mi perro está enfermo?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 160px)" }}>

      {/* Banner info / uso */}
      {isPremium ? (
        <div style={{ background: "#f472b622", border: "1px solid #f472b633", borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12, color: "#f472b6", display: "flex", alignItems: "center", gap: 6 }}>
          ✨ <strong>Premium</strong> · Consultas ilimitadas activas
        </div>
      ) : (
        <div style={{
          background: usedCount >= FREE_LIMIT ? "#f8717122" : "#4ade8022",
          border: `1px solid ${usedCount >= FREE_LIMIT ? "#f8717133" : "#4ade8033"}`,
          borderRadius: 10, padding: "8px 14px", marginBottom: 10, fontSize: 12,
          color: usedCount >= FREE_LIMIT ? "#f87171" : "#4ade80",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>🤖 {usedCount >= FREE_LIMIT ? "Límite mensual alcanzado" : `${remaining} consulta${remaining !== 1 ? "s" : ""} gratis restante${remaining !== 1 ? "s" : ""} este mes`}</span>
          {usedCount >= FREE_LIMIT && (
            <button onClick={() => setShowUpgrade(true)} style={{
              background: "#f87171", color: "#fff", border: "none",
              borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer",
            }}>Ver Premium</button>
          )}
        </div>
      )}

      {/* Botón análisis foto */}
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

      {/* Mensajes */}
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
              {m.image && <img src={m.image} style={{ width: "100%", borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: "cover" }} />}
              {m.role === "assistant" ? renderMsg(m.text) : m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10 }}>
            <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: "16px 16px 16px 4px", padding: "10px 18px", color: "#7a8299", fontSize: 13 }}>
              Analizando{imageData ? " la foto" : ""}...
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

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => fileRef.current?.click()} style={{
          background: "#181c27", border: "1px solid #252a3a", borderRadius: 12,
          padding: "10px 12px", fontSize: 18, cursor: "pointer",
        }}>📷</button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder={usedCount >= FREE_LIMIT && !isPremium ? "Límite alcanzado — activá Premium" : "Preguntá o mandá una foto..."}
          disabled={usedCount >= FREE_LIMIT && !isPremium}
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

      {/* Modal upgrade */}
      {showUpgrade && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000090", zIndex: 300,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{
            background: "#181c27", border: "1px solid #f472b644",
            borderRadius: 20, padding: 28, maxWidth: 360, width: "100%", textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🤖</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Límite del plan gratuito</h3>
            <p style={{ color: "#7a8299", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              Usaste tus <strong style={{ color: "#f0f4ff" }}>{FREE_LIMIT} consultas gratuitas</strong> de este mes.<br />
              Activá Premium para tener consultas ilimitadas con la IA veterinaria.
            </p>

            <div style={{ background: "#0f1117", borderRadius: 14, padding: 16, marginBottom: 20, textAlign: "left" }}>
              <div style={{ fontWeight: 800, color: "#f472b6", marginBottom: 10, textAlign: "center" }}>✨ Premium · $X/mes</div>
              {["Consultas IA ilimitadas", "Análisis de fotos ilimitado", "Historial clínico completo", "Soporte prioritario"].map(f => (
                <div key={f} style={{ fontSize: 13, color: "#f0f4ff", padding: "4px 0", display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#4ade80" }}>✓</span> {f}
                </div>
              ))}
            </div>

            <a
              href="https://wa.me/5491100000000?text=Hola!%20Quiero%20activar%20PetPass%20Premium"
              target="_blank" rel="noreferrer"
              style={{
                display: "block", background: "linear-gradient(135deg, #f472b6, #ec4899)",
                color: "#fff", borderRadius: 12, padding: "13px 20px",
                fontWeight: 900, fontSize: 15, textDecoration: "none", marginBottom: 10,
              }}
            >Activar Premium →</a>

            <button onClick={() => setShowUpgrade(false)} style={{
              background: "transparent", border: "1px solid #252a3a",
              color: "#7a8299", borderRadius: 12, padding: "10px 20px",
              fontSize: 13, cursor: "pointer", width: "100%",
            }}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
