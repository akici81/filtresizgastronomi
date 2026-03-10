import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";

const RED = "#e8000d";
const BG = "#0a0a0a";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.1)";

export default function PanelGiris() {
  const router = useRouter();
  const [kimlik, setKimlik] = useState("");
  const [sifre, setSifre] = useState("");
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function handleGiris() {
    setHata("");
    if (!kimlik || !sifre) { setHata("Tüm alanları doldurun."); return; }
    setYukleniyor(true);

    let girisMail = kimlik;

    if (!kimlik.includes("@")) {
      const { data, error } = await supabase
        .from("kullanicilar")
        .select("email")
        .eq("kullanici_adi", kimlik)
        .single();
      if (error || !data) { setHata("Kullanıcı bulunamadı."); setYukleniyor(false); return; }
      girisMail = data.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: girisMail, password: sifre });
    if (error) { setHata("Kullanıcı adı/e-posta veya şifre hatalı."); setYukleniyor(false); return; }
    router.push("/filtresizpanel");
  }

  return (
    <div style={{
      background: BG, minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ width: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.1em", color: WHITE }}>FİLTRESİZ</span>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.1em", color: WHITE }}> GASTRONOMİ</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: WHITE_DIM, marginTop: 8 }}>İÇERİK PANELİ</div>
        </div>

        {/* Form */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid " + BORDER, borderRadius: 4, padding: "32px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM, marginBottom: 8 }}>
              KULLANICI ADI VEYA E-POSTA
            </label>
            <input
              value={kimlik} onChange={e => setKimlik(e.target.value)}
              placeholder="kullanici_adi veya email@ornek.com"
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "10px 14px", color: WHITE, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM, marginBottom: 8 }}>
              ŞİFRE
            </label>
            <input
              type="password" value={sifre} onChange={e => setSifre(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGiris()}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "10px 14px", color: WHITE, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = RED}
              onBlur={e => e.target.style.borderColor = BORDER}
            />
          </div>

          {hata && <div style={{ fontSize: 13, color: RED, marginBottom: 16 }}>{hata}</div>}

          <button onClick={handleGiris} disabled={yukleniyor} style={{
            width: "100%", background: RED, border: "none", color: WHITE,
            padding: "13px", fontSize: 12, letterSpacing: "0.15em", cursor: "pointer",
            borderRadius: 2, fontFamily: "inherit", fontWeight: 700,
            opacity: yukleniyor ? 0.7 : 1
          }}>
            {yukleniyor ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
          </button>
        </div>

        <div onClick={() => router.push("/")} style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: WHITE_DIM, cursor: "pointer" }}>
          ← Siteye Dön
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}