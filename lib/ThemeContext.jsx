import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

// =====================================================
// TEMA RENKLERİ
// =====================================================
export const TEMALAR = {
  dark: {
    // Ana renkler
    bg: "#1a1a1a",
    bgAlt: "#242424",
    bgSecondary: "#141414",
    bgCard: "rgba(255,255,255,0.03)",
    bgInput: "rgba(255,255,255,0.05)",
    card: "rgba(255,255,255,0.03)",
    cardHover: "rgba(255,255,255,0.06)",
    
    // Metin
    text: "#ffffff",
    white: "#ffffff",
    dim: "rgba(255,255,255,0.55)",
    muted: "rgba(255,255,255,0.25)",
    textDim: "rgba(255,255,255,0.55)",
    textMuted: "rgba(255,255,255,0.25)",
    
    // Border
    border: "rgba(255,255,255,0.07)",
    borderInput: "rgba(255,255,255,0.1)",
    
    // Diğer
    sidebar: "#111111",
    hover: "rgba(255,255,255,0.04)",
    tableAlt: "rgba(255,255,255,0.01)",
    shadow: "rgba(0,0,0,0.3)",
    
    // Status
    success: "#00c850",
    successBg: "rgba(0,200,80,0.08)",
    errorBg: "rgba(232,0,13,0.08)",
    
    // Nav için özel
    navBg: "rgba(26,26,26,0.95)",
    navBgTransparent: "transparent",
    
    // Hero & filter bar
    heroBg: "linear-gradient(180deg, #1a0000 0%, #0d0d0d 100%)",
    filterBg: "#0d0d0d",
    inputBg: "rgba(255,255,255,0.06)",
    overlayBg: "rgba(0,0,0,0.7)",
    
    // Index page
    gridLine: "rgba(255,255,255,0.015)",
    sectionBg: "rgba(255,255,255,0.012)",
    blockBg: "rgba(255,255,255,0.06)",
    subtleBg: "rgba(255,255,255,0.02)",
    tabInactive: "rgba(255,255,255,0.1)",
  },
  light: {
    // Ana renkler
    bg: "#fdfbf7",
    bgAlt: "#f5f0e8",
    bgSecondary: "#ffffff",
    bgCard: "#ffffff",
    bgInput: "#ffffff",
    card: "#ffffff",
    cardHover: "rgba(0,0,0,0.02)",
    
    // Metin
    text: "#2d2d2d",
    white: "#2d2d2d",
    dim: "rgba(0,0,0,0.60)",
    muted: "rgba(0,0,0,0.35)",
    textDim: "rgba(0,0,0,0.60)",
    textMuted: "rgba(0,0,0,0.35)",
    
    // Border
    border: "rgba(0,0,0,0.08)",
    borderInput: "rgba(0,0,0,0.12)",
    
    // Diğer
    sidebar: "#1a1a1a",
    hover: "rgba(0,0,0,0.03)",
    tableAlt: "rgba(0,0,0,0.015)",
    shadow: "rgba(0,0,0,0.08)",
    
    // Status
    success: "#00a040",
    successBg: "rgba(0,160,64,0.08)",
    errorBg: "rgba(232,0,13,0.06)",
    
    // Nav için özel
    navBg: "rgba(253,251,247,0.95)",
    navBgTransparent: "transparent",
    
    // Hero & filter bar
    heroBg: "linear-gradient(180deg, #f5ede8 0%, #fdfbf7 100%)",
    filterBg: "#ffffff",
    inputBg: "rgba(0,0,0,0.04)",
    overlayBg: "rgba(0,0,0,0.55)",
    
    // Index page
    gridLine: "rgba(0,0,0,0.04)",
    sectionBg: "rgba(0,0,0,0.02)",
    blockBg: "rgba(0,0,0,0.04)",
    subtleBg: "rgba(0,0,0,0.02)",
    tabInactive: "rgba(0,0,0,0.06)",
  }
};

// Kırmızı her iki temada da aynı
const RED = "#e8000d";

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // localStorage'dan kontrol
    const kayitli = localStorage.getItem("fg-tema");
    if (kayitli && TEMALAR[kayitli]) {
      setTema(kayitli);
    } else {
      // Sistem tercihine bak
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTema(prefersDark ? "dark" : "light");
    }
  }, []);

  function temaDegistir() {
    const yeni = tema === "dark" ? "light" : "dark";
    setTema(yeni);
    localStorage.setItem("fg-tema", yeni);
  }

  const r = TEMALAR[tema];
  const isDark = tema === "dark";

  return (
    <ThemeContext.Provider value={{ tema, temaDegistir, renkler: r, isDark, mounted }}>
      <style>{`
        :root {
          --bg: ${r.bg};
          --bg-alt: ${r.bgAlt};
          --bg-secondary: ${r.bgSecondary};
          --bg-card: ${r.bgCard};
          --bg-input: ${r.bgInput};
          --card: ${r.card};
          --card-hover: ${r.cardHover};
          
          --text: ${r.text};
          --white: ${r.white};
          --dim: ${r.dim};
          --muted: ${r.muted};
          --text-dim: ${r.textDim};
          --text-muted: ${r.textMuted};
          
          --border: ${r.border};
          --border-input: ${r.borderInput};
          
          --red: ${RED};
          --sidebar: ${r.sidebar};
          --hover: ${r.hover};
          --table-alt: ${r.tableAlt};
          --shadow: ${r.shadow};
          
          --success: ${r.success};
          --success-bg: ${r.successBg};
          --error-bg: ${r.errorBg};
          
          --nav-bg: ${r.navBg};
          
          --hero-bg: ${r.heroBg};
          --filter-bg: ${r.filterBg};
          --input-bg: ${r.inputBg};
          --overlay-bg: ${r.overlayBg};
          --grid-line: ${r.gridLine};
          --section-bg: ${r.sectionBg};
          --block-bg: ${r.blockBg};
          --subtle-bg: ${r.subtleBg};
          --tab-inactive: ${r.tabInactive};
        }
        
        *, *::before, *::after { box-sizing: border-box; }
        
        body { 
          margin: 0; 
          background: var(--bg); 
          color: var(--text); 
          font-family: system-ui, -apple-system, sans-serif; 
          transition: background 0.3s ease, color 0.3s ease; 
        }
        
        input, textarea, select { 
          font-family: inherit; 
        }
        
        input::placeholder, textarea::placeholder { 
          color: var(--text-muted); 
        }
        
        select option { 
          background: var(--bg-secondary); 
          color: var(--text); 
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--bg);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: var(--muted);
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  const context = useContext(ThemeContext);
  if (!context) {
    // SSR fallback
    return { 
      tema: "dark", 
      temaDegistir: () => {}, 
      renkler: TEMALAR.dark,
      isDark: true,
      mounted: false
    };
  }
  return context;
}

export function TemaToggle({ style }) {
  const { tema, temaDegistir, mounted } = useTema();
  
  // SSR sırasında placeholder göster
  if (!mounted) {
    return (
      <div style={{
        width: 70, height: 28, borderRadius: 20,
        background: "rgba(255,255,255,0.05)",
        ...style
      }} />
    );
  }
  
  return (
    <button 
      onClick={temaDegistir} 
      title={tema === "dark" ? "Açık temaya geç" : "Koyu temaya geç"} 
      style={{
        background: tema === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
        border: "1px solid var(--border)",
        borderRadius: 20, 
        padding: "5px 12px", 
        cursor: "pointer",
        fontSize: 13, 
        color: "var(--dim)",
        display: "flex", 
        alignItems: "center", 
        gap: 6,
        transition: "all 0.2s",
        ...style
      }}
      onMouseEnter={e => { 
        e.currentTarget.style.borderColor = "#e8000d"; 
        e.currentTarget.style.color = "#e8000d"; 
        e.currentTarget.style.background = tema === "dark" ? "rgba(232,0,13,0.1)" : "rgba(232,0,13,0.05)";
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.borderColor = "var(--border)"; 
        e.currentTarget.style.color = "var(--dim)"; 
        e.currentTarget.style.background = tema === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
      }}
    >
      <span style={{ fontSize: 14 }}>{tema === "dark" ? "☀️" : "🌙"}</span>
      <span style={{ fontSize: 9, letterSpacing: "0.1em", fontWeight: 600 }}>
        {tema === "dark" ? "AÇIK" : "KOYU"}
      </span>
    </button>
  );
}
