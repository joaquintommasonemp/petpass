"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

function Badge({ children, color = "#4ade80" }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      background: color + "22", color, borderRadius: 20, padding: "2px 10px",
      fontSize: 11, fontWeight: 700, border: `1px solid ${color}44`,
    }}>{children}</span>
  );
}

function Card({ children, style = {} }: { children: React.ReactNode; style?: any }) {
  return (
    <div style={{
      background: "#181c27", border: "1px solid #252a3a", borderRadius: 16,
      padding: 16, marginBottom: 12, ...style,
    }}>{children}</div>
  );
}

export default function Dashboard() {
  const [mascotas, setMascotas] = useState<any[]>([]);
  const [vacunas, setVacunas] = useState<any[]>([]);
  const [diagnosticos, setDiagnosticos] = useState<any[]>([]);
  const [citas, setCitas] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showBaja, setShowBaja] = useState(false);
  const [showPeso, setShowPeso] = useState(false);
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [showAgendarCita, setShowAgendarCita] = useState(false);
  const [citaForm, setCitaForm] = useState({ date: "", summary: "", vet: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    const { data: prof } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (prof?.is_admin) setIsAdmin(true);
    const { data } = await supabase.from("mascotas").select("*").eq("user_id", user.id).eq("active", true);
    if (data && data.length > 0) {
      setMascotas(data);
      await selectMascota(data[0]);
    }
    setLoading(false);
  }

  async function togglePublic() {
    if (!selected) return;
    const newVal = !isPublic;
    setIsPublic(newVal);
    await supabase.from("mascotas").update({ is_public: newVal }).eq("id", selected.id);
    setSelected((prev: any) => ({ ...prev, is_public: newVal }));
  }

  async function selectMascota(m: any) {
    setSelected(m);
    setIsPublic(m.is_public || false);
    const { data: vacs } = await supabase.from("vacunas").select("*").eq("mascota_id", m.id);
    setVacunas(vacs || []);
    const { data: diags } = await supabase.from("historial").select("*")
      .eq("mascota_id", m.id)
      .not("title", "in", '("Actualización de peso","Peso inicial","📄 Documento","📅 Cita")')
      .order("created_at", { ascending: false }).limit(5);
    setDiagnosticos(diags || []);
    const { data: cits } = await supabase.from("historial").select("*")
      .eq("mascota_id", m.id).eq("title", "📅 Cita")
      .order("date", { ascending: true });
    setCitas(cits || []);
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploadingPhoto(true);
    const ext = file.name.split(".").pop();
    const path = `${selected.id}/perfil.${ext}`;
    await supabase.storage.from("mascotas").upload(path, file, { upsert: true });
    const { data: urlData } = supabase.storage.from("mascotas").getPublicUrl(path);
    const url = urlData.publicUrl + "?t=" + Date.now();
    await supabase.from("mascotas").update({ photo_url: url }).eq("id", selected.id);
    setSelected((prev: any) => ({ ...prev, photo_url: url }));
    setMascotas(prev => prev.map(m => m.id === selected.id ? { ...m, photo_url: url } : m));
    setUploadingPhoto(false);
  }

  async function handleBaja() {
    if (!selected) return;
    await supabase.from("mascotas").update({ active: false }).eq("id", selected.id);
    const restantes = mascotas.filter(m => m.id !== selected.id);
    setMascotas(restantes);
    setSelected(restantes[0] || null);
    setShowBaja(false);
  }

  async function handleAgregarPeso() {
    if (!nuevoPeso || !selected) return;
    const entry = {
      mascota_id: selected.id,
      title: "Actualización de peso",
      summary: `${nuevoPeso} kg`,
      date: new Date().toLocaleDateString("es-AR"),
      vet: "Actualización manual",
    };
    await supabase.from("historial").insert(entry);
    await supabase.from("mascotas").update({ weight: `${nuevoPeso} kg` }).eq("id", selected.id);
    setSelected((prev: any) => ({ ...prev, weight: `${nuevoPeso} kg` }));
    setNuevoPeso("");
    setShowPeso(false);
  }

  async function handleAgendarCita() {
    if (!citaForm.date || !citaForm.summary || !selected) return;
    const entry = {
      mascota_id: selected.id,
      title: "📅 Cita",
      summary: citaForm.summary,
      date: citaForm.date,
      vet: citaForm.vet || null,
    };
    const { data } = await supabase.from("historial").insert(entry).select();
    if (data?.[0]) {
      setCitas(prev => [...prev, data[0]].sort((a, b) => a.date.localeCompare(b.date)));
    }
    setCitaForm({ date: "", summary: "", vet: "" });
    setShowAgendarCita(false);
  }

  async function eliminarCita(id: string) {
    await supabase.from("historial").delete().eq("id", id);
    setCitas(prev => prev.filter(c => c.id !== id));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: "#7a8299" }}>Cargando...</div>;

  if (mascotas.length === 0) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ fontSize: 64 }}>🐾</div>
      <h2 style={{ marginTop: 16, marginBottom: 8 }}>Registrá tu primera mascota</h2>
      <p style={{ color: "#7a8299", marginBottom: 24 }}>Todavía no tenés ninguna mascota en PetPass.</p>
      <Link href="/mascota/nueva" style={{
        background: "#4ade80", color: "#000", borderRadius: 12, padding: "12px 24px",
        fontWeight: 800, textDecoration: "none", fontSize: 14,
      }}>+ Agregar mascota</Link>
    </div>
  );

  return (
    <div>
      {/* Selector de mascotas */}
      {mascotas.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
          {mascotas.map(m => (
            <button key={m.id} onClick={() => selectMascota(m)} style={{
              background: selected?.id === m.id ? "#4ade8022" : "#181c27",
              border: `1px solid ${selected?.id === m.id ? "#4ade80" : "#252a3a"}`,
              borderRadius: 20, padding: "6px 14px",
              color: selected?.id === m.id ? "#4ade80" : "#7a8299",
              fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {m.photo_url
                ? <img src={m.photo_url} style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }} />
                : <span>{m.breed?.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
              }
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Perfil principal */}
      <Card style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* Foto con upload */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 80, height: 80, borderRadius: "50%", cursor: "pointer",
              background: "#252a3a", border: "2px solid #4ade8044",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", position: "relative",
            }}
          >
            {uploadingPhoto ? (
              <span style={{ color: "#7a8299", fontSize: 11 }}>Subiendo...</span>
            ) : selected?.photo_url ? (
              <img src={selected.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: 40 }}>{selected?.breed?.toLowerCase().includes("gato") ? "🐱" : "🐕"}</span>
            )}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "#00000088", textAlign: "center", fontSize: 9,
              color: "#fff", padding: "2px 0", fontWeight: 700,
            }}>📷 Foto</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "Georgia, serif" }}>{selected?.name}</div>
          <div style={{ color: "#7a8299", fontSize: 13, marginBottom: 8 }}>
            {selected?.breed} · {selected?.age} · {selected?.sex}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {selected?.chip && (
              <a href={`/mascota/${selected.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <Badge color="#4ade80">🔗 Chip: ...{selected.chip.slice(-6)}</Badge>
              </a>
            )}
            {selected?.location && <Badge color="#60a5fa">{selected.location}</Badge>}
            {selected?.weight && <Badge color="#fb923c">{selected.weight}</Badge>}
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <a href={`/mascota/${selected?.id}`} target="_blank" rel="noreferrer" style={{
              fontSize: 11, color: "#4ade80", textDecoration: "none", fontWeight: 700,
              background: "#4ade8012", border: "1px solid #4ade8030", borderRadius: 8,
              padding: "4px 10px", display: "inline-block",
            }}>🌐 Ver perfil</a>
            {/* Toggle público/privado */}
            <button onClick={togglePublic} style={{
              display: "flex", alignItems: "center", gap: 5,
              background: isPublic ? "#4ade8018" : "#252a3a",
              border: `1px solid ${isPublic ? "#4ade8044" : "#353a4a"}`,
              borderRadius: 20, padding: "4px 10px", cursor: "pointer",
              fontSize: 11, fontWeight: 700,
              color: isPublic ? "#4ade80" : "#7a8299",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%",
                background: isPublic ? "#4ade80" : "#7a8299",
                display: "inline-block", transition: "background 0.2s",
              }} />
              {isPublic ? "Visible en Explorar" : "Perfil privado"}
            </button>
          </div>
        </div>
      </Card>

      {/* QR compacto */}
      <Card style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>⬛</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>QR de identificación</div>
          <div style={{ color: "#7a8299", fontSize: 11 }}>Colocalo en el collar — si lo encuentran, ven todos sus datos</div>
        </div>
        <a href={`/mascota/${selected?.id}`} target="_blank" rel="noreferrer" style={{
          background: "#252a3a", color: "#f0f4ff", borderRadius: 8, padding: "6px 12px",
          fontSize: 11, fontWeight: 700, textDecoration: "none", flexShrink: 0,
        }}>Ver →</a>
      </Card>

      {/* Resumen de salud */}
      {(() => {
        const lastVac = [...vacunas].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
        const nextVac = [...vacunas].filter(v => v.next_date).sort((a, b) => new Date(a.next_date).getTime() - new Date(b.next_date).getTime())[0];
        const lastVisita = diagnosticos[0];
        const today = new Date().toISOString().slice(0, 10);
        const citasProximas = citas.filter(c => c.date >= today);
        const hasData = lastVac || nextVac || lastVisita || citasProximas.length > 0;
        return (
          <Card style={{ border: "1px solid #4ade8022", padding: 0, overflow: "hidden" }}>
            <div style={{ background: "#0f2a1a", padding: "10px 16px", borderBottom: "1px solid #4ade8022", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: "#4ade80" }}>🏥 Estado de salud</span>
              <button onClick={() => setShowAgendarCita(true)} style={{
                background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
                borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}>+ Agendar cita</button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 0 }}>
              {lastVisita && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a2030" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#7a8299", marginBottom: 1 }}>Última visita</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lastVisita.title}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#7a8299" }}>{lastVisita.date}</span>
                </div>
              )}
              {lastVac && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a2030" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#7a8299", marginBottom: 1 }}>Última vacuna</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{lastVac.name}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "#7a8299" }}>{lastVac.date}</span>
                </div>
              )}
              {nextVac && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: citasProximas.length > 0 ? "1px solid #1a2030" : "none" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#7a8299", marginBottom: 1 }}>Próxima vacuna</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{nextVac.name}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>{nextVac.next_date}</span>
                </div>
              )}
              {!hasData && (
                <div style={{ textAlign: "center", padding: "12px 0", color: "#7a8299", fontSize: 13 }}>
                  Sin datos de salud registrados aún
                </div>
              )}
              {citasProximas.length > 0 && (
                <div style={{ paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>PRÓXIMAS CITAS</div>
                  {citasProximas.map((c: any) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a2030" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{c.summary}</div>
                        {c.vet && <div style={{ fontSize: 11, color: "#7a8299" }}>{c.vet}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>{c.date}</span>
                        <button onClick={() => eliminarCita(c.id)} style={{
                          background: "transparent", border: "none", color: "#f87171",
                          fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1,
                        }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })()}

      {/* Peso actual — solo botón actualizar */}
      <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>⚖️ Peso: <span style={{ color: "#fb923c" }}>{selected?.weight || "no registrado"}</span></div>
        <button onClick={() => setShowPeso(!showPeso)} style={{
          background: "#fb923c22", color: "#fb923c", border: "1px solid #fb923c44",
          borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>Actualizar</button>
      </Card>
      {showPeso && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12, marginTop: -8 }}>
          <input type="number" placeholder="Nuevo peso en kg" value={nuevoPeso}
            onChange={e => setNuevoPeso(e.target.value)} style={{ flex: 1 }} />
          <button onClick={handleAgregarPeso} style={{
            background: "#4ade80", color: "#000", border: "none", borderRadius: 8,
            padding: "8px 14px", fontWeight: 800, cursor: "pointer",
          }}>Guardar</button>
        </div>
      )}

      {/* Vacunas */}
      {vacunas.length > 0 && (
        <>
          <div style={{ color: "#7a8299", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            Vacunas
          </div>
          {vacunas.map((v: any, i: number) => (
            <Card key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{v.name}</div>
                <div style={{ color: "#7a8299", fontSize: 12 }}>Aplicada: {v.date} · Próxima: {v.next_date}</div>
              </div>
              <Badge color={v.status === "ok" ? "#4ade80" : "#f87171"}>
                {v.status === "ok" ? "Al día" : "Vencida"}
              </Badge>
            </Card>
          ))}
        </>
      )}

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Link href="/mascota/nueva" style={{
          flex: 1, background: "#4ade8022", color: "#4ade80", border: "1px solid #4ade8044",
          borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13,
          textDecoration: "none", textAlign: "center",
        }}>+ Agregar mascota</Link>
        <button onClick={() => setShowBaja(true)} style={{
          flex: 1, background: "#f8717122", color: "#f87171", border: "1px solid #f8717144",
          borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>🕊️ Dar de baja</button>
      </div>

      {/* Modal baja */}
      {showBaja && (
        <div style={{
          position: "fixed", inset: 0, background: "#00000088", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div style={{ background: "#181c27", border: "1px solid #f8717144", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%" }}>
            <div style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>🕊️</div>
            <h3 style={{ textAlign: "center", marginBottom: 8 }}>Dar de baja a {selected?.name}</h3>
            <p style={{ color: "#7a8299", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
              Lamentamos mucho tu pérdida. El perfil quedará guardado en tu historial pero no aparecerá activo.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowBaja(false)} style={{
                flex: 1, background: "#252a3a", color: "#7a8299", border: "none",
                borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer",
              }}>Cancelar</button>
              <button onClick={handleBaja} style={{
                flex: 1, background: "#f87171", color: "#fff", border: "none",
                borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer",
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agendar cita */}
      {showAgendarCita && (
        <div style={{ position: "fixed", inset: 0, background: "#00000088", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#181c27", border: "1px solid #a78bfa44", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%" }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 16, color: "#a78bfa" }}>📅 Agendar cita</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="date" value={citaForm.date} onChange={e => setCitaForm(f => ({ ...f, date: e.target.value }))} />
              <input placeholder="Motivo (ej: Control anual, Castración)" value={citaForm.summary} onChange={e => setCitaForm(f => ({ ...f, summary: e.target.value }))} />
              <input placeholder="Veterinario / Clínica (opcional)" value={citaForm.vet} onChange={e => setCitaForm(f => ({ ...f, vet: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAgendarCita(false)} style={{
                  flex: 1, background: "#252a3a", color: "#7a8299", border: "none",
                  borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer",
                }}>Cancelar</button>
                <button onClick={handleAgendarCita} style={{
                  flex: 1, background: "#a78bfa", color: "#fff", border: "none",
                  borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer",
                }}>Agendar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <Link href="/admin" style={{
          display: "block", width: "100%", background: "#f472b622", color: "#f472b6",
          border: "1px solid #f472b644", borderRadius: 12, padding: 12, fontWeight: 700,
          fontSize: 13, marginTop: 12, textAlign: "center", textDecoration: "none",
        }}>⚙️ Panel admin</Link>
      )}

      <button onClick={handleLogout} style={{
        width: "100%", background: "transparent", border: "1px solid #252a3a",
        borderRadius: 12, padding: 12, color: "#7a8299", fontSize: 13, marginTop: 8, cursor: "pointer",
      }}>Cerrar sesión</button>
    </div>
  );
}
