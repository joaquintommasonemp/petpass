"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";

type Topico = "comandos" | "comportamiento" | "salud" | "ejercicio";

const TOPICOS: { id: Topico; label: string; icon: string; color: string }[] = [
  { id: "comandos", label: "Comandos", icon: "🎓", color: "#4ade80" },
  { id: "comportamiento", label: "Comportamiento", icon: "🧠", color: "#60a5fa" },
  { id: "salud", label: "Rutinas de salud", icon: "💊", color: "#f472b6" },
  { id: "ejercicio", label: "Juego y ejercicio", icon: "⚽", color: "#fb923c" },
];

const CONTENIDO: Record<Topico, { titulo: string; pasos: string[] }[]> = {
  comandos: [
    {
      titulo: "Sentado (Sit)",
      pasos: [
        "Mostrá un premio en tu mano cerrada.",
        "Acercá la mano a la nariz y subila lentamente sobre su cabeza.",
        "Cuando se siente, decí 'Sentado' y dá el premio inmediatamente.",
        "Repetí 5-10 veces por sesión, sesiones cortas de 5 minutos.",
      ],
    },
    {
      titulo: "Quieto (Stay)",
      pasos: [
        "Pedile que se siente primero.",
        "Mostrá la palma abierta y decí 'Quieto'.",
        "Retrocedé un paso. Si se queda, volvé y premialo.",
        "Aumentá la distancia y el tiempo gradualmente.",
      ],
    },
    {
      titulo: "Vení (Come)",
      pasos: [
        "Ponete en cuclillas y decí '¡Vení!' con voz alegre.",
        "Cuando se acerque, premialo y festejalo mucho.",
        "Nunca lo llames para algo negativo (baño, reto).",
        "Practicá siempre con correa al principio.",
      ],
    },
    {
      titulo: "No / Dejá",
      pasos: [
        "Cuando agarre algo que no debe, decí 'No' con voz firme y pausa.",
        "Redirigilo inmediatamente a algo permitido.",
        "Premialo cuando suelte o ignore el objeto.",
        "Sé consistente: lo que no puede hacer hoy, tampoco mañana.",
      ],
    },
  ],
  comportamiento: [
    {
      titulo: "Ladrido excesivo",
      pasos: [
        "Identificá el disparador (timbre, personas, aburrimiento).",
        "Enseñale el comando 'Silencio' recompensando el momento en que para.",
        "Ignorar el ladrido por atención — no lo mires ni hables hasta que pare.",
        "Ejercicio diario reduce ladridos por frustración.",
      ],
    },
    {
      titulo: "Ansiedad por separación",
      pasos: [
        "Practicá salidas cortas y vueltas sin drama (sin exagerar el saludo).",
        "Dejá un juguete de enriquecimiento (Kong con comida) al salir.",
        "Construí la independencia con 'lugar' (enseñale a estar en su cama).",
        "En casos severos, consultá con un etólogo veterinario.",
      ],
    },
    {
      titulo: "Jalones en la correa",
      pasos: [
        "Usá un arnes de frente para más control sin lastimar.",
        "Cuando jala, parate — avanzás solo cuando la correa está floja.",
        "Recompensá constantemente cuando camina a tu lado.",
        "Sesiones de 10-15 min, varias veces al día.",
      ],
    },
    {
      titulo: "Morder / Mordisquear",
      pasos: [
        "Cachorros: hacé un sonido agudo y retirá la mano — pausá el juego.",
        "Redirigí siempre a un juguete apropiado.",
        "Nunca uses las manos como juguete.",
        "El enriquecimiento mental reduce la necesidad de morder.",
      ],
    },
  ],
  salud: [
    {
      titulo: "Higiene dental diaria",
      pasos: [
        "Usá cepillo dental específico para mascotas y pasta enzimática.",
        "Empezá tocando los labios y dientes con el dedo.",
        "Introducí el cepillo gradualmente, 30 segundos al día.",
        "Dientes limpios previenen enfermedades cardíacas y renales.",
      ],
    },
    {
      titulo: "Revisión semanal de salud",
      pasos: [
        "Ojos: deben ser claros, sin secreción ni rojeces.",
        "Orejas: rosadas adentro, sin olor ni exceso de cera.",
        "Patas: revisá almohadillas por cortes, inflamación u objetos.",
        "Piel/pelaje: buscá bultos, irritaciones o parásitos.",
      ],
    },
    {
      titulo: "Control de parásitos",
      pasos: [
        "Antiparasitario externo (pulgas/garrapatas) mensual o según indicación.",
        "Antiparasitario interno cada 3 meses en adultos.",
        "Revisá el pelaje después de cada paseo por el pasto.",
        "El control regular protege también a las personas del hogar.",
      ],
    },
    {
      titulo: "Hidratación",
      pasos: [
        "Agua fresca disponible las 24hs, lavá el recipiente diario.",
        "Los perros necesitan aprox. 50ml de agua por kg de peso al día.",
        "En días de calor y ejercicio, aumentá la disponibilidad.",
        "Si toma muy poca agua, consultá al veterinario.",
      ],
    },
  ],
  ejercicio: [
    {
      titulo: "Enriquecimiento mental diario",
      pasos: [
        "Kong relleno con comida congelada — 20 min de actividad.",
        "Esconder comida en la casa para que la busque (nose work).",
        "Juguetes de puzzle interactivos 10-15 min.",
        "Un perro mental y físicamente cansado es un perro feliz.",
      ],
    },
    {
      titulo: "Paseos de calidad",
      pasos: [
        "Al menos 2 paseos diarios de 20-30 min para razas medianas.",
        "Permitile olfatear — es su manera de 'leer el diario'.",
        "Variá rutas para darle estimulación nueva.",
        "Razas de trabajo/pastoreo necesitan el doble de ejercicio.",
      ],
    },
    {
      titulo: "Juego activo en casa",
      pasos: [
        "Fetch, tira y afloja o escondidas — 15 min es suficiente.",
        "Pará siempre tú primero para que quiera más.",
        "Usá juguetes específicos, no objetos de la casa.",
        "El juego fortalece el vínculo y reduce problemas de conducta.",
      ],
    },
    {
      titulo: "Socialización",
      pasos: [
        "Exponelo a diferentes personas, sonidos y ambientes gradualmente.",
        "Siempre experiencias positivas — nunca forcés el contacto.",
        "Otros perros: empezá con conocidos calmos en espacio neutro.",
        "La socialización es más efectiva entre los 3 y 16 semanas de vida.",
      ],
    },
  ],
};

function Card({ children, style = {} }: any) {
  return <div style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 16, padding: 16, marginBottom: 12, ...style }}>{children}</div>;
}

export default function Educacion() {
  const [mascota, setMascota] = useState<any>(null);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [topico, setTopico] = useState<Topico>("comandos");
  const [tips, setTips] = useState<string | null>(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setAuthToken(session.access_token);
      const { data: mascotas } = await supabase.from("mascotas").select("*").eq("user_id", session.user.id).eq("active", true).limit(1);
      if (mascotas?.[0]) {
        setMascota(mascotas[0]);
        const { data: diags } = await supabase.from("historial").select("title, summary").eq("mascota_id", mascotas[0].id)
          .not("title", "in", '("Actualización de peso","Peso inicial","📄 Documento","📅 Cita")').limit(10);
        setDiagnosticos(diags || []);
      }
    }
    load();
  }, []);

  async function generarTipsIA() {
    if (!mascota || !authToken) return;
    setLoadingTips(true);
    setTips(null);
    const condiciones = diagnosticos.map(d => d.title).join(", ") || "sin condiciones registradas";
    const prompt = `Dame 5 tips prácticos y concretos de adiestramiento o rutinas de bienestar para ${mascota.name}, ${mascota.breed || "mascota"} de ${mascota.age || "edad desconocida"}.
Condiciones conocidas del historial: ${condiciones}.
Área de enfoque: ${TOPICOS.find(t => t.id === topico)?.label}.
Formato: lista numerada, cada tip en 1-2 oraciones. Sé específico, accionable y positivo. Evitá consejos genéricos.`;

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({
        system: "Sos un experto en etología, adiestramiento y bienestar animal. Respondé en español rioplatense, con consejos prácticos y basados en evidencia.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    setTips(data.reply || "No se pudo generar los tips.");
    setLoadingTips(false);
  }

  const contenidoTopico = CONTENIDO[topico];
  const topicoInfo = TOPICOS.find(t => t.id === topico)!;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>📚 Educación y adiestramiento</h2>
        <p style={{ color: "#7a8299", fontSize: 13 }}>
          Guías paso a paso y tips personalizados con IA para {mascota?.name || "tu mascota"}.
        </p>
      </div>

      {/* Selector de tópicos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {TOPICOS.map(t => (
          <button key={t.id} onClick={() => { setTopico(t.id); setTips(null); setExpanded(null); }} style={{
            background: topico === t.id ? t.color + "22" : "#181c27",
            border: `1px solid ${topico === t.id ? t.color + "66" : "#252a3a"}`,
            borderRadius: 12, padding: "10px 12px",
            display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            color: topico === t.id ? t.color : "#7a8299",
            fontWeight: topico === t.id ? 800 : 600, fontSize: 13, textAlign: "left",
          }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tips personalizados con IA */}
      <Card style={{ border: `1px solid ${topicoInfo.color}33` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tips ? 12 : 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: topicoInfo.color }}>🤖 Tips personalizados para {mascota?.name || "tu mascota"}</div>
            <div style={{ fontSize: 11, color: "#7a8299", marginTop: 2 }}>Generados por IA según su perfil e historial</div>
          </div>
          <button onClick={generarTipsIA} disabled={loadingTips || !mascota} style={{
            background: topicoInfo.color, color: "#000", border: "none",
            borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
            opacity: loadingTips || !mascota ? 0.6 : 1, flexShrink: 0, marginLeft: 8,
          }}>
            {loadingTips ? "Generando..." : tips ? "Regenerar" : "Generar"}
          </button>
        </div>
        {tips && (
          <div style={{ background: "#0f1117", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#f0f4ff", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {tips}
          </div>
        )}
      </Card>

      {/* Guías paso a paso */}
      <div style={{ fontSize: 11, fontWeight: 800, color: "#7a8299", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        Guías paso a paso · {topicoInfo.label}
      </div>

      {contenidoTopico.map((item, i) => (
        <Card key={i} style={{ padding: 0, overflow: "hidden", border: expanded === i ? `1px solid ${topicoInfo.color}44` : "1px solid #252a3a" }}>
          <button onClick={() => setExpanded(expanded === i ? null : i)} style={{
            width: "100%", background: "transparent", border: "none", cursor: "pointer",
            padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left",
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#f0f4ff" }}>{topicoInfo.icon} {item.titulo}</div>
            <span style={{ color: topicoInfo.color, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{expanded === i ? "−" : "+"}</span>
          </button>
          {expanded === i && (
            <div style={{ padding: "0 16px 16px" }}>
              {item.pasos.map((paso, j) => (
                <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderTop: "1px solid #1a2030" }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%", background: topicoInfo.color + "22",
                    color: topicoInfo.color, fontWeight: 800, fontSize: 11,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                  }}>{j + 1}</div>
                  <div style={{ fontSize: 13, color: "#f0f4ff", lineHeight: 1.5 }}>{paso}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
