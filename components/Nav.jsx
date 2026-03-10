import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)",
};

export default function Nav({ transparent }) {
  const router = useRouter();
  const [kullanici, setKullanici] = useState(null);
  const [profil, setProfil] = useState(null);
  const [menuAcik, setMenuAcik] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setKullanici(user);
      if (user) {
        const { data } = await supabase.from("kullanicilar").select("kullanici_adi, ad").eq("id", user.id).single();
        setProfil(data);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setKullanici(session?.user || null);
      if (session?.user) {
        const { data } = await supabase.from("kullanicilar").select("kullanici_adi, ad").eq("id", session.user.id).single();
        setProfil(data);
      } else {
        setProfil(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAcik(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function cikisYap() {
    await supabase.auth.signOut();
    setKullanici(null);
    setProfil(null);
    setMenuAcik(false);
    router.push("/");
  }

  const menuItems = [
    ["YEMEKLER", "/yemekler"],
    ["ŞEHİRLER", "/sehirler"],
    ["RESTORANLAR", "/restoranlar"],
    ["ŞEFLER", "/sefler"],
    ["TOPLULUK", "/topluluk"],
  ];

  return (
    <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 48px", height: 53, display: "flex", alignItems: "center", justifyContent: "space-between", background: transparent ? "transparent" : "rgba(8,8,8,0.95)", backdropFilter: transparent ? "none" : "blur(20px)", borderBottom: transparent ? "none" : `1px solid ${C.border}` }}>
      
      {/* Logo */}
      <div onClick={() => router.push("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.08em", color: C.white, fontFamily: "'Georgia', serif" }}>FİLTRESİZ</span>
        <span style={{ fontSize: 15, fontWeight: 300, color: C.red, fontFamily: "'Georgia', serif" }}>GASTRONOMİ</span>
      </div>

      {/* Menü */}
      <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {menuItems.map(([label, href]) => (
          <span key={label} onClick={() => router.push(href)} style={{ fontSize: 10, letterSpacing: "0.12em", color: router.pathname === href ? C.white : C.dim, cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = C.white}
            onMouseLeave={e => e.target.style.color = router.pathname === href ? C.white : C.dim}>
            {label}
          </span>
        ))}
      </div>

      {/* Sağ taraf */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {kullanici ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <div onClick={() => setMenuAcik(!menuAcik)} style={{ width: 36, height: 36, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700, color: C.white, border: "2px solid rgba(232,0,13,0.4)" }}>
              {(profil?.ad || profil?.kullanici_adi || kullanici.email || "K")[0].toUpperCase()}
            </div>
            {menuAcik && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#141414", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", minWidth: 180, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{profil?.ad || "Kullanıcı"}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>@{profil?.kullanici_adi || "kullanici"}</div>
                </div>
                <div onClick={() => { router.push(`/profil/${profil?.kullanici_adi || "me"}`); setMenuAcik(false); }} style={menuItemStyle}>👤 Profilim</div>
                <div onClick={() => { router.push("/filtresizpanel"); setMenuAcik(false); }} style={menuItemStyle}>📊 Panel</div>
                <div onClick={cikisYap} style={{ ...menuItemStyle, color: "#ef4444", borderTop: `1px solid ${C.border}` }}>🚪 Çıkış Yap</div>
              </div>
            )}
          </div>
        ) : (
          <>
            <button onClick={() => router.push("/giris")} style={{ background: "transparent", border: "none", color: C.dim, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit", padding: "8px 12px" }}
              onMouseEnter={e => e.target.style.color = C.white}
              onMouseLeave={e => e.target.style.color = C.dim}>
              GİRİŞ
            </button>
            <button onClick={() => router.push("/kayit")} style={{ background: C.red, border: "none", color: C.white, fontSize: 10, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit", padding: "8px 16px", borderRadius: 4, fontWeight: 700 }}
              onMouseEnter={e => e.target.style.background = "#c8000b"}
              onMouseLeave={e => e.target.style.background = C.red}>
              KAYIT OL
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const menuItemStyle = {
  padding: "12px 16px",
  fontSize: 13,
  color: "rgba(255,255,255,0.8)",
  cursor: "pointer",
  transition: "background 0.15s",
};