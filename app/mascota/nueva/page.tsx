"use client";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const RAZAS: Record<string, string[]> = {
  Perro: [
    "Mestizo",
    // Populares en Argentina
    "Labrador", "Golden Retriever", "Caniche/Poodle", "Beagle", "Bulldog Francés",
    "Chihuahua", "Dachshund/Teckel", "Schnauzer", "Shih Tzu", "Yorkshire Terrier",
    "Maltés", "Pomerania", "Cocker Spaniel", "Bichón Frisé",
    // Medianos/grandes
    "Pastor Alemán", "Border Collie", "Husky Siberiano", "Akita Inu", "Alaskan Malamute",
    "American Staffordshire", "Boxer", "Bull Terrier", "Bulldog Inglés",
    "Cavalier King Charles", "Chow Chow", "Dálmata", "Doberman",
    "Fox Terrier", "Gran Danés", "Jack Russell Terrier", "Labradoodle",
    "Lhasa Apso", "Malinois / Pastor Belga", "Mastín", "Perro de Agua",
    "Pitbull", "Pinscher Miniatura", "Rottweiler", "Samoyedo", "Shar Pei",
    "Shiba Inu", "Spitz Alemán", "Weimaraner", "West Highland Terrier",
    "Boyero de Berna", "Setter Irlandés", "Vizsla", "Basenji",
    "Otro",
  ],
  Gato: [
    "Mestizo",
    "Abisinio", "Angora", "Bengalí", "British Shorthair", "Burmés",
    "Devon Rex", "Himalayo", "Maine Coon", "Munchkin",
    "Noruego de los Bosques", "Persa", "Ragamuffin", "Ragdoll",
    "Ruso Azul", "Scottish Fold", "Siamés", "Sphynx",
    "Tonquinés", "Turkish Van",
    "Otro",
  ],
  Otro: [
    // Pequeños mamíferos
    "Conejo", "Cobayo / Guinea pig", "Chinchilla", "Hurón", "Hámster", "Jerbo", "Rata", "Ratón", "Erizo",
    // Aves
    "Loro / Cotorra", "Canario", "Cacatúa", "Agapornis", "Periquito", "Ninfas",
    // Reptiles y anfibios
    "Tortuga", "Iguana", "Dragón Barbudo", "Gecko Leopardo", "Camaleón", "Serpiente", "Rana / Sapo",
    // Acuáticos
    "Pez", "Tortuga acuática",
    // Otros
    "Otro exótico",
  ],
};

const MUNICIPIOS_POR_PROVINCIA: Record<string, string[]> = {
  "CABA": [
    "Agronomía","Almagro","Balvanera","Barracas","Belgrano","Boedo","Caballito",
    "Chacarita","Coghlan","Colegiales","Constitución","Flores","Floresta","La Boca",
    "La Paternal","Liniers","Mataderos","Monte Castro","Montserrat","Nueva Pompeya",
    "Núñez","Palermo","Parque Avellaneda","Parque Chacabuco","Parque Chas",
    "Parque Patricios","Puerto Madero","Recoleta","Retiro","Saavedra","San Cristóbal",
    "San Nicolás","San Telmo","Versalles","Villa Crespo","Villa del Parque",
    "Villa Devoto","Villa General Mitre","Villa Lugano","Villa Luro","Villa Ortúzar",
    "Villa Pueyrredón","Villa Real","Villa Riachuelo","Villa Santa Rita","Villa Soldati",
    "Villa Urquiza","Villa Vélez Sarsfield",
  ],
  "Buenos Aires": [
    "La Plata","Mar del Plata","Bahía Blanca","Quilmes","Lanús","Lomas de Zamora",
    "La Matanza","Merlo","Morón","Tigre","San Isidro","Vicente López","San Fernando",
    "Tres de Febrero","Avellaneda","General San Martín","Almirante Brown","Florencio Varela",
    "Berazategui","Esteban Echeverría","Ezeiza","Presidente Perón","San Vicente",
    "Pilar","Escobar","Malvinas Argentinas","José C. Paz","San Miguel","Hurlingham",
    "Ituzaingó","Moreno","Marcos Paz","Cañuelas","Luján","General Rodríguez",
    "Campana","Zárate","San Nicolás de los Arroyos","Pergamino","Junín",
    "Tandil","Necochea","Olavarría","Azul","Bragado","Chivilcoy","Mercedes",
    "San Pedro","Ramallo","Villa Gesell","Pinamar","Mar de Ajó","Miramar",
    "Balcarce","Tres Arroyos","Coronel Suárez","Benito Juárez","Bolívar",
    "Saladillo","Chascomús","Dolores","Berisso","Ensenada","Brandsen",
    "General Pueyrredón","General Alvear","Lobos","Monte","Maipú",
  ],
  "Catamarca": [
    "San Fernando del Valle de Catamarca","Andalgalá","Tinogasta","Santa María",
    "Belén","Fiambalá","Recreo","Chumbicha","Huillapima","Pomán","Antofagasta de la Sierra",
  ],
  "Chaco": [
    "Resistencia","Barranqueras","Fontana","Villa Ángela","Presidencia Roque Sáenz Peña",
    "Charata","General San Martín","Quitilipi","Las Breñas","Juan José Castelli",
    "Tres Isletas","Corzuela","Machagai","Avia Terai","Pampa del Indio","El Sauzalito",
  ],
  "Chubut": [
    "Rawson","Comodoro Rivadavia","Esquel","Trelew","Puerto Madryn","Rada Tilly",
    "Sarmiento","Río Mayo","Lago Puelo","El Bolsón","Gaiman","Dolavon","28 de Julio",
  ],
  "Córdoba": [
    "Córdoba capital","Villa María","San Francisco","Río Cuarto","Río Tercero","Alta Gracia",
    "Villa Carlos Paz","La Falda","Cosquín","Bell Ville","Marcos Juárez","Jesús María",
    "Unquillo","Mendiolaza","Malagueño","Pilar","Oncativo","General Cabrera",
    "Laboulaye","Leones","Oliva","La Carlota","General Deheza","Villa Allende",
    "Saldán","Dean Funes","Cruz del Eje","Mina Clavero","Villa General Belgrano",
    "Santa Rosa de Calamuchita","Embalse","Villa Cura Brochero","Huerta Grande",
  ],
  "Corrientes": [
    "Corrientes capital","Goya","Curuzú Cuatiá","Mercedes","Paso de los Libres",
    "Santo Tomé","Bella Vista","Esquina","Monte Caseros","Ituzaingó","San Luis del Palmar",
    "Mburucuyá","Saladas","General Alvear","Sauce","Yapeyú",
  ],
  "Entre Ríos": [
    "Paraná","Concordia","Gualeguaychú","Concepción del Uruguay","Villaguay","La Paz",
    "Colón","Federación","Victoria","Chajarí","San José","Basavilbaso",
    "Crespo","Diamante","Federal","Nogoyá","Rosario del Tala",
  ],
  "Formosa": [
    "Formosa capital","Clorinda","Pirané","El Colorado","Las Lomitas","Ibarreta",
    "Ingeniero Juárez","Gran Guardia","Laguna Blanca","Comandante Fontana",
  ],
  "Jujuy": [
    "San Salvador de Jujuy","San Pedro de Jujuy","Palpalá","Libertador General San Martín",
    "Humahuaca","Tilcara","Purmamarca","La Quiaca","Abra Pampa","Perico",
    "Monterrico","El Carmen","Fraile Pintado","Yala",
  ],
  "La Pampa": [
    "Santa Rosa","General Pico","Toay","Macachín","Eduardo Castex","Realicó",
    "General Acha","Victorica","Jacinto Aráuz","Guatraché","Doblas","Rancul","Trenel",
  ],
  "La Rioja": [
    "La Rioja capital","Chilecito","Aimogasta","Chamical","Chepes","Villa Unión",
    "Vinchina","Nonogasta","Villa Sanagasta","Patquía","Famatina",
  ],
  "Mendoza": [
    "Mendoza capital","San Rafael","Godoy Cruz","Guaymallén","Las Heras","Luján de Cuyo",
    "Maipú","Rivadavia","Junín","General Alvear","Malargüe","San Martín",
    "Tupungato","Tunuyán","San Carlos","Lavalle","Palmira","Bowen","Potrerillos",
  ],
  "Misiones": [
    "Posadas","Oberá","Eldorado","Apóstoles","Jardín América","Leandro N. Alem",
    "Puerto Iguazú","Aristóbulo del Valle","Montecarlo","Campo Grande","Capioví",
    "San Pedro","Bernardo de Irigoyen","Wanda","Puerto Rico",
  ],
  "Neuquén": [
    "Neuquén capital","Zapala","San Martín de los Andes","Cutral Có","Plaza Huincul",
    "Junín de los Andes","Centenario","Plottier","Rincón de los Sauces",
    "Chos Malal","Piedra del Águila","Aluminé","Loncopué","Villa La Angostura",
  ],
  "Río Negro": [
    "Viedma","San Carlos de Bariloche","General Roca","Cipolletti","Allen","El Bolsón",
    "Cinco Saltos","Catriel","San Antonio Oeste","Sierra Grande",
    "Jacobacci","Maquinchao","Los Menucos","Ingeniero Jacobacci",
  ],
  "Salta": [
    "Salta capital","San Ramón de la Nueva Orán","Tartagal","Rosario de la Frontera",
    "General Güemes","Embarcación","Metán","Cafayate","Cachi","La Quiaca",
    "San Antonio de los Cobres","Rosario de Lerma","La Caldera","Cerrillos","El Bordo",
  ],
  "San Juan": [
    "San Juan capital","Rawson","Rivadavia","Caucete","Santa Lucía","Pocito",
    "Chimbas","9 de Julio","Albardón","Angaco","Calingasta","Jáchal","Iglesia","Ullum",
  ],
  "San Luis": [
    "San Luis capital","Villa Mercedes","Merlo","Justo Daract","La Toma","Quines",
    "Tilisarao","Santa Rosa del Conlara","Carpintería","Naschel","Luján","Concarán",
  ],
  "Santa Cruz": [
    "Río Gallegos","Caleta Olivia","Pico Truncado","Las Heras","Perito Moreno",
    "El Calafate","El Chaltén","Puerto San Julián","Gobernador Gregores","Puerto Deseado",
  ],
  "Santa Fe": [
    "Santa Fe capital","Rosario","Rafaela","Reconquista","Venado Tuerto","Villa Constitución",
    "San Lorenzo","Casilda","Esperanza","Las Rosas","Firmat","Cañada de Gómez",
    "Villa Gobernador Gálvez","Pérez","Gálvez","Sunchales","Santo Tomé",
    "Rufino","San Jorge","Tostado","Vera","Avellaneda","Calchaquí","San Cristóbal",
  ],
  "Santiago del Estero": [
    "Santiago del Estero capital","La Banda","Frías","Loreto","Añatuya","Quimilí",
    "Monte Quemado","Fernández","Termas de Río Hondo","Villa Río Hondo",
    "Clodomira","Beltrán","Los Telares",
  ],
  "Tierra del Fuego": [
    "Ushuaia","Río Grande","Tolhuin",
  ],
  "Tucumán": [
    "San Miguel de Tucumán","Yerba Buena","Banda del Río Salí","Alderetes",
    "Concepción","Monteros","Aguilares","Famailla","Bella Vista","Lules",
    "Simoca","Tafí Viejo","Las Talitas","El Manantial","Juan Bautista Alberdi",
    "Tafí del Valle","Amaicha del Valle","Cafayate (Tucumán)",
  ],
};

const PROVINCIAS_LIST = Object.keys(MUNICIPIOS_POR_PROVINCIA);

export default function NuevaMascota() {
  const [form, setForm] = useState({
    name: "", type: "", breed: "", birth_month: "", birth_year: "",
    weight: "", sex: "Macho", color: "", chip: "",
    zona_tipo: "", zona_valor: "", cp: "", castrado: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  function update(k: string, v: string) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === "type") { next.breed = ""; next.zona_tipo = ""; next.zona_valor = ""; }
      if (k === "zona_tipo") { next.zona_valor = ""; }
      return next;
    });
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function calcAge() {
    if (!form.birth_month || !form.birth_year) return "";
    const month = parseInt(form.birth_month);
    const year = parseInt(form.birth_year);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12 || year < 2000 || year > new Date().getFullYear()) return "";
    const now = new Date();
    const birth = new Date(year, month - 1);
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 0) return "";
    if (months < 12) return `${months} mes${months !== 1 ? "es" : ""}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} año${years !== 1 ? "s" : ""} y ${rem} mes${rem !== 1 ? "es" : ""}` : `${years} año${years !== 1 ? "s" : ""}`;
  }

  function buildLocation() {
    if (!form.zona_tipo) return "";
    if (form.zona_tipo === "CABA") return form.zona_valor ? form.zona_valor + ", CABA" : "CABA";
    return form.zona_valor ? form.zona_valor + ", " + form.zona_tipo : form.zona_tipo;
  }

  async function handleSave() {
    if (!form.name || !form.type || !form.breed) { setError("Nombre, tipo y raza son obligatorios"); return; }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const age = calcAge();
    const location = buildLocation();
    const { data: mascotaData, error: err } = await supabase.from("mascotas").insert({
      name: form.name, breed: form.breed, age, weight: form.weight ? `${form.weight} kg` : "",
      sex: form.sex, color: form.color, chip: form.chip, location,
      castrado: form.castrado || null,
      photo_url: "", user_id: user.id,
    }).select();

    if (err) { setError(err.message); setLoading(false); return; }

    const mascota = mascotaData?.[0];

    // Subir foto si se seleccionó
    if (photoFile && mascota) {
      const ext = photoFile.name.split(".").pop();
      const path = `${mascota.id}/perfil.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("mascotas").upload(path, photoFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("mascotas").getPublicUrl(path);
        const url = urlData.publicUrl + "?t=" + Date.now();
        await supabase.from("mascotas").update({ photo_url: url }).eq("id", mascota.id);
      }
    }

    // Guardar peso inicial
    if (form.weight && mascota) {
      await supabase.from("historial").insert({
        mascota_id: mascota.id,
        title: "Peso inicial",
        summary: `${form.weight} kg`,
        date: new Date().toLocaleDateString("es-AR"),
        vet: "Registro inicial",
      });
    }

    router.push("/dashboard");
    setLoading(false);
  }

  const sel = (label: string, key: string, opts: string[]) => (
    <div>
      <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>{label}</label>
      <select value={(form as any)[key]} onChange={e => update(key, e.target.value)}
        style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: (form as any)[key] ? "#1C3557" : "#64748B", width: "100%" }}>
        <option value="">Seleccioná...</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const months = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 25 }, (_, i) => String(currentYear - i));
  const age = calcAge();

  return (
    <main style={{ maxWidth: 440, margin: "0 auto", padding: "30px 20px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48 }}>🐾</div>
        <h1 style={{ fontFamily: "Georgia, serif", color: "#2CB8AD", fontSize: 24, marginTop: 8 }}>Registrá tu mascota</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Foto */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>Foto de perfil</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: 80, height: 80, borderRadius: "50%", cursor: "pointer",
              background: "#FFFFFF", border: "2px dashed #E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", flexShrink: 0,
            }}>
              {photoPreview
                ? <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 32 }}>📷</span>
              }
            </div>
            <div>
              <button onClick={() => fileRef.current?.click()} style={{
                background: "#2CB8AD22", color: "#2CB8AD", border: "1px solid #2CB8AD44",
                borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700,
              }}>
                {photoPreview ? "Cambiar foto" : "Agregar foto"}
              </button>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>JPG o PNG · Opcional</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        {/* Tipo */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>Tipo de mascota *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Perro", "Gato", "Otro"].map(t => (
              <button key={t} onClick={() => update("type", t)} style={{
                flex: 1, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 20,
                border: "1px solid", cursor: "pointer",
                background: form.type === t ? "#2CB8AD22" : "#FFFFFF",
                borderColor: form.type === t ? "#2CB8AD" : "#E2E8F0",
                color: form.type === t ? "#2CB8AD" : "#64748B",
              }}>
                {t === "Perro" ? "🐕" : t === "Gato" ? "🐱" : "🐾"}
                <div style={{ fontSize: 11, marginTop: 2 }}>{t}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Nombre *</label>
          <input value={form.name} placeholder="Ej: Tango" onChange={e => update("name", e.target.value)} />
        </div>

        {/* Raza */}
        {form.type && sel("Raza *", "breed", RAZAS[form.type] || [])}

        {/* Fecha nacimiento */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Fecha de nacimiento</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <select value={form.birth_month} onChange={e => update("birth_month", e.target.value)}
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: form.birth_month ? "#1C3557" : "#64748B", width: "100%" }}>
              <option value="">Mes</option>
              {months.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
            <select value={form.birth_year} onChange={e => update("birth_year", e.target.value)}
              style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", color: form.birth_year ? "#1C3557" : "#64748B", width: "100%" }}>
              <option value="">Año</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {age && <div style={{ marginTop: 6, color: "#2CB8AD", fontSize: 12, fontWeight: 600 }}>Edad actual: {age}</div>}
        </div>

        {/* Sexo */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Sexo</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Macho", "Hembra"].map(s => (
              <button key={s} onClick={() => update("sex", s)} style={{
                flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: "1px solid", cursor: "pointer",
                background: form.sex === s ? "#2CB8AD22" : "#FFFFFF",
                borderColor: form.sex === s ? "#2CB8AD" : "#E2E8F0",
                color: form.sex === s ? "#2CB8AD" : "#64748B",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Castrado */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>¿Está castrad{form.sex === "Hembra" ? "a" : "o"}?</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Sí", "No", "No sé"].map(op => (
              <button key={op} onClick={() => update("castrado", op)} style={{
                flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 13,
                border: "1px solid", cursor: "pointer",
                background: form.castrado === op ? "#2CB8AD22" : "#FFFFFF",
                borderColor: form.castrado === op ? "#2CB8AD" : "#E2E8F0",
                color: form.castrado === op ? "#2CB8AD" : "#64748B",
              }}>{op}</button>
            ))}
          </div>
        </div>

        {/* Peso */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Peso (kg)</label>
          <input type="number" value={form.weight} placeholder="Ej: 28" onChange={e => update("weight", e.target.value)} />
        </div>

        {/* Color */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Color / pelaje</label>
          <input value={form.color} placeholder="Ej: Dorado" onChange={e => update("color", e.target.value)} />
        </div>

        {/* Chip */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>Número de chip (opcional)</label>
          <input value={form.chip} placeholder="Ej: 985112345678901" onChange={e => update("chip", e.target.value)} />
        </div>

        {/* Zona */}
        <div>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 8 }}>Zona donde vive</label>
          {sel("Provincia / Ciudad", "zona_tipo", PROVINCIAS_LIST)}
          {form.zona_tipo && (
            <div style={{ marginTop: 10 }}>
              {sel(form.zona_tipo === "CABA" ? "Barrio" : "Municipio / Localidad", "zona_valor", MUNICIPIOS_POR_PROVINCIA[form.zona_tipo] || [])}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "#f8717115", border: "1px solid #f8717133", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button onClick={handleSave} disabled={loading} style={{
          background: "linear-gradient(135deg, #2CB8AD, #229E94)",
          color: "#fff", border: "none", borderRadius: 12,
          padding: 14, fontWeight: 800, fontSize: 15, marginTop: 8,
          opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px #2CB8AD30",
        }}>{loading ? "Guardando..." : "Crear perfil 🐾"}</button>
      </div>
    </main>
  );
}
