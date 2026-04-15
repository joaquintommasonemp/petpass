"use client";
import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output.buffer;
}

export default function PushButton({ authToken }: { authToken: string | null }) {
  const [status, setStatus] = useState<"unsupported" | "denied" | "granted" | "default" | "loading">("loading");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC_KEY) {
      setStatus("unsupported");
      return;
    }
    setStatus(Notification.permission as "denied" | "granted" | "default");
  }, []);

  async function subscribe() {
    if (!authToken) return;
    setSaving(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setSaving(false);
        return;
      }
      setStatus("granted");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch("/api/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
    } catch {
      // Si falla silencioso — no crítico
    }
    setSaving(false);
  }

  async function unsubscribe() {
    if (!authToken) return;
    setSaving(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("default");
    } catch {}
    setSaving(false);
  }

  if (status === "unsupported" || status === "loading" || !VAPID_PUBLIC_KEY) return null;

  if (status === "granted") {
    return (
      <button
        onClick={unsubscribe}
        disabled={saving}
        title="Desactivar notificaciones push"
        style={{
          background: "none", border: "1px solid #B2E8E5", borderRadius: 10,
          padding: "8px 14px", fontSize: 12, color: "#2CB8AD", fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          opacity: saving ? 0.6 : 1,
        }}
      >
        🔔 Notificaciones activadas
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={saving || status === "denied"}
      title={status === "denied" ? "Notificaciones bloqueadas en el navegador" : "Activar notificaciones de vacunas"}
      style={{
        background: status === "denied" ? "#F4F6FB" : "linear-gradient(135deg, #2CB8AD, #229E94)",
        border: "none", borderRadius: 10,
        padding: "8px 14px", fontSize: 12,
        color: status === "denied" ? "#94A3B8" : "#fff",
        fontWeight: 700, cursor: status === "denied" ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", gap: 6,
        opacity: saving ? 0.6 : 1,
      }}
    >
      🔔 {status === "denied" ? "Notificaciones bloqueadas" : "Activar notificaciones"}
    </button>
  );
}
