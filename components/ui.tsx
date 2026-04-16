import type { CSSProperties, ReactNode } from "react";

type UiCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function UiCard({ children, className = "", style = {} }: UiCardProps) {
  return (
    <div
      className={`ui-card${className ? ` ${className}` : ""}`}
      style={{
        background: "linear-gradient(180deg, #FFFFFF 0%, #FCFDFF 100%)",
        border: "1px solid #E2E8F0",
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
        boxShadow: "0 12px 28px rgba(28,53,87,0.05)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

type UiBadgeProps = {
  children: ReactNode;
  color?: string;
  className?: string;
  fontSize?: number;
  size?: "sm" | "md";
  style?: CSSProperties;
};

export function UiBadge({
  children,
  color = "#2CB8AD",
  className = "",
  fontSize = 11,
  size = "sm",
  style = {},
}: UiBadgeProps) {
  return (
    <span
      className={`ui-badge${className ? ` ${className}` : ""}`}
      style={{
        background: color + "22",
        color,
        borderRadius: 20,
        padding: size === "md" ? "5px 12px" : "3px 10px",
        fontSize: size === "md" ? Math.max(fontSize, 12) : fontSize,
        fontWeight: 800,
        border: `1px solid ${color}44`,
        minHeight: size === "md" ? 28 : 24,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        lineHeight: 1.15,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type UiChipProps = {
  children: ReactNode;
  color?: string;
  className?: string;
  style?: CSSProperties;
};

export function UiChip({ children, color = "#2CB8AD", className = "", style = {} }: UiChipProps) {
  return (
    <span
      className={`ui-chip${className ? ` ${className}` : ""}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        minHeight: 34,
        padding: "7px 12px",
        borderRadius: 999,
        background: color + "14",
        border: `1px solid ${color}33`,
        color,
        fontSize: 12,
        fontWeight: 800,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type UiIconTokenProps = {
  children: ReactNode;
  color?: string;
  active?: boolean;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function UiIconToken({
  children,
  color = "#2CB8AD",
  active = false,
  size = 34,
  className = "",
  style = {},
}: UiIconTokenProps) {
  return (
    <span
      className={`ui-icon-token${className ? ` ${className}` : ""}`}
      style={{
        width: size,
        height: size > 34 ? size : 28,
        minWidth: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        background: active ? `${color}22` : "#F4F6FB",
        color: active ? color : "#64748B",
        fontSize: 11,
        fontWeight: 900,
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type UiMiniButtonProps = {
  children: ReactNode;
  color?: string;
  tone?: "soft" | "solid" | "ghost" | "danger";
  className?: string;
  style?: CSSProperties;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function UiMiniButton({
  children,
  color = "#2CB8AD",
  tone = "soft",
  className = "",
  style = {},
  ...props
}: UiMiniButtonProps) {
  const toneStyles: Record<string, CSSProperties> = {
    soft: {
      background: `${color}14`,
      color,
      border: `1px solid ${color}33`,
    },
    solid: {
      background: color,
      color: "#fff",
      border: "1px solid transparent",
      boxShadow: `0 6px 16px ${color}22`,
    },
    ghost: {
      background: "transparent",
      color,
      border: `1px solid ${color}22`,
    },
    danger: {
      background: "#FEF2F2",
      color: "#EF4444",
      border: "1px solid #FECACA",
    },
  };

  return (
    <button
      className={`ui-mini-button${className ? ` ${className}` : ""}`}
      style={{
        minHeight: 34,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 11,
        padding: "7px 12px",
        fontSize: 12,
        fontWeight: 800,
        cursor: props.disabled ? "not-allowed" : "pointer",
        ...toneStyles[tone],
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

type EmptyStateProps = {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function EmptyState({ icon, title, description, action, className = "", style = {} }: EmptyStateProps) {
  return (
    <div
      className={`ui-empty-state${className ? ` ${className}` : ""}`}
      style={{
        textAlign: "center",
        padding: "28px 18px",
        color: "#64748B",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 18,
        boxShadow: "0 1px 3px rgba(28,53,87,0.06)",
        ...style,
      }}
    >
      {icon && <div className="ui-empty-state-icon" style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>}
      {title && <div className="ui-empty-state-title" style={{ fontWeight: 800, fontSize: 15, color: "#1C3557", marginBottom: 8 }}>{title}</div>}
      {description && <div className="ui-empty-state-description" style={{ fontSize: 13, lineHeight: 1.6 }}>{description}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

type LoadingStateProps = {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function LoadingState({
  icon = "...",
  title = "Cargando",
  description = "Estamos preparando esta vista.",
  className = "",
  style = {},
}: LoadingStateProps) {
  return (
    <div
      className={`ui-loading-state${className ? ` ${className}` : ""}`}
      style={{
        textAlign: "center",
        padding: "30px 20px",
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 18,
        color: "#64748B",
        boxShadow: "0 10px 28px rgba(28,53,87,0.06)",
        ...style,
      }}
    >
      <div className="ui-loading-state-icon" style={{ fontSize: 28, marginBottom: 10, fontWeight: 800, color: "#2CB8AD" }}>{icon}</div>
      <div className="ui-loading-state-title" style={{ fontSize: 15, fontWeight: 800, color: "#1C3557", marginBottom: 6 }}>{title}</div>
      <div className="ui-loading-state-description" style={{ fontSize: 13, lineHeight: 1.6 }}>{description}</div>
    </div>
  );
}

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  style?: CSSProperties;
};

export function SectionHeader({ title, description, action, className = "", style = {} }: SectionHeaderProps) {
  return (
    <div
      className={`ui-section-header${className ? ` ${className}` : ""}`}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 14,
        marginBottom: 20,
        ...style,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: description ? 4 : 0 }}>{title}</h2>
        {description && <p style={{ color: "#64748B", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{description}</p>}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

type PetAvatarProps = {
  src?: string | null;
  breed?: string | null;
  size?: number;
  className?: string;
  style?: CSSProperties;
  imgStyle?: CSSProperties;
  fallbackFontSize?: number;
};

export function PetAvatar({
  src,
  breed,
  size = 52,
  className = "",
  style = {},
  imgStyle = {},
  fallbackFontSize,
}: PetAvatarProps) {
  const isCat = breed?.toLowerCase().includes("gato") || breed?.toLowerCase().includes("cat");
  const fallback = isCat ? "\uD83D\uDC31" : "\uD83D\uDC15";

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "#E5F7F6",
        border: "2px solid #B2E8E5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        ...style,
      }}
    >
      {src ? (
        <img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", ...imgStyle }} />
      ) : (
        <span style={{ fontSize: fallbackFontSize ?? Math.round(size * 0.48), lineHeight: 1 }}>{fallback}</span>
      )}
    </div>
  );
}
