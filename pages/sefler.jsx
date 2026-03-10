import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)", card: "rgba(255,255,255,0.03)", cardHover: "rgba(255,255,255,0.06)",
};

export default function SeflerSayfasi() {
  const router = useRouter();
  const [sefler, setSefler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aramaMetni, setAramaMetni] = useState("");
  const [seciliSehir, setSeciliSehir] = useState("");

  useEffect(() => {
    supabase.from("sehirler").select("id,ad").eq("aktif", true).order("ad").then(({ data }) => setSehirler(data || []));
    getir();
  }, []);

  useEffect(() => { getir(); }, [aramaMetni, seciliSehir]);

  async function getir() {
    let q = supabase.from("sefler").select("*,sehirler(ad,slug)").eq("aktif", true);
    if (aramaMetni) q = q.ilike("ad", `%${aramaMetni}%`);
    if (seciliSehir) q = q.eq("sehir_id", seciliSehir);
    q = q.order("ad");
    const { data } = await q;
    setSefler(data || []);
    setYukleniyor(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />
      <div style={{ padding: "120px 48px 60px", background: "linear-gradient(180deg, rgba(232,0,13,0.05) 0%, transparent 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.red, marginBottom: 12 }}>✦ USTALAR</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 48, fontWeight: 900, fontFamily: "'Georgia', serif" }}>Şefler</h1>
          <p style={{ margin: 0, fontSize: 15, color: C.dim }}>Türk mutfağının ustaları</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 2, padding: "10px 14px", flex: 1, maxWidth: 320 }}>
            <span style={{ color: C.muted }}>🔍</span>
            <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="Şef ara..." style={{ background: "transparent", border: "none", color: C.white, fontSize: 13, fontFamily: "inherit", outline: "none", flex: 1 }} />
          </div>
          <select value={seciliSehir} onChange={e => setSeciliSehir(e.target.value)} style={selectStyle}>
            <option value="">Tüm Şehirler</option>
            {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </select>
        </div>

        {yukleniyor ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ height: 260, background: C.card, borderRadius: 4, border: `1px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : sefler.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
            <div>Henüz şef eklenmemiş.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
            {sefler.map(sf => (
              <div key={sf.id} onClick={() => router.push(`/sef/${sf.slug}`)} style={{ textAlign: "center", padding: "28px 20px", borderRadius: 4, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = "rgba(232,0,13,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "2px solid rgba(232,0,13,0.3)" }}>
                  {sf.fotograf_url ? <img src={sf.fotograf_url} alt={sf.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>👨‍🍳</div>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif", marginBottom: 6 }}>{sf.ad}</div>
                {sf.unvan && <div style={{ fontSize: 11, color: C.red, letterSpacing: "0.08em", marginBottom: 6 }}>{sf.unvan}</div>}
                {sf.sehirler?.ad && <div style={{ fontSize: 11, color: C.dim }}>📍 {sf.sehirler.ad}</div>}
                {sf.instagram && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>@{sf.instagram}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <style>{`* { box-sizing: border-box; } body { margin: 0; } input::placeholder { color: rgba(255,255,255,0.3); } option { background: #141414; } @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );
}

const selectStyle = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", padding: "10px 14px", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer", borderRadius: 2 };