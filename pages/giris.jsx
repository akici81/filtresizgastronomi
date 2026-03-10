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
    setHata("");
    setYukleniyor(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.sifre,
    });

    if (error) {
      setHata(error.message === "Invalid login credentials" ? "E-posta veya şifre hatalı." : error.message);
      setYukleniyor(false);
      return;
    }

    // Kullanıcı rolünü kontrol et
    const { data: kullanici } = await supabase
      .from("kullanicilar")
      .select("rol")
      .eq("id", data.user.id)
      .single();

    if (kullanici?.rol === "admin") {
      router.push("/admin");
    } else if (kullanici?.rol === "panel") {
      router.push("/filtresizpanel");
    } else {
      router.push("/");
    }
  }

  const inputStyle = {
    width: "100%", padding: "14px 16px", fontSize: 15, background: "rgba(255,255,255,0.03)",
    border: "1px solid " + C.border, color: C.white, borderRadius: 4,
    fontFamily: "inherit", outline: "none", transition: "border-color 0.2s",
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 400, padding: "48px 32px" }}>

        {/* Logo / Başlık */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Georgia', serif", fontSize: 28, fontWeight: 700, color: C.white, margin: 0, letterSpacing: "-0.02em" }}>
            <span style={{ color: C.red }}>Filtresiz</span> Gastronomi
          </h1>
          <p style={{ color: C.dim, fontSize: 14, marginTop: 12 }}>Hesabına giriş yap</p>
        </div>

        {/* Form */}
        <form onSubmit={girisYap}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: C.dim, fontSize: 12, letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase" }}>E-posta</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
              placeholder="ornek@email.com"
              required
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: C.dim, fontSize: 12, letterSpacing: "0.05em", marginBottom: 8, textTransform: "uppercase" }}>Şifre</label>
            <input
              type="password"
              value={form.sifre}
              onChange={e => setForm({ ...form, sifre: e.target.value })}
              style={inputStyle}
              placeholder="••••••••"
              required
            />
          </div>

          {hata && (
            <div style={{ background: "rgba(232,0,13,0.1)", border: "1px solid rgba(232,0,13,0.3)", padding: "12px 16px", borderRadius: 4, marginBottom: 20 }}>
              <p style={{ color: C.red, fontSize: 13, margin: 0 }}>{hata}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={yukleniyor}
            style={{
              width: "100%", padding: "14px 24px", fontSize: 13, letterSpacing: "0.12em",
              background: yukleniyor ? C.muted : C.red, border: "none", color: C.white,
              cursor: yukleniyor ? "not-allowed" : "pointer", borderRadius: 4,
              fontFamily: "inherit", fontWeight: 700, transition: "background 0.2s",
              boxShadow: "0 4px 16px rgba(232,0,13,0.25)"
            }}
          >
            {yukleniyor ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
          </button>
        </form>

        {/* Alt linkler */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <p style={{ color: C.dim, fontSize: 14 }}>
            Hesabın yok mu?{" "}
            <span
              onClick={() => router.push("/kayit")}
              style={{ color: C.red, cursor: "pointer", fontWeight: 600 }}
            >
              Kayıt ol
            </span>
          </p>
        </div>

        {/* Ana sayfaya dön */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <span
            onClick={() => router.push("/")}
            style={{ color: C.muted, fontSize: 13, cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = C.white}
            onMouseLeave={e => e.target.style.color = C.muted}
          >
            ← Ana sayfaya dön
          </span>
        </div>

      </div>
    </div>
  );
}
