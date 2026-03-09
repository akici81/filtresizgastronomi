import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { mevcutKullanici, cikisYap } from "../lib/auth";

const RED = "#e8000d";
const BG = "#0f0f0f";
const SIDEBAR_BG = "#141414";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/sehirler", label: "Şehirler", icon: "🗺️" },
  { href: "/admin/yemekler", label: "Yemekler", icon: "🍽️" },
  { href: "/admin/restoranlar", label: "Restoranlar", icon: "🏪" },
  { href: "/admin/sefler", label: "Şefler", icon: "👨‍🍳" },
  { href: "/admin/kullanicilar", label: "Kullanıcılar", icon: "👥" },
];

export default function AdminLayout({ children, baslik }) {
  const router = useRouter();
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    mevcutKullanici().then(k => {
      if (!k || !["admin", "editor"].includes(k.rol)) {
        router.push("/admin/giris");
        return;
      }
      setKullanici(k);
      setYukleniyor(false);
    });
  }, []);

  if (yukleniyor) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "2px solid " + RED, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: BG, fontFamily: "system-ui, sans-serif" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 240, background: SIDEBAR_BG, borderRight: "1px solid " + BORDER, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0 }}>
        {/* Logo */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid " + BORDER }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", color: WHITE }}>FİLTRESİZ</div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: RED, marginTop: 2 }}>GASTRONOMİ · PANEL</div>
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {menuItems.map(item => {
            const aktif = router.pathname === item.href || router.pathname.startsWith(item.href + "/");
            return (
              <div key={item.href} onClick={() => router.push(item.href)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 20px", cursor: "pointer",
                background: aktif ? "rgba(232,0,13,0.08)" : "transparent",
                borderLeft: aktif ? "2px solid " + RED : "2px solid transparent",
                color: aktif ? WHITE : WHITE_DIM,
                fontSize: 13, transition: "all 0.15s"
              }}
                onMouseEnter={e => { if (!aktif) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { if (!aktif) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}
        </nav>

        {/* Kullanıcı */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid " + BORDER }}>
          <div style={{ fontSize: 12, color: WHITE, marginBottom: 2 }}>{kullanici?.ad || kullanici?.email}</div>
          <div style={{ fontSize: 10, color: RED, letterSpacing: "0.1em", marginBottom: 12 }}>{kullanici?.rol?.toUpperCase()}</div>
          <button onClick={() => cikisYap().then(() => router.push("/admin/giris"))} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: WHITE_DIM, padding: "6px 14px", fontSize: 11, cursor: "pointer",
            borderRadius: 2, width: "100%", fontFamily: "inherit"
          }}>Çıkış Yap</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 240, flex: 1, padding: "32px 40px" }}>
        {baslik && (
          <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: "1px solid " + BORDER }}>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: WHITE }}>{baslik}</h1>
          </div>
        )}
        {children}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; color: ${WHITE}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
