import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const TEMALAR = {
  dark: {
    renkler: {
      bg: "#0a0a0a", bgSecondary: "#141414", bgCard: "rgba(255,255,255,0.03)",
      bgInput: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)",
      borderInput: "rgba(255,255,255,0.1)", text: "#ffffff",
      textDim: "rgba(255,255,255,0.5)", textMuted: "rgba(255,255,255,0.25)",
      sidebar: "#111111", hover: "rgba(255,255,255,0.04)",
      tableAlt: "rgba(255,255,255,0.01)", success: "#00c850",
      successBg: "rgba(0,200,80,0.08)", errorBg: "rgba(232,0,13,0.08)",
    }
  },
  light: {
    renkler: {
      bg: "#f4f4f4", bgSecondary: "#ffffff", bgCard: "#ffffff",
      bgInput: "#ffffff", border: "rgba(0,0,0,0.08)",
      borderInput: "rgba(0,0,0,0.15)", text: "#111111",
      textDim: "rgba(0,0,0,0.5)", textMuted: "rgba(0,0,0,0.3)",
      sidebar: "#1a1a1a", hover: "rgba(0,0,0,0.03)",
      tableAlt: "rgba(0,0,0,0.015)", success: "#00a040",
      successBg: "rgba(0,160,64,0.08)", errorBg: "rgba(232,0,13,0.06)",
    }
  }
};

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState("dark");

  useEffect(() => {
    const kayitli = localStorage.getItem("fg-tema");
    if (kayitli && TEMALAR[kayitli]) setTema(kayitli);
  }, []);

  function temaDegistir() {
    const yeni = tema === "dark" ? "light" : "dark";
    setTema(yeni);
    localStorage.setItem("fg-tema", yeni);
  }

  const r = TEMALAR[tema].renkler;

  return (
    <ThemeContext.Provider value={{ tema, temaDegistir, renkler: r }}>
      <style>{`
        :root {
          --bg: ${r.bg};
          --bg-secondary: ${r.bgSecondary};
          --bg-card: ${r.bgCard};
          --bg-input: ${r.bgInput};
          --border: ${r.border};
          --border-input: ${r.borderInput};
          --text: ${r.text};
          --text-dim: ${r.textDim};
          --text-muted: ${r.textMuted};
          --red: #e8000d;
          --sidebar: ${r.sidebar};
          --hover: ${r.hover};
          --table-alt: ${r.tableAlt};
          --success: ${r.success};
          --success-bg: ${r.successBg};
          --error-bg: ${r.errorBg};
        }
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; transition: background 0.25s, color 0.25s; }
        input, textarea, select { font-family: inherit; }
        input::placeholder, textarea::placeholder { color: var(--text-muted); }
        select option { background: ${r.bgSecondary}; color: ${r.text}; }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  return useContext(ThemeContext);
}

export function TemaToggle({ style }) {
  const { tema, temaDegistir } = useTema();
  return (
    <button onClick={temaDegistir} title={tema === "dark" ? "Açık temaya geç" : "Koyu temaya geç"} style={{
      background: "transparent", border: "1px solid var(--border)",
      borderRadius: 20, padding: "5px 12px", cursor: "pointer",
      fontSize: 13, color: "var(--text-dim)",
      display: "flex", alignItems: "center", gap: 6,
      transition: "all 0.2s", ...style
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#e8000d"; e.currentTarget.style.color = "#e8000d"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-dim)"; }}
    >
      <span>{tema === "dark" ? "☀️" : "🌙"}</span>
      <span style={{ fontSize: 10, letterSpacing: "0.08em" }}>{tema === "dark" ? "AÇIK" : "KOYU"}</span>
    </button>
  );
}
