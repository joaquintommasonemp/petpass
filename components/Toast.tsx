"use client";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

const CONFIG: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "#E5F7F6", border: "#B2E8E5", text: "#1C3557", icon: "✅" },
  error:   { bg: "#FEF2F2", border: "#FECACA", text: "#EF4444", icon: "❌" },
  info:    { bg: "#EFF6FF", border: "#BFDBFE", text: "#3B82F6", icon: "ℹ️" },
  warning: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", icon: "⚠️" },
};

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  const c = CONFIG[type];

  useEffect(() => {
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, [message, onClose]);

  return (
    <div style={{
      position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)",
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 14, padding: "12px 16px",
      display: "flex", alignItems: "center", gap: 10,
      boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
      zIndex: 9999, maxWidth: 380, width: "calc(100vw - 32px)",
      animation: "fadeUp 0.2s ease both",
    }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{c.icon}</span>
      <span style={{ fontSize: 13, color: c.text, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: "none", border: "none", color: c.text, opacity: 0.4,
          fontSize: 20, cursor: "pointer", padding: 0, flexShrink: 0, lineHeight: 1,
        }}
      >×</button>
    </div>
  );
}
