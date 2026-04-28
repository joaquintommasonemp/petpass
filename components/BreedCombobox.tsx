"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
}

export default function BreedCombobox({ value, onChange, options, placeholder = "Buscá o seleccioná una raza...", label }: Props) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery(value);
  }, [value, open]);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(opt: string) {
    onChange(opt);
    setOpen(false);
    setQuery(opt);
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {label && (
        <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 4 }}>{label}</label>
      )}
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(""); setOpen(true); }}
          placeholder={value || placeholder}
          style={{
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            borderRadius: 10,
            padding: "10px 38px 10px 14px",
            color: "#1C3557",
            width: "100%",
            fontSize: 14,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
        <span style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94A3B8",
          fontSize: 11,
          pointerEvents: "none",
          userSelect: "none",
        }}>▾</span>
      </div>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 200,
          maxHeight: 220,
          overflowY: "auto",
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 14px", fontSize: 13, color: "#94A3B8" }}>Sin resultados</div>
          ) : (
            filtered.map(opt => (
              <div
                key={opt}
                onMouseDown={e => { e.preventDefault(); select(opt); }}
                style={{
                  padding: "10px 14px",
                  fontSize: 13,
                  color: opt === value ? "#2CB8AD" : "#1C3557",
                  fontWeight: opt === value ? 700 : 400,
                  background: opt === value ? "#E5F7F6" : "transparent",
                  cursor: "pointer",
                  borderBottom: "1px solid #F8FAFC",
                }}
                onMouseEnter={e => { if (opt !== value) e.currentTarget.style.background = "#F4F6FB"; }}
                onMouseLeave={e => { e.currentTarget.style.background = opt === value ? "#E5F7F6" : "transparent"; }}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
