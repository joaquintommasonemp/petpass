"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PerfilPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    const user = session.user;
    setUserId(user.id);
    setEmail(user.email ?? "");

    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, phone, avatar_url, is_premium")
      .eq("id", user.id)
      .single();

    if (prof) {
      setFullName(prof.full_name ?? "");
      setPhone(prof.phone ?? "");
      setAvatarUrl(prof.avatar_url ?? null);
      setIsPremium(!!prof.is_premium);
    }
    setLoading(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      const url = urlData.publicUrl + `?t=${Date.now()}`;
      setAvatarUrl(url);
    }
    setUploadingAvatar(false);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    const updates: Record<string, string | null> = {
      full_name: fullName,
      phone: phone,
    };
    if (avatarUrl) updates.avatar_url = avatarUrl;
    await supabase.from("profiles").update(updates).eq("id", userId);
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const initial = fullName.trim().charAt(0).toUpperCase() || "?";

  if (loading) {
    return (
      <div className="perfil-page" style={{ minHeight: "100vh", background: "#F4F6FB" }}>
        <div className="perfil-shell" style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px 48px" }}>
          <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 8, marginBottom: 20 }} />
          <div className="skeleton" style={{ width: 180, height: 32, borderRadius: 8, marginBottom: 24 }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
            <div className="skeleton" style={{ width: 96, height: 96, borderRadius: "50%" }} />
          </div>
          <div className="skeleton" style={{ height: 260, borderRadius: 16, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 52, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-page" style={{ minHeight: "100vh", background: "#F4F6FB" }}>
      <div
        className="perfil-shell"
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "24px 16px 48px",
        }}
      >
        {/* Back arrow */}
        <Link
          href="/dashboard"
          className="perfil-back-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#2CB8AD",
            fontWeight: 700,
            fontSize: 15,
            textDecoration: "none",
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>←</span>
          <span>Volver</span>
        </Link>

        {/* Title */}
        <h1
          className="perfil-title"
          style={{
            fontSize: 26,
            fontWeight: 900,
            color: "#1C3557",
            margin: "0 0 24px",
          }}
        >
          Mi perfil
        </h1>

        {/* Success banner */}
        {success && (
          <div
            style={{
              background: "#D1FAE5",
              border: "1px solid #6EE7B7",
              borderRadius: 12,
              padding: "12px 16px",
              color: "#065F46",
              fontWeight: 700,
              fontSize: 14,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Perfil actualizado ✓
          </div>
        )}

        {/* Avatar section */}
        <div
          className="perfil-avatar-section"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{ position: "relative", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #E2E8F0",
                }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2CB8AD, #229E94)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 36,
                  fontWeight: 900,
                  border: "3px solid #E2E8F0",
                }}
              >
                {initial}
              </div>
            )}
            {/* Camera overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "#2CB8AD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #fff",
                fontSize: 15,
              }}
            >
              📷
            </div>
          </div>
          {uploadingAvatar && (
            <div style={{ color: "#64748B", fontSize: 13, marginTop: 8 }}>
              Subiendo foto...
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Form card */}
        <div
          className="perfil-card"
          style={{
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            padding: "20px 16px",
            marginBottom: 16,
          }}
        >
          {/* Full name */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                color: "#64748B",
                marginBottom: 4,
                display: "block",
              }}
            >
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              style={{
                width: "100%",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                color: "#1C3557",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 12,
                color: "#64748B",
                marginBottom: 4,
                display: "block",
              }}
            >
              Teléfono (para WhatsApp)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+54 9 11 1234-5678"
              style={{
                width: "100%",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                color: "#1C3557",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Email (read-only) */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                color: "#64748B",
                marginBottom: 4,
                display: "block",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              style={{
                width: "100%",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                color: "#94A3B8",
                background: "#F8FAFC",
                outline: "none",
                boxSizing: "border-box",
                cursor: "not-allowed",
              }}
            />
            <span
              style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, display: "block" }}
            >
              No se puede cambiar
            </span>
          </div>

          {/* Premium status */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              borderTop: "1px solid #F1F5F9",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 14, color: "#1C3557", fontWeight: 600 }}>
              Estado Premium
            </span>
            {isPremium ? (
              <span
                style={{
                  background: "#D1FAE5",
                  color: "#065F46",
                  borderRadius: 20,
                  padding: "4px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Premium activo ✓œ“
              </span>
            ) : (
              <Link
                href="/premium"
                className="perfil-premium-link"
                style={{
                  color: "#2CB8AD",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                Activar Premium →†’
              </Link>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: "100%",
              background: saving
                ? "#94A3B8"
                : "linear-gradient(135deg, #2CB8AD, #229E94)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              padding: "16px",
              fontWeight: 900,
              fontSize: 15,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        {/* Sign out button */}
        <button
          className="perfil-signout-button"
          onClick={handleSignOut}
          style={{
            width: "100%",
            background: "transparent",
            color: "#EF4444",
            border: "1px solid #FECACA",
            borderRadius: 14,
            padding: "14px",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

