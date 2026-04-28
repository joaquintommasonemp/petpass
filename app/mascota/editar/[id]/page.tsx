"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BreedCombobox from "@/components/BreedCombobox";

const RAZAS_COMUNES = (() => {
  const top = ["Mestizo", "Mestizo / Común", "Europeo Común"];
  const bottom = ["Otro"];
  const all = [
    "Mestizo", "Mestizo / Común", "Europeo Común",
    // Perros
    "Abisinio", "Affenpinscher", "Akita Americano", "Akita Inu", "Alaskan Malamute",
    "American Staffordshire / Pitbull", "Australian Shepherd / Pastor Australiano",
    "Basset Hound", "Beagle", "Bengalí", "Bichón Frisé", "Border Collie", "Boxer",
    "British Shorthair", "Bulldog Francés", "Bulldog Inglés", "Bull Mastiff",
    "Bull Terrier", "Burmés", "Caniche/Poodle", "Cane Corso", "Canario", "Chihuahua",
    "Chinchilla", "Chow Chow", "Cobayo / Guinea pig", "Cockapoo", "Cocker Spaniel Inglés",
    "Collie / Lassie", "Conejo", "Corgi Galés Pembroke", "Dachshund/Teckel", "Dálmata",
    "Doberman", "Dogo Argentino", "Dragón Barbudo", "Exotic Shorthair", "Galgo Español",
    "Golden Retriever", "Goldendoodle", "Gran Danés", "Himalayo", "Husky Siberiano",
    "Hurón", "Iguana Verde", "Jack Russell Terrier", "Labradoodle", "Labrador",
    "Lhasa Apso", "Loro / Cotorra", "Maine Coon", "Malinois / Pastor Belga",
    "Maltés", "Maltipoo", "Mastín Napolitano", "Noruego de los Bosques",
    "Pastor Alemán", "Persa", "Pinscher Miniatura", "Pomerania", "Pug / Carlino",
    "Ragdoll", "Rhodesian Ridgeback", "Rottweiler", "Russian Azul", "Samoyedo",
    "Schnauzer Gigante", "Schnauzer Mediano", "Schnauzer Miniatura", "Scottish Fold",
    "Setter Inglés", "Shar Pei", "Shetland Sheepdog / Sheltie", "Shiba Inu",
    "Shih Tzu", "Siamés", "Siberiano", "Silky Terrier", "Spitz Alemán",
    "Sphynx / Esfinge", "Staffordshire Bull Terrier", "Terranova / Newfoundland",
    "Tortuga de tierra", "Vizsla / Braco Húngaro", "Weimaraner", "West Highland Terrier",
    "Whippet", "Yorkshire Terrier", "Otro",
  ];
  const middle = all.filter(r => !top.includes(r) && !bottom.includes(r));
  middle.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  return [...top, ...middle, ...bottom];
})();

const OBRAS_SOCIALES = [
  "OSPAN", "Vetify", "Iké Mascotas", "Companion", "HolaVet",
  "Puppis One", "Total Pet", "PetPlus", "Medipet", "AVSIM", "Sosmask",
  "Mascota y Salud", "MAPFRE Mascotas", "BBVA Seguros Mascotas",
  "Banco Macro Mascotas", "Banco Hipotecario Mascotas", "Naranja X Mascotas",
  "Sancor Seguros", "Otra",
];

export default function EditarMascota() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [mascotaName, setMascotaName] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    breed: "",
    sex: "Macho",
    castrado: "",
    weight: "",
    chip: "",
    color: "",
    location: "",
    tiene_os: "",
    obra_social: "",
    os_plan: "",
    os_numero: "",
  });

  useEffect(() => {
    if (id) loadMascota();
  }, [id]);

  async function loadMascota() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: mascota, error: err } = await supabase
      .from("mascotas")
      .select("*")
      .eq("id", id)
      .single();

    if (err || !mascota) { router.push("/dashboard"); return; }
    if (mascota.user_id !== user.id) { router.push("/dashboard"); return; }

    setMascotaName(mascota.name || "");
    setCurrentPhoto(mascota.photo_url || null);

    // El peso se guarda como "X kg", mostramos solo el número
    const weightRaw = mascota.weight || "";
    const weightNum = weightRaw.replace(/\s*kg$/i, "").trim();

    setForm({
      name: mascota.name || "",
      breed: mascota.breed || "",
      sex: mascota.sex || "Macho",
      castrado: mascota.castrado || "",
      weight: weightNum,
      chip: mascota.chip || "",
      color: mascota.color || "",
      location: mascota.location || "",
      tiene_os: mascota.obra_social ? "Sí" : "",
      obra_social: mascota.obra_social || "",
      os_plan: mascota.os_plan || "",
      os_numero: mascota.os_numero || "",
    });

    setLoading(false);
  }

  function update(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    setError("");
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // Verificar que la mascota pertenece al usuario
    const { data: mascota } = await supabase
      .from("mascotas")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (!mascota || mascota.user_id !== user.id) { router.push("/dashboard"); return; }

    let photoUrl: string | undefined = undefined;

    // Subir nueva foto si se seleccionó
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${id}/perfil.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("mascotas")
        .upload(path, photoFile, { upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("mascotas").getPublicUrl(path);
        photoUrl = urlData.publicUrl + "?t=" + Date.now();
      }
    }

    const updateData: Record<string, any> = {
      name: form.name.trim(),
      breed: form.breed.trim(),
      sex: form.sex,
      castrado: form.castrado || null,
      weight: form.weight.trim() ? `${form.weight.trim()} kg` : "",
      chip: form.chip.trim(),
      color: form.color.trim(),
      location: form.location.trim(),
      obra_social: form.tiene_os === "Sí" ? (form.obra_social || null) : null,
      os_plan: form.tiene_os === "Sí" ? (form.os_plan || null) : null,
      os_numero: form.tiene_os === "Sí" ? (form.os_numero || null) : null,
    };

    if (photoUrl !== undefined) {
      updateData.photo_url = photoUrl;
    }

    const { error: updateErr } = await supabase
      .from("mascotas")
      .update(updateData)
      .eq("id", id);

    if (updateErr) {
      setError(updateErr.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F6FB" }}>
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", height: 56, display: "flex", alignItems: "center", padding: "0 20px" }}>
          <div className="skeleton" style={{ width: 120, height: 18, borderRadius: 8 }} />
        </div>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "20px 24px", display: "flex", gap: 20, alignItems: "center", border: "1px solid #E2E8F0" }}>
            <div className="skeleton" style={{ width: 80, height: 80, borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="skeleton" style={{ height: 14, width: "40%" }} />
              <div className="skeleton" style={{ height: 12, width: "60%" }} />
              <div className="skeleton" style={{ height: 32, width: 120, borderRadius: 10 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 380, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 52, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  // ── Éxito ──
  if (success) {
    return (
      <div style={{ minHeight: "100vh", background: "#F4F6FB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #2CB8AD, #229E94)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ color: "#1C3557", fontWeight: 900, fontSize: 22, margin: 0 }}>¡Cambios guardados!</h2>
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>Los datos de {form.name} fueron actualizados.</p>
        <Link href="/dashboard" style={{
          background: "linear-gradient(135deg, #2CB8AD, #229E94)",
          color: "#fff", borderRadius: 14, padding: "14px 32px",
          fontWeight: 800, fontSize: 15, textDecoration: "none",
          boxShadow: "0 4px 20px rgba(44,184,173,0.28)",
        }}>
          Ir al dashboard
        </Link>
      </div>
    );
  }

  const photoDisplay = photoPreview || currentPhoto;
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    color: "#1C3557",
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#64748B",
    display: "block",
    marginBottom: 5,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FB" }}>

      {/* ── HEADER ── */}
      <div style={{
        background: "#fff",
        borderBottom: "1px solid #E2E8F0",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px", height: 56, display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{
            color: "#1C3557", textDecoration: "none", fontWeight: 700, fontSize: 18,
            display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
          }}>
            ←
          </Link>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1C3557", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Editar {mascotaName || "mascota"}
          </h1>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Foto */}
        <div style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              border: "2px solid #E2E8F0",
              overflow: "hidden",
              background: "#F4F6FB",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {photoDisplay
                ? <img src={photoDisplay} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 36 }}>🐾</span>
              }
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3557", marginBottom: 4 }}>Foto de perfil</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>
              {photoFile ? `Nuevo archivo: ${photoFile.name}` : "Foto actual"}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                background: "#F4F6FB",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 700,
                color: "#2CB8AD",
                cursor: "pointer",
              }}
            >
              Cambiar foto
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </div>
        </div>

        {/* Formulario */}
        <div style={{
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>
            Datos básicos
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Nombre */}
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update("name", e.target.value)}
                placeholder="Nombre de tu mascota"
                required
                style={inputStyle}
              />
            </div>

            {/* Raza */}
            <div>
              <label style={labelStyle}>Raza</label>
              <BreedCombobox
                value={form.breed}
                onChange={v => update("breed", v)}
                options={RAZAS_COMUNES}
                placeholder="Buscá o seleccioná una raza..."
              />
            </div>

            {/* Sexo */}
            <div>
              <label style={labelStyle}>Sexo</label>
              <select
                value={form.sex}
                onChange={e => update("sex", e.target.value)}
                style={{ ...inputStyle, color: "#1C3557" }}
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>

            {/* Castrado */}
            <div>
              <label style={labelStyle}>Castrado/a</label>
              <select
                value={form.castrado}
                onChange={e => update("castrado", e.target.value)}
                style={{ ...inputStyle, color: form.castrado ? "#1C3557" : "#64748B" }}
              >
                <option value="">Seleccioná...</option>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
                <option value="No sé">No sé</option>
              </select>
            </div>

            {/* Peso */}
            <div>
              <label style={labelStyle}>Peso (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weight}
                onChange={e => update("weight", e.target.value)}
                placeholder="Ej: 8.5"
                style={inputStyle}
              />
            </div>

            {/* Chip */}
            <div>
              <label style={labelStyle}>Número de microchip</label>
              <input
                type="text"
                value={form.chip}
                onChange={e => update("chip", e.target.value)}
                placeholder="Ej: 985112345678901"
                style={inputStyle}
              />
            </div>

            {/* Color */}
            <div>
              <label style={labelStyle}>Color / señas particulares</label>
              <input
                type="text"
                value={form.color}
                onChange={e => update("color", e.target.value)}
                placeholder="Ej: Dorado con manchas blancas"
                style={inputStyle}
              />
            </div>

            {/* Ubicación */}
            <div>
              <label style={labelStyle}>Ubicación habitual</label>
              <input
                type="text"
                value={form.location}
                onChange={e => update("location", e.target.value)}
                placeholder="Ej: Palermo, Buenos Aires"
                style={inputStyle}
              />
            </div>

          </div>
        </div>

        {/* Obra social / seguro */}
        <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 18 }}>
            🏥 Cobertura veterinaria
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ¿Tiene cobertura? */}
            <div>
              <label style={labelStyle}>¿Tiene obra social o seguro veterinario?</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["Sí", "No"].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => update("tiene_os", opt)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 10, fontWeight: 700, fontSize: 14,
                      border: "1px solid",
                      cursor: "pointer",
                      background: form.tiene_os === opt ? "#2CB8AD22" : "#FFFFFF",
                      borderColor: form.tiene_os === opt ? "#2CB8AD" : "#E2E8F0",
                      color: form.tiene_os === opt ? "#2CB8AD" : "#64748B",
                    }}
                  >{opt}</button>
                ))}
              </div>
            </div>

            {form.tiene_os === "Sí" && (
              <>
                <div>
                  <label style={labelStyle}>Prestadora / Aseguradora</label>
                  <select
                    value={form.obra_social}
                    onChange={e => update("obra_social", e.target.value)}
                    style={{ ...inputStyle, color: form.obra_social ? "#1C3557" : "#64748B" }}
                  >
                    <option value="">Seleccioná...</option>
                    {OBRAS_SOCIALES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Plan</label>
                  <input
                    type="text"
                    value={form.os_plan}
                    onChange={e => update("os_plan", e.target.value)}
                    placeholder="Ej: Plan Básico, Plan Familiar..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>N° de socio / póliza</label>
                  <input
                    type="text"
                    value={form.os_numero}
                    onChange={e => update("os_numero", e.target.value)}
                    placeholder="Número de afiliado o póliza"
                    style={inputStyle}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 12,
            padding: "12px 16px",
            color: "#DC2626",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Botón guardar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            background: saving ? "#94A3B8" : "linear-gradient(135deg, #2CB8AD, #229E94)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: 16,
            fontSize: 16,
            fontWeight: 800,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: saving ? "none" : "0 4px 20px rgba(44,184,173,0.28)",
            transition: "opacity 0.2s",
          }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {/* Link volver */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link href="/dashboard" style={{ color: "#64748B", fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
            Cancelar y volver al dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
