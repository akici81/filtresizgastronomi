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

export default function AraSayfasi() {
  const router = useRouter();
  const { q } = router.query;
  const [sonuclar, setSonuclar] = useState({ yemekler: [], sehirler: [], restoranlar: [], sefler: [] });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aktifTip, setAktifTip] = useState("hepsi");

  useEffect(() => {
    if (!q || q.length < 2) return;
    ara();
  }, [q]);

  async function ara() {
    setYukleniyor(true);
    const [y, s, r, sf] = await Promise.all([
      supabase.from("yemekler").select("id,ad,slug,fotograf_url,sehirler(ad),tag").ilike("ad", `%${q}%`).eq("aktif", true).limit(12),
      supabase.from("sehirler").select("id,ad,slug,fotograf_url").ilike("ad", `%${q}%`).eq("aktif", true).limit(8),
      supabase.from("restoranlar").select("id,ad,slug,fotograf_url,sehirler(ad)").ilike("ad", `%${q}%`).eq("aktif", true).limit(12),
      supabase.from("sefler").select("id,ad,slug,fotograf_url,unvan,sehirler(ad)").ilike("ad", `%${q}%`).eq("aktif", true).limit(8),
    ]);
    setSonuclar({ yemekler: y.data || [], sehirler: s.data || [], restoranlar: r.data || [], sefler: sf.data || [] });
    setYukleniyor(false);
  }

  const toplam = sonuclar.yemekler.length + sonuclar.sehirler.length + sonuclar.restoranlar.length + sonuclar.sefler.length;
  const tipIcon = { yemek: "🍽️", sehir: "🗺️", restoran: "🏪", sef: "👨‍🍳" };
  const urlMap = { yemek: "yemek", sehir: "sehir", restoran: "restoran", sef: "sef" };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />
      <div style={{ padding: "120px 48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: 11, color: C.dim, marginBottom: 8 }}>Arama sonuçları:</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 36, fontWeight: 900, fontFamily: "'Georgia', serif" }}>"{q}"</h1>
          <div style={{ fontSize: 14, color: C.dim }}>{yukleniyor ? "Aranıyor..." : `${toplam} sonuç`}</div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
          {[["hepsi", `Tümü (${toplam})`], ["yemekler", `Yemekler (${sonuclar.yemekler.length})`], ["sehirler", `Şehirler (${sonuclar.sehirler.length})`], ["restoranlar", `Restoranlar (${sonuclar.restoranlar.length})`], ["sefler", `Şefler (${sonuclar.sefler.length})`]].map(([key, label]) => (
            <div key={key} onClick={() => setAktifTip(key)} style={{ fontSize: 12, padding: "7px 16px", borderRadius: 20, cursor: "pointer", border: `1px solid ${aktifTip === key ? C.red : C.border}`, color: aktifTip === key ? C.white : C.dim, background: aktifTip === key ? "rgba(232,0,13,0.1)" : "transparent", transition: "all 0.2s" }}>{label}</div>
          ))}
        </div>

        {yukleniyor ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {[...Array(8)].map((_, i) => <div key={i} style={{ height: 80, background: C.card, borderRadius: 4, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : toplam === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Sonuç bulunamadı</div>
            <div style={{ fontSize: 14 }}>Farklı bir arama deneyin</div>
          </div>
        ) : (
          <div>
            {(aktifTip === "hepsi" || aktifTip === "yemekler") && sonuclar.yemekler.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 16 }}>YEMEKLER</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {sonuclar.yemekler.map(item => <SonucKart key={item.id} item={item} tip="yemek" onClick={() => router.push(`/yemek/${item.slug}`)} tipIcon={tipIcon} />)}
                </div>
              </div>
            )}
            {(aktifTip === "hepsi" || aktifTip === "sehirler") && sonuclar.sehirler.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 16 }}>ŞEHİRLER</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {sonuclar.sehirler.map(item => <SonucKart key={item.id} item={item} tip="sehir" onClick={() => router.push(`/sehir/${item.slug}`)} tipIcon={tipIcon} />)}
                </div>
              </div>
            )}
            {(aktifTip === "hepsi" || aktifTip === "restoranlar") && sonuclar.restoranlar.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 16 }}>RESTORANLAR</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {sonuclar.restoranlar.map(item => <SonucKart key={item.id} item={item} tip="restoran" onClick={() => router.push(`/restoran/${item.slug}`)} tipIcon={tipIcon} />)}
                </div>
              </div>
            )}
            {(aktifTip === "hepsi" || aktifTip === "sefler") && sonuclar.sefler.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 16 }}>ŞEFLER</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {sonuclar.sefler.map(item => <SonucKart key={item.id} item={item} tip="sef" onClick={() => router.push(`/sef/${item.slug}`)} tipIcon={tipIcon} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
      <style>{`* { box-sizing: border-box; } body { margin: 0; } @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );
}

function SonucKart({ item, tip, onClick, tipIcon }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 14, padding: 14, borderRadius: 4, background: hover ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${hover ? "rgba(232,0,13,0.2)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", transition: "all 0.2s" }}>
      <div style={{ width: 52, height: 52, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
        {item.fotograf_url ? <img src={item.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{tipIcon[tip]}</div>}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", fontFamily: "'Georgia', serif" }}>{item.ad}</div>
        <div style={{ fontSize: 11, color: "#e8000d", marginTop: 3 }}>{item.sehirler?.ad || item.unvan || ""}</div>
      </div>
    </div>
  );
}