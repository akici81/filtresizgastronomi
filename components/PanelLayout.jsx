import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import { TemaToggle } from "../lib/ThemeContext";

const tumMenuler = [
  { key: "sehirler",    href: "/filtresizpanel/sehirler",    label: "Şehirler",    icon: "🗺️" },
  { key: "yemekler",    href: "/filtresizpanel/yemekler",    label: "Yemekler",    icon: "🍽️" },
  { key: "restoranlar", href: "/filtresizpanel/restoranlar", label: "Restoranlar", icon: "🏪" },
  { key: "sefler",      href: "/filtresizpanel/sefler",      label: "Şefler",      icon: "👨‍🍳" },
  { key: "galeri",      href: "/filtresizpanel/galeri",      label: "Galeri",      icon: "📸" },
];

export default function PanelLayout({ children, baslik }) {
  const router = useRouter();
  const [kullanici, setKullanici] = useState(null);
  const [izinler, setIzinler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    async function kontrol() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/filtresizpanel/giris"); return; }
      const { data: profil } = await supabase.from("kullanicilar").select("*, panel_izinleri").eq("id", user.id).single();
      if (!profil || !["admin", "editor"].includes(profil.rol)) { router.push("/filtresizpanel/giris"); return; }
      setKullanici(profil);
      setIzinler(profil.rol === "admin" ? tumMenuler.map(m => m.key) : (profil.panel_izinleri || []));
      setYukleniyor(false);
    }
    kontrol();
  }, []);

  if (yukleniyor) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "2px solid var(--red)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const gorunenMenuler = tumMenuler.filter(m => izinler.includes(m.key));

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 240, background: "var(--sidebar)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", color: "#ffffff" }}>FİLTRESİZ</div>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--red)", marginTop: 2 }}>GASTRONOMİ · İÇERİK PANELİ</div>
        </div>

        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {[{ href: "/filtresizpanel", label: "Dashboard", icon: "📊", key: "dashboard" }, ...gorunenMenuler].map(item => {
            const aktif = item.key === "dashboard" ? router.pathname === "/filtresizpanel" : router.pathname.startsWith(item.href);
            return (
              <div key={item.key} onClick={() => router.push(item.href)} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "11px 20px", cursor: "pointer",
                background: aktif ? "rgba(232,0,13,0.1)" : "transparent",
                borderLeft: aktif ? "2px solid var(--red)" : "2px solid transparent",
                color: aktif ? "#ffffff" : "rgba(255,255,255,0.5)",
                fontSize: 13, transition: "all 0.15s"
              }}
                onMouseEnter={e => { if (!aktif) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!aktif) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </div>
            );
          })}

          {gorunenMenuler.length === 0 && (
            <div style={{ padding: "20px", fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
              Henüz modül izniniz yok.
            </div>
          )}
        </nav>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "#ffffff", marginBottom: 2 }}>{kullanici?.ad || kullanici?.kullanici_adi || kullanici?.email}</div>
          <div style={{ fontSize: 10, color: "var(--red)", letterSpacing: "0.1em", marginBottom: 12 }}>{kullanici?.rol?.toUpperCase()}</div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push("/filtresizpanel/giris"); }} style={{
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.5)", padding: "6px 14px", fontSize: 11,
            cursor: "pointer", borderRadius: 2, width: "100%", fontFamily: "inherit"
          }}>Çıkış Yap</button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: "100vh" }}>
        {/* Topbar */}
        <div style={{ padding: "16px 40px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 50 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{baslik}</h1>
          <TemaToggle />
        </div>
        <div style={{ padding: "32px 40px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
