"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { SectionHeader, UiCard } from "@/components/ui";

// ─── Detección de tipo de animal por raza ─────────────────────────────────────
const GATO_BREEDS = new Set([
  "Abisinio","American Curl","Angora Turco","Asian","Balinés","Bengala",
  "Birmano","Bobtail Americano","Bobtail Japonés","Bombay","British Shorthair",
  "Burmés","Cornish Rex","Devon Rex","Egipcio Mau","Exótico de pelo corto",
  "Himalayo","Maine Coon","Manx","Noruego del Bosque","Ocicat","Persa",
  "Peterbald","Ragamuffin","Ragdoll","Russian Blue","Savannah","Selkirk Rex",
  "Serengeti","Siberiano","Siamés","Singapura","Snowshoe","Somali",
  "Sphynx","Tonquinés","Toyger","Turkish Van","Turkish Angora","York Chocolate",
]);
const PECES_BREEDS = new Set(["Pez Betta","Pez Dorado / Goldfish","Pez Tropical","Pez Koi","Tortuga acuática"]);
const AVES_BREEDS = new Set(["Loro / Cotorra","Canario","Cacatúa","Agapornis / Inseparable","Periquito","Ninfas / Cockatiel","Guacamayo / Ara","Eclectus","Amazona","Pájaro del sol / Parrot"]);
const REPTIL_BREEDS = new Set(["Tortuga de tierra","Iguana Verde","Dragón Barbudo","Gecko Leopardo","Gecko Diurno","Camaleón","Serpiente Boa","Serpiente Corn Snake","Serpiente Ball Python","Lagarto Monitor","Skink","Rana / Sapo","Axolotl"]);
const PEQUENO_MAMIFERO_BREEDS = new Set(["Conejo","Cobayo / Guinea pig","Chinchilla","Hurón","Hámster","Jerbo","Rata","Ratón","Erizo","Degu","Ardilla"]);
const ARACNIDO_BREEDS = new Set(["Tarántula","Escorpión","Cangrejo ermitaño"]);

type AnimalTipo = "perro" | "gato" | "ave" | "conejo" | "reptil" | "pez" | "aracnido";

function detectarTipo(breed: string): AnimalTipo {
  if (!breed) return "perro";
  if (GATO_BREEDS.has(breed)) return "gato";
  if (PECES_BREEDS.has(breed)) return "pez";
  if (AVES_BREEDS.has(breed)) return "ave";
  if (REPTIL_BREEDS.has(breed)) return "reptil";
  if (PEQUENO_MAMIFERO_BREEDS.has(breed)) return "conejo";
  if (ARACNIDO_BREEDS.has(breed)) return "aracnido";
  return "perro";
}

// ─── Tópicos por tipo de animal ───────────────────────────────────────────────
type TopicoDef = { id: string; label: string; icon: string; color: string };

const TOPICOS_POR_TIPO: Record<AnimalTipo, TopicoDef[]> = {
  perro: [
    { id: "comandos",       label: "Comandos",        icon: "🎓", color: "#2CB8AD" },
    { id: "comportamiento", label: "Comportamiento",  icon: "🧠", color: "#60a5fa" },
    { id: "salud",          label: "Rutinas de salud",icon: "💊", color: "#f472b6" },
    { id: "ejercicio",      label: "Juego y ejercicio",icon: "⚽", color: "#fb923c" },
  ],
  gato: [
    { id: "enriquecimiento", label: "Enriquecimiento", icon: "🎯", color: "#2CB8AD" },
    { id: "comportamiento",  label: "Comportamiento",  icon: "🧠", color: "#60a5fa" },
    { id: "salud",           label: "Salud & Higiene", icon: "💊", color: "#f472b6" },
    { id: "cuidado",         label: "Cuidado diario",  icon: "✨", color: "#fb923c" },
  ],
  ave: [
    { id: "socializacion", label: "Socialización",  icon: "🤝", color: "#2CB8AD" },
    { id: "salud",         label: "Salud & Dieta",  icon: "💊", color: "#f472b6" },
  ],
  conejo: [
    { id: "bienestar", label: "Bienestar",  icon: "🌿", color: "#2CB8AD" },
    { id: "salud",     label: "Salud",      icon: "💊", color: "#f472b6" },
  ],
  reptil: [
    { id: "cuidado", label: "Cuidado básico", icon: "🌡️", color: "#2CB8AD" },
  ],
  pez:      [],
  aracnido: [],
};

// ─── Contenido por tipo + tópico ─────────────────────────────────────────────
type Guia = { titulo: string; pasos: string[] };
const CONTENIDO: Record<string, Guia[]> = {

  // ── Perro ──────────────────────────────────────────────────────────────────
  "perro.comandos": [
    { titulo: "Sentado (Sit)", pasos: [
      "Mostrá un premio en tu mano cerrada.",
      "Acercá la mano a la nariz y subila lentamente sobre su cabeza.",
      "Cuando se siente, decí 'Sentado' y dá el premio inmediatamente.",
      "Repetí 5-10 veces por sesión, sesiones cortas de 5 minutos.",
    ]},
    { titulo: "Quieto (Stay)", pasos: [
      "Pedile que se siente primero.",
      "Mostrá la palma abierta y decí 'Quieto'.",
      "Retrocedé un paso. Si se queda, volvé y premialo.",
      "Aumentá la distancia y el tiempo gradualmente.",
    ]},
    { titulo: "Vení (Come)", pasos: [
      "Ponete en cuclillas y decí '¡Vení!' con voz alegre.",
      "Cuando se acerque, premialo y festejalo mucho.",
      "Nunca lo llames para algo negativo (baño, reto).",
      "Practicá siempre con correa al principio.",
    ]},
    { titulo: "No / Dejá", pasos: [
      "Cuando agarre algo que no debe, decí 'No' con voz firme y pausa.",
      "Redirigilo inmediatamente a algo permitido.",
      "Premialo cuando suelte o ignore el objeto.",
      "Sé consistente: lo que no puede hacer hoy, tampoco mañana.",
    ]},
  ],

  "perro.comportamiento": [
    { titulo: "Ladrido excesivo", pasos: [
      "Identificá el disparador (timbre, personas, aburrimiento).",
      "Enseñale el comando 'Silencio' recompensando cuando para.",
      "Ignorar el ladrido por atención — no lo mires ni hables hasta que pare.",
      "El ejercicio diario reduce ladridos por frustración.",
    ]},
    { titulo: "Ansiedad por separación", pasos: [
      "Practicá salidas cortas y vueltas sin drama.",
      "Dejá un juguete de enriquecimiento (Kong con comida) al salir.",
      "Construí la independencia con 'lugar' (enseñale a estar en su cama).",
      "En casos severos, consultá con un etólogo veterinario.",
    ]},
    { titulo: "Jalones en la correa", pasos: [
      "Usá un arnés de frente para más control sin lastimar.",
      "Cuando jala, parate — avanzás solo cuando la correa está floja.",
      "Recompensá constantemente cuando camina a tu lado.",
      "Sesiones de 10-15 min, varias veces al día.",
    ]},
    { titulo: "Morder / Mordisquear", pasos: [
      "Cachorros: hacé un sonido agudo y retirá la mano — pausá el juego.",
      "Redirigí siempre a un juguete apropiado.",
      "Nunca uses las manos como juguete.",
      "El enriquecimiento mental reduce la necesidad de morder.",
    ]},
  ],

  "perro.salud": [
    { titulo: "Higiene dental diaria", pasos: [
      "Usá cepillo dental específico para mascotas y pasta enzimática.",
      "Empezá tocando los labios y dientes con el dedo.",
      "Introducí el cepillo gradualmente, 30 segundos al día.",
      "Dientes limpios previenen enfermedades cardíacas y renales.",
    ]},
    { titulo: "Revisión semanal de salud", pasos: [
      "Ojos: deben ser claros, sin secreción ni rojeces.",
      "Orejas: rosadas adentro, sin olor ni exceso de cera.",
      "Patas: revisá almohadillas por cortes, inflamación u objetos.",
      "Piel/pelaje: buscá bultos, irritaciones o parásitos.",
    ]},
    { titulo: "Control de parásitos", pasos: [
      "Antiparasitario externo (pulgas/garrapatas) mensual o según indicación.",
      "Antiparasitario interno cada 3 meses en adultos.",
      "Revisá el pelaje después de cada paseo por el pasto.",
      "El control regular protege también a las personas del hogar.",
    ]},
    { titulo: "Hidratación", pasos: [
      "Agua fresca disponible las 24hs, lavá el recipiente diario.",
      "Los perros necesitan aprox. 50ml de agua por kg de peso al día.",
      "En días de calor y ejercicio, aumentá la disponibilidad.",
      "Si toma muy poca agua, consultá al veterinario.",
    ]},
  ],

  "perro.ejercicio": [
    { titulo: "Enriquecimiento mental diario", pasos: [
      "Kong relleno con comida congelada — 20 min de actividad.",
      "Esconder comida en la casa para que la busque (nose work).",
      "Juguetes de puzzle interactivos 10-15 min.",
      "Un perro mental y físicamente cansado es un perro feliz.",
    ]},
    { titulo: "Paseos de calidad", pasos: [
      "Al menos 2 paseos diarios de 20-30 min para razas medianas.",
      "Permitile olfatear — es su manera de 'leer el diario'.",
      "Variá rutas para darle estimulación nueva.",
      "Razas de trabajo/pastoreo necesitan el doble de ejercicio.",
    ]},
    { titulo: "Juego activo en casa", pasos: [
      "Fetch, tira y afloja o escondidas — 15 min es suficiente.",
      "Pará siempre tú primero para que quiera más.",
      "Usá juguetes específicos, no objetos de la casa.",
      "El juego fortalece el vínculo y reduce problemas de conducta.",
    ]},
    { titulo: "Socialización", pasos: [
      "Exponelo a diferentes personas, sonidos y ambientes gradualmente.",
      "Siempre experiencias positivas — nunca forcés el contacto.",
      "Otros perros: empezá con conocidos calmos en espacio neutro.",
      "La socialización es más efectiva entre los 3 y 16 semanas de vida.",
    ]},
  ],

  // ── Gato ──────────────────────────────────────────────────────────────────
  "gato.enriquecimiento": [
    { titulo: "Rascadores y zonas de trepa", pasos: [
      "Instalá al menos 1 rascador vertical y 1 horizontal, cerca de sus lugares favoritos.",
      "Los árboles para gatos satisfacen la necesidad de escalar y marcar territorio.",
      "Si araña los muebles, el rascador está mal ubicado — movelo a ese lugar.",
      "Reforzá el uso del rascador con hierba gatera o spray atrayente.",
    ]},
    { titulo: "Juego de caza diario", pasos: [
      "2 sesiones de 5-10 min con varitas, plumas o ratones de juguete.",
      "Simulá el movimiento de una presa real: paradas, arranques, escondidas.",
      "Terminá siempre con un premio para simular 'capturar la presa' — evita la frustración.",
      "Variá los juguetes para mantener el interés.",
    ]},
    { titulo: "Enriquecimiento olfativo y cognitivo", pasos: [
      "Escondé premios en cajas, bolsas de papel o juguetes de puzzle.",
      "Rotá los juguetes cada pocos días para que siempre sean 'nuevos'.",
      "La hierba gatera, valeriana y olores nuevos son estímulos naturales.",
      "Un gato aburrido desarrolla conductas problemáticas como lamido excesivo o agresividad.",
    ]},
    { titulo: "Ventana y mundo exterior", pasos: [
      "Asegurate de que tenga acceso a una ventana con soporte o repisa.",
      "Un comedero para aves afuera es la 'TV del gato'.",
      "Si es indoor, una ventana con malla y acceso a aire fresco mejora el bienestar notablemente.",
      "Las plantas como hierba gatera y valeria son seguras; verificá antes de poner otras.",
    ]},
  ],

  "gato.comportamiento": [
    { titulo: "Arañazos en muebles", pasos: [
      "Poné un rascador atractivo exactamente donde araña los muebles.",
      "Cubrí temporalmente la superficie arañada con doble faz o papel aluminio.",
      "Nunca castigues — el castigo aumenta el estrés y puede empeorar la conducta.",
      "Recompensá cada vez que use el rascador.",
    ]},
    { titulo: "Agresividad entre gatos", pasos: [
      "Introducción gradual: primero intercambio de olores con toallas durante varios días.",
      "Luego vista breve separada por una puerta entreabierta; nunca cara a cara directo al inicio.",
      "Recursos duplicados: comederos, bebederos, areneros y zonas de descanso separados.",
      "El proceso puede llevar semanas; forzarlo empeora la situación.",
    ]},
    { titulo: "Maullidos nocturnos", pasos: [
      "Ofrecé la cena justo antes de dormir — simula cazar, comer y descansar.",
      "Sesión de juego activo 1 hora antes de acostarte.",
      "Gatos no castrados pueden maullar por celo; la castración es la solución definitiva.",
      "Si el patrón es nuevo en un gato mayor, puede indicar dolor o hipotiroidismo — consultá al vet.",
    ]},
    { titulo: "Uso incorrecto del arenero", pasos: [
      "La caja debe estar limpia: scoop diario, cambio de arena semanal.",
      "1 arenero por gato + 1 extra es la regla de oro.",
      "Probá distintos tipos de arena (fina, gruesa, sin perfume) — los gatos son muy selectivos.",
      "Si elimina fuera, primero descartá una infección urinaria con el veterinario.",
    ]},
  ],

  "gato.salud": [
    { titulo: "Cepillado según el pelaje", pasos: [
      "Pelo largo: cepillar diariamente para evitar nudos y bolas de pelo.",
      "Pelo corto: 1 vez por semana con guante o cepillo de goma.",
      "Empezá de cachorro para que lo acepte bien; hacelo con calma y refuerzo positivo.",
      "El cepillado regular reduce el vómito de bolas de pelo.",
    ]},
    { titulo: "Higiene dental", pasos: [
      "Usá pasta dental enzimática específica para gatos (nunca la de humanos).",
      "Introducí el cepillo gradualmente: dedo → cepillo de dedo → cepillo.",
      "2-3 veces por semana es suficiente; diario es ideal.",
      "Dental snacks y juguetes de goma son complemento, no reemplazo.",
    ]},
    { titulo: "Control de parásitos", pasos: [
      "Antipulgas mensual incluso en gatos indoor — las pulgas entran en ropa y calzado.",
      "Desparasitación interna cada 3-4 meses.",
      "Revisá las orejas mensualmente por ácaros (puntos negros, rascado intenso).",
      "Los gatos que salen necesitan también prevención de garrapatas.",
    ]},
    { titulo: "Hidratación y dieta", pasos: [
      "Los gatos tienen bajo instinto de beber — las fuentes de agua en movimiento ayudan.",
      "El alimento húmedo (lata/pouch) complementa la hidratación diaria.",
      "El 60% de los gatos domésticos tienen sobrepeso; medí las raciones.",
      "Evitá alimento ad libitum si tu gato come en exceso; establecé horarios.",
    ]},
  ],

  "gato.cuidado": [
    { titulo: "Caja de arena: la regla de oro", pasos: [
      "1 arenero por gato + 1 extra: 1 gato = 2 cajas, 2 gatos = 3 cajas.",
      "Limpieza con scoop al menos 1 vez al día; cambiá la arena completa una vez por semana.",
      "Tamaño: lo suficientemente grande para que se dé vuelta cómodamente.",
      "Ubicación tranquila, lejos del comedero y de zonas de mucho tráfico.",
    ]},
    { titulo: "Corte de uñas", pasos: [
      "Cada 2-3 semanas; en gatos indoor con mayor frecuencia.",
      "Acostumbralo tocándole las patas desde cachorro.",
      "Usá cortauñas específicos para gatos; cortá solo la punta blanca, nunca la parte rosada.",
      "Si no tolera, pedile ayuda a un veterinario o peluquero felino.",
    ]},
    { titulo: "Revisión mensual de salud en casa", pasos: [
      "Ojos: claros, sin lagañas oscuras ni rojeces.",
      "Orejas: rosadas, sin olor intenso ni puntos negros.",
      "Dientes: encías rosadas; cualquier mal olor persistente merece consulta.",
      "Peso: costillas perceptibles al tacto sin ser visibles — indicador de peso saludable.",
    ]},
    { titulo: "Castración y salud preventiva", pasos: [
      "La castración reduce enfermedades hormonales, peleas y marcado urinario.",
      "Vacunas anuales: Panleucopenia, Calicivirus, Rinotraqueítis (triple felina) + Rabia.",
      "Chequeo veterinario anual hasta los 7 años; cada 6 meses en gatos mayores.",
      "Microchip si aún no lo tiene — obligatorio en muchos municipios.",
    ]},
  ],

  // ── Ave ───────────────────────────────────────────────────────────────────
  "ave.socializacion": [
    { titulo: "Acostumbramiento a la mano", pasos: [
      "Empezá dejando alimento en la palma abierta, sin movimientos bruscos.",
      "Avanzá muy despacio: mano cerca → comida en mano → que suba voluntariamente.",
      "Nunca agarres el ave de golpe; la confianza se construye en semanas.",
      "Sesiones cortas (5 min) varias veces al día son más efectivas que una larga.",
    ]},
    { titulo: "Tiempo fuera de la jaula", pasos: [
      "Mínimo 2-3 horas diarias en un ambiente seguro (sin ventanas abiertas, ventiladores ni tóxicos).",
      "Un ave siempre enjaulada pierde estimulación y puede desarrollar conductas repetitivas.",
      "Poné perchas en distintas alturas para explorar.",
      "El tiempo contigo es irreemplazable: hablale, cantá, hacé actividades cerca.",
    ]},
    { titulo: "Habituación a nuevos objetos y entornos", pasos: [
      "Dejá el objeto nuevo cerca de la jaula durante 1-2 días antes de introducirlo.",
      "Las aves son curiosas pero también desconfiadas — la exposición gradual evita el miedo.",
      "Sonidos nuevos (TV, música) ayudan a ampliar su mundo auditivo.",
      "Llevarlo a distintos ambientes de la casa reduce la ansiedad ante cambios.",
    ]},
    { titulo: "Estimulación y vínculo", pasos: [
      "Hablale con voz suave y constante; imitá los sonidos que hace.",
      "Las aves aprenden por repetición y asociación positiva: palabra + premio + repetición.",
      "Los loros y cacatúas necesitan interacción social intensa — son animales de bandada.",
      "La soledad prolongada causa plumaje dañado (pulling de plumas) y gritos excesivos.",
    ]},
  ],

  "ave.salud": [
    { titulo: "Dieta variada y equilibrada", pasos: [
      "Las semillas solas no son dieta completa — son como comer solo papas fritas.",
      "Sumá verduras frescas (zanahoria, acelga, brócoli), frutas (manzana sin semillas, mango).",
      "Los pellets ornitológicos son la base más balanceada; introducelos gradualmente.",
      "Alimentos tóxicos: aguacate, chocolate, cebolla, ajo, cafeína, alcohol.",
    ]},
    { titulo: "Higiene de la jaula", pasos: [
      "Limpiar bebedero y comedero diariamente — el agua sucia es foco de bacterias.",
      "Piso de jaula: cambiar el papel/sustrato cada 2-3 días.",
      "Desinfección completa de la jaula una vez por mes con productos seguros.",
      "Las perchas de madera natural se pueden lavar y secar al sol.",
    ]},
    { titulo: "Baño y cuidado de plumas", pasos: [
      "Rociá con agua tibia 2-3 veces por semana; muchas aves disfrutan bañarse en un plato.",
      "Nunca uses secador de pelo — es estresante y puede quemarlos.",
      "El baño regular favorece la salud de las plumas y reduce la caspa (dander).",
      "Un ave con plumas opacas, erizadas o que se las arranca necesita atención veterinaria.",
    ]},
    { titulo: "Señales de alarma", pasos: [
      "Ave quieta, plumas erizadas, ojos semicerrados o sin comer: consultá al vet de inmediato.",
      "Las aves ocultan muy bien la enfermedad — para cuando se nota, suele ser urgente.",
      "Estornudos frecuentes, secreción nasal o cambio en las heces son señales tempranas.",
      "Buscá un veterinario con experiencia en aves exóticas; no todos manejan estas especies.",
    ]},
  ],

  // ── Pequeños mamíferos (conejo, cobayo, etc.) ─────────────────────────────
  "conejo.bienestar": [
    { titulo: "Espacio y movimiento", pasos: [
      "Los conejos y cobayas necesitan espacio real: mínimo 4m² de área de ejercicio fuera de la jaula.",
      "Viven mucho más saludables con tiempo libre diario para correr y explorar.",
      "El encierro permanente en una jaula chica acorta su vida y genera problemas de salud.",
      "Instalá un corral seguro en casa o dejalo suelto en una habitación controlada.",
    ]},
    { titulo: "Enriquecimiento y exploración", pasos: [
      "Cajas de cartón con agujeros, tubos de papel higiénico y juguetes seguros para roer.",
      "El instinto de roer debe tener salida — ofrecé palos de manzano, sauce o madera sin tratar.",
      "Escondé comida en cajas o escarbadores para estimular el instinto de búsqueda.",
      "Cambiar el mobiliario del recinto regularmente mantiene el interés y la curiosidad.",
    ]},
    { titulo: "Socialización y contacto", pasos: [
      "Son animales sociales; si son cobayas, lo ideal es mínimo 2 del mismo sexo.",
      "Los conejos también disfrutan de la compañía, aunque son más independientes.",
      "El contacto humano diario desde pequeños los hace más amigables y menos asustadizos.",
      "Nunca los agarres de las orejas; usá las dos manos para sostener el cuerpo.",
    ]},
    { titulo: "Ambiente y temperatura", pasos: [
      "Son sensibles al calor extremo (no más de 25°C) y a las corrientes de aire.",
      "No los pongas en terrarios de vidrio cerrados — el calor se acumula rápido.",
      "Evitá perfumes, spray de ambientador y humo de cigarrillo cerca de ellos.",
      "En verano, una botella de agua fría envuelta en una tela es su mejor aliada.",
    ]},
  ],

  "conejo.salud": [
    { titulo: "Dientes y digestión: el heno", pasos: [
      "El heno de buena calidad (timothy, orchard) debe estar disponible siempre — es el 80% de la dieta.",
      "Los dientes de conejos y cobayas crecen continuamente; el heno los desgasta naturalmente.",
      "Sin suficiente heno, los dientes crecen mal y la digestión falla — es la causa más común de enfermedad.",
      "El pellet es suplemento, no base; las verduras frescas (sin lechuga iceberg) complementan.",
    ]},
    { titulo: "Veterinario especialista", pasos: [
      "Buscá un veterinario con experiencia en animales exóticos o pequeños mamíferos.",
      "Conejos: vacunas de Mixomatosis y VHD (Enfermedad Hemorrágica Viral) son esenciales.",
      "Castración recomendada: reduce riesgo de tumores uterinos (hasta 80% en hembras no castradas).",
      "Revisión anual de dientes — los problemas dentales son sigilosos y peligrosos.",
    ]},
    { titulo: "Parásitos y pelaje", pasos: [
      "Revisá el pelaje regularmente: ácaros de piel (escamas, caída de pelo), piojos, hongos.",
      "Los tratamientos antiparasitarios deben ser específicos para cada especie — nunca uses productos de perros o gatos.",
      "El moquillo o secreción nasal en conejos puede ser Pasteurella — consultá al vet.",
      "Cobayas y conejos pueden contagiarse entre sí algunas enfermedades; mantené cuarentena si incorporás uno nuevo.",
    ]},
    { titulo: "Señales de emergencia", pasos: [
      "Conejos y cobayas ocultan el dolor hasta que es muy intenso — sé observador.",
      "Anorexia o ausencia de heces por más de 12 horas es una emergencia: puede ser íleo gastrointestinal.",
      "Letargo repentino, respiración dificultosa o convulsiones: veterinario de inmediato.",
      "La prevención vale más que la cura: revisiones regulares salvan vidas en estas especies.",
    ]},
  ],

  // ── Reptil ────────────────────────────────────────────────────────────────
  "reptil.cuidado": [
    { titulo: "Temperatura y gradiente térmico", pasos: [
      "Los reptiles son ectotermos: dependen del ambiente para regular su temperatura corporal.",
      "El terrario debe tener una zona caliente y una fría para que puedan termorregularse.",
      "Controlá con termómetro digital: zona cálida 30-38°C (varía por especie), fría 22-26°C.",
      "Apagar la fuente de calor de noche puede ser necesario según la especie.",
    ]},
    { titulo: "Iluminación UVB", pasos: [
      "La mayoría de reptiles diurnos necesitan UVB para metabolizar vitamina D3 y absorber calcio.",
      "Cambiá la lámpara UVB cada 6-12 meses aunque parezca encendida — pierde efectividad.",
      "El ciclo de luz debe imitar el natural: 10-14hs de luz diurna según la especie y la estación.",
      "El vidrio y el plástico filtran el UVB — la lámpara debe estar sin barreras sobre el terrario.",
    ]},
    { titulo: "Alimentación específica por especie", pasos: [
      "Investigá la dieta exacta de tu especie — tortugas, iguanas y dragones barbudos son muy distintos.",
      "Los reptiles insectívoros necesitan insectos 'gut-loaded' (alimentados antes de dárselos).",
      "Los carnívoros (serpientes) suelen alimentarse con ratones pre-muertos congelados y descongelados.",
      "La frecuencia varía: los juveniles comen más seguido; los adultos pueden ayunar días o semanas.",
    ]},
    { titulo: "Suplementación y veterinario exótico", pasos: [
      "Calcio en polvo sobre los alimentos 2-3 veces por semana; vitaminas 1 vez por semana.",
      "La deficiencia de calcio (Metabolic Bone Disease) es la enfermedad más común en reptiles.",
      "Buscá un veterinario especializado en reptiles — muy pocos manejan estas especies correctamente.",
      "Cuarentena obligatoria de 90 días si incorporás un nuevo reptil al hogar.",
    ]},
  ],
};

// ─── Tipos sin training ───────────────────────────────────────────────────────
const SIN_TRAINING: Partial<Record<AnimalTipo, { emoji: string; titulo: string; texto: string; consejo: string }>> = {
  pez: {
    emoji: "🐟",
    titulo: "El adiestramiento no aplica para peces",
    texto: "Los peces no requieren entrenamiento, pero su bienestar depende 100% del ambiente. Un acuario bien mantenido es la mejor forma de cuidado.",
    consejo: "Consejo: Medí el pH, la temperatura y el amoniaco semanalmente. Cambiá el 20-30% del agua cada 7-10 días. Un acuario saludable = peces saludables.",
  },
  aracnido: {
    emoji: "🕷️",
    titulo: "Cuidado especializado para invertebrados",
    texto: "Las tarántulas y escorpiones no son animales de interacción frecuente, pero requieren condiciones muy específicas de temperatura, humedad y alimentación.",
    consejo: "Consejo: Ofrecé un escondite adecuado, alimentación viva apropiada (grillos, tenebrios) y revisá la muda con atención — es el momento más vulnerable.",
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────
function Card({ children, style = {}, className = "" }: any) {
  return <UiCard className={`training-card${className ? ` ${className}` : ""}`} style={style}>{children}</UiCard>;
}

export default function Educacion() {
  const [mascota, setMascota] = useState<any>(null);
  const [animalTipo, setAnimalTipo] = useState<AnimalTipo>("perro");
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [topico, setTopico] = useState<string>("comandos");
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
        const tipo = detectarTipo(mascotas[0].breed || "");
        setAnimalTipo(tipo);
        const primero = TOPICOS_POR_TIPO[tipo]?.[0]?.id ?? "comandos";
        setTopico(primero);
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
    try {
      const condiciones = diagnosticos.map(d => d.title).join(", ") || "sin condiciones registradas";
      const topicoActual = TOPICOS_POR_TIPO[animalTipo]?.find(t => t.id === topico);
      const prompt = `Dame 5 tips prácticos y concretos de ${topicoActual?.label || "bienestar"} para ${mascota.name}, ${mascota.breed || "mascota"} de ${mascota.age || "edad desconocida"}.
Condiciones conocidas del historial: ${condiciones}.
Formato: lista numerada, cada tip en 1-2 oraciones. Sé específico, accionable y adaptado a la especie. Evitá consejos genéricos.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
        body: JSON.stringify({
          system: "Sos un experto en etología, adiestramiento y bienestar animal. Respondé en español rioplatense, con consejos prácticos y basados en evidencia.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTips(data.reply || "No se pudo generar los tips.");
    } catch {
      setTips("No se pudo conectar con el servicio de IA. Intentá de nuevo.");
    } finally {
      setLoadingTips(false);
    }
  }

  const topicos = TOPICOS_POR_TIPO[animalTipo] ?? [];
  const topicoInfo = topicos.find(t => t.id === topico) ?? topicos[0];
  const contenidoTopico: Guia[] = CONTENIDO[`${animalTipo}.${topico}`] ?? [];
  const sinTraining = SIN_TRAINING[animalTipo];

  return (
    <div className="training-page">
      <div className="training-hero" style={{ marginBottom: 20 }}>
        <SectionHeader
          title="🎓 Training & Bienestar"
          description={<>Guías específicas para {mascota?.name || "tu mascota"}{mascota?.breed ? ` (${mascota.breed})` : ""}.</>}
          style={{ marginBottom: 0 }}
        />
      </div>

      {/* Caso especial: pez / arácnido */}
      {sinTraining ? (
        <Card style={{ textAlign: "center", padding: "32px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>{sinTraining.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1C3557", marginBottom: 8 }}>{sinTraining.titulo}</div>
          <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{sinTraining.texto}</p>
          <div style={{ background: "#E5F7F6", border: "1px solid #B2E8E5", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#1C3557", lineHeight: 1.6, textAlign: "left" }}>
            {sinTraining.consejo}
          </div>
        </Card>
      ) : (
        <>
          {/* Selector de tópicos */}
          <div className="training-topic-grid" style={{ display: "grid", gridTemplateColumns: topicos.length === 1 ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {topicos.map(t => (
              <button className="training-topic-button" key={t.id} onClick={() => { setTopico(t.id); setTips(null); setExpanded(null); }} style={{
                background: topico === t.id ? t.color + "22" : "#FFFFFF",
                border: `1px solid ${topico === t.id ? t.color + "66" : "#E2E8F0"}`,
                borderRadius: 12, padding: "10px 12px",
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                color: topico === t.id ? t.color : "#64748B",
                fontWeight: topico === t.id ? 800 : 600, fontSize: 13, textAlign: "left",
              }}>
                <span style={{ fontSize: 20 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tips personalizados con IA */}
          {topicoInfo && (
            <Card className="training-ai-card" style={{ border: `1px solid ${topicoInfo.color}33` }}>
              <div className="training-ai-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: tips ? 12 : 0 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: topicoInfo.color }}>🤖 Tips personalizados para {mascota?.name || "tu mascota"}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Generados por IA según su perfil e historial</div>
                </div>
                <button className="training-ai-button" onClick={generarTipsIA} disabled={loadingTips || !mascota} style={{
                  background: topicoInfo.color, color: "#fff", border: "none",
                  borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
                  opacity: loadingTips || !mascota ? 0.6 : 1, flexShrink: 0, marginLeft: 8,
                }}>
                  {loadingTips ? "Generando..." : tips ? "Regenerar" : "Generar"}
                </button>
              </div>
              {tips && (
                <div className="training-ai-result" style={{ background: "#F4F6FB", borderRadius: 12, padding: "12px 14px", fontSize: 13, color: "#1C3557", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {tips}
                </div>
              )}
            </Card>
          )}

          {/* Guías paso a paso */}
          {topicoInfo && (
            <div className="training-section-label" style={{ fontSize: 11, fontWeight: 800, color: "#64748B", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              Guías paso a paso · {topicoInfo.label}
            </div>
          )}

          {contenidoTopico.map((item, i) => (
            <Card className="training-guide-card" key={i} style={{ padding: 0, overflow: "hidden", border: expanded === i ? `1px solid ${topicoInfo?.color}44` : "1px solid #E2E8F0" }}>
              <button className="training-guide-trigger" onClick={() => setExpanded(expanded === i ? null : i)} style={{
                width: "100%", background: "transparent", border: "none", cursor: "pointer",
                padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1C3557" }}>{topicoInfo?.icon} {item.titulo}</div>
                <span style={{ color: topicoInfo?.color, fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{expanded === i ? "−" : "+"}</span>
              </button>
              {expanded === i && (
                <div className="training-steps" style={{ padding: "0 16px 16px" }}>
                  {item.pasos.map((paso, j) => (
                    <div className="training-step-row" key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderTop: "1px solid #E2E8F0" }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", background: (topicoInfo?.color ?? "#2CB8AD") + "22",
                        color: topicoInfo?.color ?? "#2CB8AD", fontWeight: 800, fontSize: 11,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1,
                      }}>{j + 1}</div>
                      <div style={{ fontSize: 13, color: "#1C3557", lineHeight: 1.5 }}>{paso}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
