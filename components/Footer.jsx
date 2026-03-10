import { useRouter } from "next/router";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)",
};

export default function Footer() {
  const router = useRouter();

  const linkler = {
    kesfet: [
      ["Yemekler", "/yemekler"],
      ["Şehirler", "/sehirler"],
      ["Restoranlar", "/restoranlar"],
      ["Şefler", "/sefler"],
    ],
    topluluk: [
      ["Aktivite Akışı", "/topluluk"],
      ["Kayıt Ol", "/kayit"],
      ["Giriş Yap", "/giris"],
    ],
    kurumsal: [
      ["Hakkımızda", "/hakkimizda"],
      ["İletişim", "/iletisim"],
      ["Gizlilik Politikası", "/gizlilik"],
    ],
  };

  return (
    <footer style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: "64px 48px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Üst kısım */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          
          {/* Logo & Açıklama */}
          <div>
            <div onClick={() => router.push("/")} style={{ cursor: "pointer", marginBottom: 16 }}>
              <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.1em", color: C.white, fontFamily: "'Georgia', serif" }}>FİLTRESİZ</span>
              <span style={{ fontSize: 18, fontWeight: 300, color: C.red, marginLeft: 8, fontFamily: "'Georgia', serif" }}>GASTRONOMİ</span>
            </div>
            <p style={{ fontSize: 13, color: C.dim, lineHeight: 1.7, maxWidth: 280, margin: 0 }}>
              Türkiye'nin gastronomi hafızası. Yöresel lezzetleri keşfet, hikayeleri oku, deneyimlerini paylaş.
            </p>
            
            {/* Sosyal medya */}
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              {[
                ["📷", "https://instagram.com/filtresizgastronomi"],
                ["𝕏", "https://twitter.com/filtresizgastro"],
                ["📘", "https://facebook.com/filtresizgastronomi"],
              ].map(([icon, url]) => (
                <a key={icon} href={url} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 14, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.background = "rgba(232,0,13,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Keşfet */}
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.15em", color: C.red, marginBottom: 20, marginTop: 0 }}>KEŞFET</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {linkler.kesfet.map(([label, href]) => (
                <FooterLink key={label} label={label} href={href} router={router} />
              ))}
            </div>
          </div>

          {/* Topluluk */}
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.15em", color: C.red, marginBottom: 20, marginTop: 0 }}>TOPLULUK</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {linkler.topluluk.map(([label, href]) => (
                <FooterLink key={label} label={label} href={href} router={router} />
              ))}
            </div>
          </div>

          {/* Kurumsal */}
          <div>
            <h4 style={{ fontSize: 11, letterSpacing: "0.15em", color: C.red, marginBottom: 20, marginTop: 0 }}>KURUMSAL</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {linkler.kurumsal.map(([label, href]) => (
                <FooterLink key={label} label={label} href={href} router={router} />
              ))}
            </div>
          </div>
        </div>

        {/* Bülten */}
        <div style={{ background: "rgba(232,0,13,0.04)", border: `1px solid rgba(232,0,13,0.15)`, borderRadius: 8, padding: "24px 32px", marginBottom: 48, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: C.white }}>Gastronomi Bülteni</h4>
            <p style={{ margin: 0, fontSize: 13, color: C.dim }}>Yeni lezzetler ve öneriler için abone ol</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="email" placeholder="E-posta adresin" style={{ padding: "12px 16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 4, color: C.white, fontSize: 13, fontFamily: "inherit", outline: "none", width: 220 }} />
            <button style={{ padding: "12px 20px", background: C.red, border: "none", color: C.white, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4, fontWeight: 700, fontFamily: "inherit" }}
              onMouseEnter={e => e.target.style.background = "#c8000b"}
              onMouseLeave={e => e.target.style.background = C.red}>
              ABONE OL
            </button>
          </div>
        </div>

        {/* Alt kısım */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: `1px solid ${C.border}`, flexWrap: "wrap", gap: 16 }}>
          <div style={{ fontSize: 12, color: C.muted }}>
            © 2025 Filtresiz Gastronomi. Tüm hakları saklıdır.
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["Kullanım Şartları", "/kullanim-sartlari"], ["Gizlilik", "/gizlilik"], ["Çerez Politikası", "/cerezler"]].map(([label, href]) => (
              <span key={label} onClick={() => router.push(href)} style={{ fontSize: 11, color: C.muted, cursor: "pointer", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = C.white}
                onMouseLeave={e => e.target.style.color = C.muted}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.3); }
        @media (max-width: 900px) {
          footer > div > div:first-child { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }
        @media (max-width: 600px) {
          footer { padding: 40px 24px 24px !important; }
          footer > div > div:first-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}

function FooterLink({ label, href, router }) {
  return (
    <span onClick={() => router.push(href)} style={{ fontSize: 13, color: C.dim, cursor: "pointer", transition: "color 0.2s" }}
      onMouseEnter={e => e.target.style.color = C.white}
      onMouseLeave={e => e.target.style.color = C.dim}>
      {label}
    </span>
  );
}