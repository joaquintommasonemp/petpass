"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";

type Result = { icon: string; title: string; sub: string; href: string };

const searchInputStyle: CSSProperties = {
  width: 260,
  paddingLeft: 36,
  paddingRight: 12,
  paddingTop: 8,
  paddingBottom: 8,
  background: "#F4F6FB",
  border: "1px solid #E2E8F0",
  borderRadius: 10,
  fontSize: 13,
  color: "#1C3557",
};

const dropdownStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 6px)",
  left: 0,
  background: "#FFFFFF",
  border: "1px solid #E2E8F0",
  zIndex: 300,
};

const resultIconStyle: CSSProperties = {
  fontSize: 18,
  flexShrink: 0,
  width: 34,
  height: 34,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#F4F6FB",
  borderRadius: 8,
};

function buildResults({
  mascotas,
  historial,
  vacunas,
}: {
  mascotas: any[] | null;
  historial: any[] | null;
  vacunas: any[] | null;
}) {
  return [
    ...(mascotas || []).map((mascota) => ({
      icon: mascota.breed?.toLowerCase().includes("gato") ? "\uD83D\uDC31" : "\uD83D\uDC3E",
      title: mascota.name,
      sub: mascota.breed || "Mascota",
      href: "/dashboard",
    })),
    ...(historial || []).map((item) => ({
      icon: "\uD83C\uDFE5",
      title: item.title,
      sub: `Historial - ${item.date || ""}`,
      href: "/dashboard/historial",
    })),
    ...(vacunas || []).map((vacuna) => ({
      icon: "\uD83D\uDC89",
      title: vacuna.name,
      sub: `Vacuna - ${vacuna.date || ""}`,
      href: "/dashboard/historial",
    })),
  ] satisfies Result[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setSearching(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSearching(false);
      return;
    }

    const [{ data: mascotas }, { data: historial }, { data: vacunas }] = await Promise.all([
      supabase.from("mascotas").select("id, name, breed, photo_url").eq("user_id", user.id).ilike("name", `%${q}%`).eq("active", true).limit(3),
      supabase.from("historial").select("id, title, date, mascota_id").ilike("title", `%${q}%`).limit(4),
      supabase.from("vacunas").select("id, name, date").ilike("name", `%${q}%`).limit(3),
    ]);

    setResults(buildResults({ mascotas, historial, vacunas }));
    setOpen(true);
    setSearching(false);
  }, [supabase]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 280);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: Result) {
    router.push(result.href);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, pointerEvents: "none", opacity: 0.5,
        }}>{"\uD83D\uDD0D"}</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Buscar mascota, vacuna o consulta..."
          style={searchInputStyle}
        />
        {searching && (
          <span style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            fontSize: 11, color: "#94A3B8",
          }}>...</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{ ...dropdownStyle, width: 320, borderRadius: 16, boxShadow: "0 8px 40px rgba(28,53,87,0.14)", overflow: "hidden" }}>
          {results.map((result, index) => (
            <div
              key={`${result.href}-${result.title}-${index}`}
              onMouseDown={() => handleSelect(result)}
              style={{
                display: "flex", gap: 12, padding: "11px 16px",
                cursor: "pointer", alignItems: "center",
                borderBottom: index < results.length - 1 ? "1px solid #F8FAFC" : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={resultIconStyle}>{result.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1C3557", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {result.title}
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{result.sub}</div>
              </div>
              <span style={{ fontSize: 11, color: "#CBD5E1", flexShrink: 0 }}>&rarr;</span>
            </div>
          ))}

          <div style={{ padding: "8px 16px 10px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 10, color: "#CBD5E1", fontWeight: 600 }}>
              {results.length} resultado{results.length !== 1 ? "s" : ""} - Toc&aacute; para abrir
            </div>
          </div>
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !searching && (
        <div style={{ ...dropdownStyle, width: 280, borderRadius: 14, boxShadow: "0 8px 32px rgba(28,53,87,0.10)", padding: "20px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>{"\uD83D\uDD0D"}</div>
          <div style={{ fontSize: 13, color: "#64748B" }}>
            No encontramos resultados para <strong>{query}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
