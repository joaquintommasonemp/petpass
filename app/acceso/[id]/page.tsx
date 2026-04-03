"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";

export default function AccesoFamiliar() {
  const [status, setStatus] = useState<"loading" | "joined" | "already" | "error" | "login">("loading");
  const [mascota, setMascota] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const mascotaId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    async function join() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus("login"); return; }

      const { data: ms } = await supabase.from("mascotas").select("name, breed, photo_url, user_id").eq("id", mascotaId).single();
      if (!ms) { setStatus("error"); return; }
      setMascota(ms);

      // No puede unirse a su propia mascota
      if (ms.user_id === user.id) { router.push("/dashboard"); return; }

      // Verificar si ya tiene acceso
      const { data: existing } = await supabase.from("mascota_familia")
        .select("id").eq("mascota_id", mascotaId).eq("user_id", user.id).single();
      if (existing) { setStatus("already"); return; }

      // Unirse
      const { error } = await supabase.from("mascota_familia").insert({
        mascota_id: mascotaId,
        user_id: user.id,
      });
      setStatus(error ? "error" : "joined");
    }
    join();
  }, [mascotaId]);

  const isGato = mascota?.breed?.toLowerCase().includes("gato");

  return (
    <div style={{
      minHeight: "100vh", background: "#F4F6FB", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div style={{
        background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 20,
        padding: 32, maxWidth: 360, width: "100%", textAlign: "center",
      }}>
        {status === "loading" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🐾</div>
            <div style={{ color: "#64748B" }}>Verificando acceso...</div>
          </>
        )}

        {status === "login" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Necesitás iniciar sesión</div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Para unirte como familia, primero iniciá sesión en PetPass.
            </p>
            <button
              onClick={() => router.push(`/login?redirect=/acceso/${mascotaId}`)}
              style={{
                width: "100%", background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                color: "#fff", border: "none", borderRadius: 12, padding: 14,
                fontWeight: 800, fontSize: 15, cursor: "pointer",
              }}>Iniciar sesión</button>
          </>
        )}

        {(status === "joined" || status === "already") && mascota && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
              background: "#E2E8F0", border: "3px solid #2CB8AD44",
              display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            }}>
              {mascota.photo_url
                ? <img src={mascota.photo_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 40 }}>{isGato ? "🐱" : "🐕"}</span>
              }
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{mascota.name}</div>
            <div style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>{mascota.breed}</div>
            <div style={{
              background: status === "already" ? "#2CB8AD12" : "#E5F7F6",
              border: "1px solid #2CB8AD44", borderRadius: 12, padding: "12px 16px", marginBottom: 20,
            }}>
              <div style={{ color: "#2CB8AD", fontWeight: 800, fontSize: 14 }}>
                {status === "joined" ? "✅ ¡Acceso concedido!" : "✅ Ya tenés acceso"}
              </div>
              <div style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>
                {status === "joined"
                  ? `Ahora podés ver y gestionar a ${mascota.name} desde tu dashboard.`
                  : `Ya sos parte de la familia de ${mascota.name}.`}
              </div>
            </div>
            <button onClick={() => router.push("/dashboard")} style={{
              width: "100%", background: "linear-gradient(135deg, #2CB8AD, #229E94)",
              color: "#fff", border: "none", borderRadius: 12, padding: 14,
              fontWeight: 800, fontSize: 15, cursor: "pointer",
            }}>Ir al dashboard →</button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Link inválido</div>
            <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>
              Este link no es válido o ya no está activo.
            </p>
            <button onClick={() => router.push("/dashboard")} style={{
              width: "100%", background: "#E2E8F0", color: "#1C3557", border: "none",
              borderRadius: 12, padding: 14, fontWeight: 700, fontSize: 14, cursor: "pointer",
            }}>Volver al inicio</button>
          </>
        )}
      </div>
    </div>
  );
}
