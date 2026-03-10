import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.08)",
};

export default function KayitSayfasi() {
  const router = useRouter();
  const [form, setForm] = useState({ ad: "", kullanici_adi: "", email: "", sifre: "", sifre2: "" });
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);

  async function kayitOl(e) {
    e.preventDefault();
    setHata("");
    if (form.sifre !== form.sifre2) { setHata("Şifreler eşleşmiyor."); return; }
    if (form.sifre.length < 6) { setHata("Şifre en az 6 karakter olmalı."); return; }
    if (!/^[a-z0-9_]+$/.test(form.kullanici_adi)) { setHata("Kullanıcı adı sadece küçük harf, rakam ve _ içerebilir."); return; }
    setYukleniyor(true);

    const { data: mevcut } = await supabase.from("kullanicilar").select("id").eq("kullanici_adi", form.kullanici_adi).single();
    if (mevcut) { setHata("Bu kullanıcı adı alınmış."); setYukleniyor(false); return; }

    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.sifre });
    if (error) { setHata(error.message); setYukleniyor(false); return; }

    await supabase.from("kullanicilar").upsert({
      id: data.user.id, email: form.email,
      ad: form.ad, kullanici_adi: form.kullanici_adi.toLowerCase(), rol: "uye",
    });

    setBasari(true);
    setYukleniyor(false);
  }

  if (basari) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 48 }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🎉</div>
        <h2 style={{ color: C.white, fontFamily: "'Georgia', serif", fontSize: 28, marginBottom: 16 }}>Hoş geldin!</h2>
        <p style={{ color: C.dim, lineHeight: 1.7, marginBottom: 32 }}>Hesabın oluşturuldu. E-posta adresini doğruladıktan sonra giriş yapabilirsin.</p>
        <button onClick={() => router.push("/giris")} style={{ background: C.red, border: "none", color: C.white, padding: "12px 32px", fontSize: 13, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2, fontFamily: "inherit", fontWeight: 700 }}>GİRİŞ YAP</button>
      </div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px" }}>
        <div onClick={() => router.push("/")} style={{ cursor: "pointer", marginBottom: 48 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.1em", color: C.white, fontFamily: "'Georgia', serif" }}>FİLTRESİZ </span>
          <span style={{ fontSize: 18, fontWeight: 300, color: C.red, fontFamily: "'Georgia', serif" }}>GASTRONOMİ</span>
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: C.white }}>Hesap oluştur</h1>
        <p style={{ margin: "0 0 40px", fontSize: 14, color: C.dim }}>
          Zaten hesabın var mı? <span onClick={() => router.push("/giris")} style={{ color: C.red, cursor: "pointer" }}>Giriş yap</span>
        </p>

        <form onSubmit={kayitOl}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>AD SOYAD</label>
              <input type="text" value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} required style={inputStyle} placeholder="Adınız" />
            </div>
            <div>
              <label style={labelStyle}>KULLANICI ADI</label>
              <input type="text" value={form.kullanici_adi} onChange={e => setForm({ ...form, kullanici_adi: e.target.value.toLowerCase() })} required style={inputStyle} placeholder="kullanici_adi" />
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>E-POSTA</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} placeholder="ornek@mail.com" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 8 }}>
            <div>
              <label style={labelStyle}>ŞİFRE</label>
              <input type="password" value={form.sifre} onChange={e => setForm({ ...form, sifre: e.target.value })} required style={inputStyle} placeholder="Min. 6 karakter" />
            </div>
            <div>
              <label style={labelStyle}>ŞİFRE (TEKRAR)</label>
              <input type="password" value={form.sifre2} onChange={e => setForm({ ...form, sifre2: e.target.value })} required style={inputStyle} placeholder="••••••••" />
            </div>
          </div>
          {hata && <div style={{ padding: "12px 16px", background: "rgba(232,0,13,0.08)", border: "1px solid rgba(232,0,13,0.25)", borderRadius: 2, fontSize: 13, color: "#ff6b6b", margin: "16px 0" }}>{hata}</div>}
          <div style={{ margin: "20px 0", fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            Kayıt olarak <span style={{ color: C.dim }}>Kullanım Şartları</span> ve <span style={{ color: C.dim }}>Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
          </div>
          <button type="submit" disabled={yukleniyor} style={{ width: "100%", padding: "14px", background: yukleniyor ? "rgba(232,0,13,0.5)" : C.red, border: "none", color: C.white, fontSize: 13, letterSpacing: "0.15em", fontWeight: 700, cursor: yukleniyor ? "default" : "pointer", borderRadius: 2, fontFamily: "inherit" }}>
            {yukleniyor ? "HESAP OLUŞTURULUYOR..." : "KAYIT OL"}
          </button>
        </form>
      </div>
      <style>{`* { box-sizing: border-box; } body { margin: 0; } input::placeholder { color: rgba(255,255,255,0.25); } input:focus { border-color: rgba(232,0,13,0.5) !important; outline: none; }`}</style>
    </div>
  );
}

const labelStyle = { fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", padding: "12px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", borderRadius: 2, transition: "border-color 0.2s", boxSizing: "border-box" };