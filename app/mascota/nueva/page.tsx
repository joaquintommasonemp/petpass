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
  Otro: ["Conejo", "Hurón", "Hámster", "Tortuga", "Pájaro", "Reptil", "Pez", "Otro"],
};

const CABA_BARRIOS = [
  "Agronomía","Almagro","Balvanera","Barracas","Belgrano","Boedo","Caballito",
  "Chacarita","Coghlan","Colegiales","Constitución","Flores","Floresta","La Boca",
  "La Paternal","Liniers","Mataderos","Monte Castro","Montserrat","Nueva Pompeya",
  "Núñez","Palermo","Parque Avellaneda","Parque Chacabuco","Parque Chas",
  "Parque Patricios","Puerto Madero","Recoleta","Retiro","Saavedra","San Cristóbal",
  "San Nicolás","San Telmo","Versalles","Villa Crespo","Villa del Parque",
  "Villa Devoto","Villa General Mitre","Villa Lugano","Villa Luro","Villa Ortúzar",
  "Villa Pueyrredón","Villa Real","Villa Riachuelo","Villa Santa Rita","Villa Soldati",
  "Villa Urquiza","Villa Vélez Sarsfield",
];

const PBA_MUNICIPIOS = [
  "Almirante Brown","Avellaneda","Azul","Bahía Blanca","Berazategui","Berisso",
  "Brandsen","Campana","Cañuelas","Ensenada","Escobar","Esteban Echeverría",
  "Ezeiza","Florencio Varela","General Pueyrredón","General San Martín",
  "Hurlingham","Ituzaingó","José C. Paz","La Matanza","La Plata","Lanús",
  "Lomas de Zamora","Luján","Malvinas Argentinas","Marcos Paz","Mercedes",
  "Merlo","Moreno","Morón","Pergamino","Pilar","Presidente Perón","Quilmes",
  "San Fernando","San Isidro","San Miguel","San Nicolás","San Vicente",
  "Tandil","Tigre","Tres de Febrero","Vicente López","Zárate",
];

const PROVINCIAS = [
  "Buenos Aires (provincia)","Catamarca","Chaco","Chubut","Córdoba","Corrientes",
  "Entre Ríos","Formosa","Jujuy","La Pampa","La Rioja","Mendoza","Misiones",
  "Neuquén","Río Negro","Salta","San Juan","San Luis","Santa Cruz","Santa Fe",
  "Santiago del Estero","Tierra del Fuego","Tucumán",
];

export default function NuevaMascota() {
  const [form, setForm] = useState({
    name: "", type: "", breed: "", birth_month: "", birth_year: "",
    weight: "", sex: "Macho", color: "", chip: "",
    zona_tipo: "", zona_valor: "", cp: "",
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
      if (k === "zona_tipo") { next.zona_valor = ""; next.cp = ""; }
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
    const now = new Date();
    const birth = new Date(parseInt(form.birth_year), parseInt(form.birth_month) - 1);
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} mes${months !== 1 ? "es" : ""}`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} año${years !== 1 ? "s" : ""} y ${rem} mes${rem !== 1 ? "es" : ""}` : `${years} año${years !== 1 ? "s" : ""}`;
  }

  function buildLocation() {
    if (form.zona_tipo === "CABA") return `${form.zona_valor}, CABA`;
    if (form.zona_tipo === "PBA") return `${form.zona_valor}, Buenos Aires`;
    if (form.zona_tipo === "Otra") return form.cp ? `${form.zona_valor} (CP: ${form.cp})` : form.zona_valor;
    return "";
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
      <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 4 }}>{label}</label>
      <select value={(form as any)[key]} onChange={e => update(key, e.target.value)}
        style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: (form as any)[key] ? "#f0f4ff" : "#7a8299", width: "100%" }}>
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
        <h1 style={{ fontFamily: "Georgia, serif", color: "#4ade80", fontSize: 24, marginTop: 8 }}>Registrá tu mascota</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Foto */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 8 }}>Foto de perfil</label>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div onClick={() => fileRef.current?.click()} style={{
              width: 80, height: 80, borderRadius: "50%", cursor: "pointer",
              background: "#181c27", border: "2px dashed #252a3a",
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
                background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
                borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700,
              }}>
                {photoPreview ? "Cambiar foto" : "Agregar foto"}
              </button>
              <div style={{ fontSize: 11, color: "#7a8299", marginTop: 4 }}>JPG o PNG · Opcional</div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        {/* Tipo */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 8 }}>Tipo de mascota *</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Perro", "Gato", "Otro"].map(t => (
              <button key={t} onClick={() => update("type", t)} style={{
                flex: 1, padding: 12, borderRadius: 10, fontWeight: 700, fontSize: 20,
                border: "1px solid", cursor: "pointer",
                background: form.type === t ? "#4ade8022" : "#181c27",
                borderColor: form.type === t ? "#4ade80" : "#252a3a",
                color: form.type === t ? "#4ade80" : "#7a8299",
              }}>
                {t === "Perro" ? "🐕" : t === "Gato" ? "🐱" : "🐾"}
                <div style={{ fontSize: 11, marginTop: 2 }}>{t}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 4 }}>Nombre *</label>
          <input value={form.name} placeholder="Ej: Tango" onChange={e => update("name", e.target.value)} />
        </div>

        {/* Raza */}
        {form.type && sel("Raza *", "breed", RAZAS[form.type] || [])}

        {/* Fecha nacimiento */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 4 }}>Fecha de nacimiento</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <select value={form.birth_month} onChange={e => update("birth_month", e.target.value)}
              style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: form.birth_month ? "#f0f4ff" : "#7a8299", width: "100%" }}>
              <option value="">Mes</option>
              {months.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
            <select value={form.birth_year} onChange={e => update("birth_year", e.target.value)}
              style={{ background: "#181c27", border: "1px solid #252a3a", borderRadius: 10, padding: "10px 14px", color: form.birth_year ? "#f0f4ff" : "#7a8299", width: "100%" }}>
              <option value="">Año</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {age && <div style={{ marginTop: 6, color: "#4ade80", fontSize: 12, fontWeight: 600 }}>Edad actual: {age}</div>}
        </div>

        {/* Sexo */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 4 }}>Sexo</label>
          <div style={{ display: "flex", gap: 8 }}>
            {["Macho", "Hembra"].map(s => (
              <button key={s} onClick={() => update("sex", s)} style={{
                flex: 1, padding: 10, borderRadius: 10, fontWeight: 700, fontSize: 14,
                border: "1px solid", cursor: "pointer",
                background: form.sex === s ? "#4ade8022" : "#181c27",
                borderColor: form.sex === s ? "#4ade80" : "#252a3a",
                color: form.sex === s ? "#4ade80" : "#7a8299",
              }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Peso */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 4 }}>Peso (kg)</label>
          <input type="number" value={form.weight} placeholder="Ej: 28" onChange={e => update("weight", e.target.value)} />
        </div>

        {/* Color */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 4 }}>Color / pelaje</label>
          <input value={form.color} placeholder="Ej: Dorado" onChange={e => update("color", e.target.value)} />
        </div>

        {/* Chip */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 4 }}>Número de chip (opcional)</label>
          <input value={form.chip} placeholder="Ej: 985112345678901" onChange={e => update("chip", e.target.value)} />
        </div>

        {/* Zona */}
        <div>
          <label style={{ fontSize: 12, color: "#7a8299", display: "block", marginBottom: 8 }}>Zona donde vive</label>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["CABA", "PBA", "Otra"].map(z => (
              <button key={z} onClick={() => update("zona_tipo", z)} style={{
                flex: 1, padding: 8, borderRadius: 10, fontWeight: 700, fontSize: 12,
                border: "1px solid", cursor: "pointer",
                background: form.zona_tipo === z ? "#4ade8022" : "#181c27",
                borderColor: form.zona_tipo === z ? "#4ade80" : "#252a3a",
                color: form.zona_tipo === z ? "#4ade80" : "#7a8299",
              }}>{z === "PBA" ? "Prov. BS AS" : z}</button>
            ))}
          </div>
          {form.zona_tipo === "CABA" && sel("Barrio", "zona_valor", CABA_BARRIOS)}
          {form.zona_tipo === "PBA" && sel("Municipio", "zona_valor", PBA_MUNICIPIOS)}
          {form.zona_tipo === "Otra" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sel("Provincia", "zona_valor", PROVINCIAS)}
              <input value={form.cp} placeholder="Código postal" onChange={e => update("cp", e.target.value)} />
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "#f8717115", border: "1px solid #f8717133", borderRadius: 10, padding: "10px 14px", color: "#f87171", fontSize: 13 }}>
            {error}
          </div>
        )}

        <button onClick={handleSave} disabled={loading} style={{
          background: "linear-gradient(135deg, #4ade80, #22c55e)",
          color: "#000", border: "none", borderRadius: 12,
          padding: 14, fontWeight: 800, fontSize: 15, marginTop: 8,
          opacity: loading ? 0.6 : 1, boxShadow: "0 4px 20px #4ade8030",
        }}>{loading ? "Guardando..." : "Crear perfil 🐾"}</button>
      </div>
    </main>
  );
}
