import { useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.08)",
};

export default function GirisSayfasi() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", sifre: "" });
  const [hata, setHata] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  async function girisYap(e) {
    e.preventDefault();
    setHata(""); setYukleniyor(true);
    let email = form.email;

    if (!email.includes("@")) {
      const { data: k } = await supabase.from("kullanicilar").select("email").eq("kullanici_adi", email).single();
      if (!k) { setHata("Kullanıcı bulunamadı."); setYukleniyor(false); return; }
      email = k.email;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password: form.sifre });
    if (error) { setHata("E-posta, kullanıcı adı veya şifre hatalı."); setYukleniyor(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: k } = await supabase.from("kullanicilar").select("rol").eq("id", user.id).single();
    if (k?.rol === "admin" || k?.rol === "editor") {
      router.push("/filtresizpanel");
    } else {
      router.push(router.query.redirect || "/");
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px" }}>
        <div onClick={() => router.push("/")} style={{ cursor: "pointer", marginBottom: 48 }}>
          <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "0.1em", color: C.white, fontFamily: "'Georgia', serif" }}>FİLTRESİZ </span>
          <span style={{ fontSize: 18, fontWeight: 300, color: C.red, fontFamily: "'Georgia', serif" }}>GASTRONOMİ</span>
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: C.white }}>Hoş geldin</h1>
        <p style={{ margin: "0 0 40px", fontSize: 14, color: C.dim }}>
          Hesabın yok mu? <span onClick={() => router.push("/kayit")} style={{ color: C.red, cursor: "pointer" }}>Kayıt ol</span>
        </p>

        <form onSubmit={girisYap}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>E-POSTA VEYA KULLANICI ADI</label>
            <input type="text" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required style={inputStyle} placeholder="ornek@mail.com" />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>ŞİFRE</label>
            <input type="password" value={form.sifre} onChange={e => setForm({ ...form, sifre: e.target.value })} required style={inputStyle} placeholder="••••••••" />
          </div>
          <div style={{ textAlign: "right", marginBottom: 28 }}>
            <span style={{ fontSize: 12, color: C.dim, cursor: "pointer" }}>Şifreni mi unuttun?</span>
          </div>
          {hata && <div style={{ padding: "12px 16px", background: "rgba(232,0,13,0.08)", border: "1px solid rgba(232,0,13,0.25)", borderRadius: 2, fontSize: 13, color: "#ff6b6b", marginBottom: 20 }}>{hata}</div>}
          <button type="submit" disabled={yukleniyor} style={{ width: "100%", padding: "14px", background: yukleniyor ? "rgba(232,0,13,0.5)" : C.red, border: "none", color: C.white, fontSize: 13, letterSpacing: "0.15em", fontWeight: 700, cursor: yukleniyor ? "default" : "pointer", borderRadius: 2, fontFamily: "inherit" }}>
            {yukleniyor ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
          </button>
        </form>

        <div onClick={() => router.push("/")} style={{ marginTop: 48, textAlign: "center", fontSize: 12, color: C.muted, cursor: "pointer" }}>← Ana sayfaya dön</div>
      </div>
      <style>{`* { box-sizing: border-box; } body { margin: 0; } input::placeholder { color: rgba(255,255,255,0.25); } input:focus { border-color: rgba(232,0,13,0.5) !important; outline: none; }`}</style>
    </div>
  );
}

const labelStyle = { fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", padding: "12px 14px", fontSize: 14, fontFamily: "inherit", outline: "none", borderRadius: 2, transition: "border-color 0.2s", boxSizing: "border-box" };