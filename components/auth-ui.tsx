import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type AuthLogoLinkProps = {
  mobile?: boolean;
  inverted?: boolean;
  marginBottom?: number;
  height?: number;
};

type AuthFeature = {
  icon: ReactNode;
  title?: ReactNode;
  text?: ReactNode;
  desc?: ReactNode;
};

export const AUTH_CARD_STYLE: CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: 24,
  padding: "36px 32px",
  boxShadow: "0 4px 32px rgba(28,53,87,0.09)",
};

export const AUTH_PRIMARY_BUTTON_STYLE: CSSProperties = {
  background: "linear-gradient(135deg, #2CB8AD, #229E94)",
  color: "#fff",
  border: "none",
  borderRadius: 14,
  padding: "15px 20px",
  fontWeight: 900,
  fontSize: 15,
  boxShadow: "0 4px 20px rgba(44,184,173,0.3)",
};

export function AuthPanelDecorations() {
  return (
    <>
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
    </>
  );
}

export function AuthLogoLink({
  mobile = false,
  inverted = false,
  marginBottom = 0,
  height = 68,
}: AuthLogoLinkProps) {
  const img = (
    <img
      src="/logo-brand-official.png"
      alt="PetPass"
      style={{
        height,
        width: "auto",
        objectFit: "contain",
        display: "block",
        ...(inverted ? { filter: "brightness(0) invert(1)" } : {}),
      }}
    />
  );

  if (mobile) {
    return (
      <div className="auth-mobile-logo">
        <Link href="/" style={{ textDecoration: "none", display: "inline-block", marginBottom }}>
          {img}
        </Link>
      </div>
    );
  }

  return (
    <Link
      href="/"
      className="auth-brand-logo-link"
      style={{ textDecoration: "none", display: "flex", justifyContent: "center", marginBottom }}
    >
      {img}
    </Link>
  );
}

export function AuthFeatureList({
  items,
  gap = 14,
  numbered = false,
}: {
  items: AuthFeature[];
  gap?: number;
  numbered?: boolean;
}) {
  return (
    <div className="auth-benefit-list" style={{ display: "flex", flexDirection: "column", gap }}>
      {items.map((item, index) => (
        <div
          key={typeof item.text === "string" ? item.text : typeof item.title === "string" ? item.title : index}
          className="auth-benefit-item"
          style={{ display: "flex", alignItems: numbered ? "flex-start" : "center", gap: 14 }}
        >
          <div
            className="auth-benefit-icon"
            style={{
              width: numbered ? 36 : 38,
              height: numbered ? 36 : 38,
              borderRadius: numbered ? "50%" : 10,
              flexShrink: 0,
              background: "rgba(255,255,255,0.15)",
              border: numbered ? "1px solid rgba(255,255,255,0.3)" : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "#fff",
              fontWeight: 900,
            }}
          >
            {item.icon}
          </div>
          {numbered ? (
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 14 }}>{item.title}</div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, marginTop: 2 }}>{item.desc}</div>
            </div>
          ) : (
            <span style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600 }}>{item.text}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function AuthBrandInfoCard({ children, style = {} }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      className="auth-brand-card"
      style={{
        marginTop: 48,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 16,
        padding: "16px 18px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
