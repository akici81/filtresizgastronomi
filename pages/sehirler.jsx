import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)", card: "rgba(255,255,255,0.03)",
};

const BOLGELER = {
  "Tümü": [],
  "Marmara": ["İstanbul", "Bursa", "Edirne", "Tekirdağ", "Kocaeli", "Balıkesir", "Çanakkale", "Yalova", "Sakarya", "Bilecik"],
  "Ege": ["İzmir", "Muğla", "Aydın", "Denizli", "Manisa", "Uşak", "Kütahya", "Afyonkarahisar"],
  "Akdeniz": ["Antalya", "Mersin", "Adana", "Hatay", "Gaziantep", "Kahramanmaraş", "Osmaniye", "Isparta", "Burdur"],
  "İç Anadolu": ["Ankara", "Konya", "Kayseri", "Sivas", "Nevşehir", "Aksaray", "Niğde", "Karaman", "Kırıkkale", "Kırşehir", "Yozgat", "Çankırı", "Eskişehir"],
  "Karadeniz": ["Trabzon", "Samsun", "Ordu", "Giresun", "Rize", "Artvin", "Kastamonu", "Sinop", "Bartın", "Zonguldak", "Bolu", "Düzce", "Amasya", "Tokat"],
  "Güneydoğu": ["Şanlıurfa", "Diyarbakır", "Mardin", "Siirt", "Batman", "Şırnak", "Adıyaman", "Kilis"],
  "Doğu Anadolu": ["Erzurum", "Malatya", "Van", "Ağrı", "Kars", "Ardahan", "Elazığ", "Bingöl", "Bitlis", "Hakkari", "Iğdır", "Muş", "Tunceli"],
};

export default function SehirlerSayfasi() {
  const router = useRouter();
  const [sehirler, setSehirler] = useState([]);
  const [filtreliSehirler, setFiltreliSehirler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [aktifBolge, setAktifBolge] = useState("Tümü");
  const [aramaMetni, setAramaMetni] = useState("");

  useEffect(() => {
    supabase.from("sehirler").select("*").eq("aktif", true).order("ad").then(({ data }) => {
      setSehirler(data || []);
      setFiltreliSehirler(data || []);
      setYukleniyor(false);
    });
  }, []);

  useEffect(() => {
    let sonuc = sehirler;
    if (aktifBolge !== "Tümü") {
      const liste = BOLGELER[aktifBolge];
      sonuc = sonuc.filter(s => liste.some(b => s.ad.includes(b)));
    }
    if (aramaMetni) sonuc = sonuc.filter(s => s.ad.toLowerCase().includes(aramaMetni.toLowerCase()));
    setFiltreliSehirler(sonuc);
  }, [aktifBolge, aramaMetni, sehirler]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      <div style={{ padding: "120px 48px 60px", background: "linear-gradient(180deg, rgba(232,0,13,0.05) 0%, transparent 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.red, marginBottom: 12 }}>✦ TÜRKİYE</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 48, fontWeight: 900, fontFamily: "'Georgia', serif" }}>81 Şehir, 81 Lezzet</h1>
          <p style={{ margin: 0, fontSize: 15, color: C.dim }}>Her şehrin kendine özgü mutfak kültürünü keşfedin</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 80px" }}>
        {/* Arama */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 2, padding: "10px 14px", flex: 1, maxWidth: 340 }}>
            <span style={{ color: C.muted }}>🔍</span>
            <input value={aramaMetni} onChange={e => setAramaMetni(e.target.value)} placeholder="Şehir ara..." style={{ background: "transparent", border: "none", color: C.white, fontSize: 13, fontFamily: "inherit", outline: "none", flex: 1 }} />
          </div>
          <div style={{ fontSize: 13, color: C.dim }}>{filtreliSehirler.length} şehir</div>
        </div>

        {/* Bölge filtreleri */}
        <div style={{ display: "flex", gap: 8, marginBottom: 48, flexWrap: "wrap" }}>
          {Object.keys(BOLGELER).map(bolge => (
            <div key={bolge} onClick={() => setAktifBolge(bolge)} style={{ fontSize: 11, padding: "7px 16px", borderRadius: 20, cursor: "pointer", border: `1px solid ${aktifBolge === bolge ? C.red : C.border}`, color: aktifBolge === bolge ? C.white : C.dim, background: aktifBolge === bolge ? "rgba(232,0,13,0.1)" : "transparent", transition: "all 0.2s", letterSpacing: "0.05em" }}>
              {bolge.toUpperCase()}
            </div>
          ))}
        </div>

        {/* Grid */}
        {yukleniyor ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {[...Array(12)].map((_, i) => <div key={i} style={{ height: 200, background: C.card, borderRadius: 4, border: `1px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : filtreliSehirler.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺️</div>
            <div>Bu bölgede henüz şehir eklenmemiş.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filtreliSehirler.map(s => <SehirKarti key={s.id} sehir={s} onClick={() => router.push(`/sehir/${s.slug}`)} />)}
          </div>
        )}
      </div>

      <Footer />
      <style>{`* { box-sizing: border-box; } body { margin: 0; } input::placeholder { color: rgba(255,255,255,0.3); } @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
    </div>
  );
}

function SehirKarti({ sehir, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ position: "relative", height: 200, borderRadius: 4, overflow: "hidden", cursor: "pointer", border: `1px solid ${hover ? "rgba(232,0,13,0.4)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.25s" }}>
      {sehir.fotograf_url
        ? <img src={sehir.fotograf_url} alt={sehir.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.08)" : "scale(1)", transition: "transform 0.5s" }} />
        : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(232,0,13,0.2), rgba(0,0,0,0.9))` }} />
      }
      <div style={{ position: "absolute", inset: 0, background: hover ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.52)", transition: "all 0.3s" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 20 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: "#ffffff", fontFamily: "'Georgia', serif" }}>{sehir.ad}</div>
        {sehir.kapat_etiketi && <div style={{ fontSize: 10, color: "#e8000d", letterSpacing: "0.1em", marginTop: 3 }}>{sehir.kapat_etiketi.toUpperCase()}</div>}
      </div>
    </div>
  );
}