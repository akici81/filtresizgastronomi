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

export default function ToplulukSayfasi() {
  const router = useRouter();
  const [yukleniyor, setYukleniyor] = useState(true);
  const [sonYorumlar, setSonYorumlar] = useState([]);
  const [yeniYemekler, setYeniYemekler] = useState([]);
  const [yeniRestoranlar, setYeniRestoranlar] = useState([]);
  const [enAktifSehirler, setEnAktifSehirler] = useState([]);
  const [istatistikler, setIstatistikler] = useState({ yemek: 0, restoran: 0, sef: 0, yorum: 0 });
  const [aktifSekme, setAktifSekme] = useState("akis");

  useEffect(() => {
    getir();
  }, []);

  async function getir() {
    setYukleniyor(true);
    
    const [yorumlar, yemekler, restoranlar, sehirler, yemekSayisi, restoranSayisi, sefSayisi, yorumSayisi] = await Promise.all([
      // Son yorumlar
      supabase.from("degerlendirmeler")
        .select("*, kullanicilar(ad, kullanici_adi), yemekler(ad, slug, fotograf_url), restoranlar(ad, slug, fotograf_url)")
        .order("olusturma_tarihi", { ascending: false })
        .limit(10),
      
      // Yeni eklenen yemekler
      supabase.from("yemekler")
        .select("*, sehirler(ad)")
        .eq("aktif", true)
        .order("olusturma_tarihi", { ascending: false })
        .limit(6),
      
      // Yeni eklenen restoranlar
      supabase.from("restoranlar")
        .select("*, sehirler(ad)")
        .eq("aktif", true)
        .order("olusturma_tarihi", { ascending: false })
        .limit(6),
      
      // En aktif şehirler (en çok yemeği olan)
      supabase.from("sehirler")
        .select("*, yemekler(id)")
        .eq("aktif", true)
        .limit(50),
      
      // İstatistikler
      supabase.from("yemekler").select("id", { count: "exact", head: true }).eq("aktif", true),
      supabase.from("restoranlar").select("id", { count: "exact", head: true }).eq("aktif", true),
      supabase.from("sefler").select("id", { count: "exact", head: true }).eq("aktif", true),
      supabase.from("degerlendirmeler").select("id", { count: "exact", head: true }),
    ]);

    setSonYorumlar(yorumlar.data || []);
    setYeniYemekler(yemekler.data || []);
    setYeniRestoranlar(restoranlar.data || []);
    
    // Şehirleri yemek sayısına göre sırala
    const sehirlerSirali = (sehirler.data || [])
      .map(s => ({ ...s, yemekSayisi: s.yemekler?.length || 0 }))
      .sort((a, b) => b.yemekSayisi - a.yemekSayisi)
      .slice(0, 8);
    setEnAktifSehirler(sehirlerSirali);
    
    setIstatistikler({
      yemek: yemekSayisi.count || 0,
      restoran: restoranSayisi.count || 0,
      sef: sefSayisi.count || 0,
      yorum: yorumSayisi.count || 0,
    });
    
    setYukleniyor(false);
  }

  function zamanOnce(tarih) {
    if (!tarih) return "";
    const simdi = new Date();
    const t = new Date(tarih);
    const fark = Math.floor((simdi - t) / 1000);
    if (fark < 60) return "Az önce";
    if (fark < 3600) return `${Math.floor(fark / 60)} dk önce`;
    if (fark < 86400) return `${Math.floor(fark / 3600)} saat önce`;
    if (fark < 604800) return `${Math.floor(fark / 86400)} gün önce`;
    return t.toLocaleDateString("tr-TR");
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      {/* Hero */}
      <div style={{ padding: "120px 48px 60px", background: "linear-gradient(180deg, rgba(232,0,13,0.06) 0%, transparent 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: C.red, marginBottom: 16 }}>✦ TOPLULUK</div>
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 900, fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>
            Gastronomi Tutkunları<br /><span style={{ color: C.red }}>Burada Buluşuyor</span>
          </h1>
          <p style={{ fontSize: 16, color: C.dim, lineHeight: 1.7, maxWidth: 500, margin: "0 auto" }}>
            Yemek deneyimlerini paylaş, yeni lezzetler keşfet, Türk mutfağının zenginliğini birlikte kutlayalım.
          </p>
        </div>
      </div>

      {/* İstatistikler */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 60 }}>
          {[
            { sayi: istatistikler.yemek, etiket: "Yemek", icon: "🍽️", renk: C.red },
            { sayi: istatistikler.restoran, etiket: "Restoran", icon: "🏪", renk: "#10b981" },
            { sayi: istatistikler.sef, etiket: "Şef", icon: "👨‍🍳", renk: "#f59e0b" },
            { sayi: istatistikler.yorum, etiket: "Değerlendirme", icon: "⭐", renk: "#8b5cf6" },
          ].map(item => (
            <div key={item.etiket} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: item.renk, fontFamily: "'Georgia', serif" }}>{item.sayi}</div>
              <div style={{ fontSize: 11, color: C.dim, letterSpacing: "0.1em", marginTop: 4 }}>{item.etiket.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{ borderBottom: `1px solid ${C.border}`, position: "sticky", top: 53, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", display: "flex", justifyContent: "center" }}>
          {[
            ["akis", "Aktivite Akışı", "🔥"],
            ["yemekler", "Yeni Yemekler", "🍽️"],
            ["restoranlar", "Yeni Restoranlar", "🏪"],
            ["sehirler", "Aktif Şehirler", "📍"],
          ].map(([key, label, icon]) => (
            <div key={key} onClick={() => setAktifSekme(key)} style={{ padding: "16px 28px", cursor: "pointer", fontSize: 12, letterSpacing: "0.08em", color: aktifSekme === key ? C.white : C.dim, borderBottom: aktifSekme === key ? `2px solid ${C.red}` : "2px solid transparent", transition: "all 0.2s", marginBottom: -1, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{icon}</span> {label.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 48px 80px" }}>
        
        {yukleniyor ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...Array(5)].map((_, i) => <div key={i} style={{ height: 100, background: C.card, borderRadius: 8, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : (
          <>
            {/* Aktivite Akışı */}
            {aktifSekme === "akis" && (
              <div style={{ maxWidth: 700, margin: "0 auto" }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 24 }}>SON AKTİVİTELER</h2>
                {sonYorumlar.length === 0 ? (
                  <BosIcerik mesaj="Henüz aktivite yok. İlk değerlendirmeyi sen yap!" icon="💬" />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {sonYorumlar.map((yorum, i) => (
                      <div key={yorum.id} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: i < sonYorumlar.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        {/* Avatar */}
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                          {(yorum.kullanicilar?.ad || yorum.kullanicilar?.kullanici_adi || "K")[0].toUpperCase()}
                        </div>
                        
                        {/* İçerik */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{yorum.kullanicilar?.ad || yorum.kullanicilar?.kullanici_adi || "Kullanıcı"}</span>
                            <span style={{ fontSize: 12, color: C.dim }}>değerlendirdi</span>
                            {yorum.yemekler ? (
                              <span onClick={() => router.push(`/yemek/${yorum.yemekler.slug}`)} style={{ fontSize: 13, color: C.red, cursor: "pointer", fontWeight: 600 }}>{yorum.yemekler.ad}</span>
                            ) : yorum.restoranlar ? (
                              <span onClick={() => router.push(`/restoran/${yorum.restoranlar.slug}`)} style={{ fontSize: 13, color: C.red, cursor: "pointer", fontWeight: 600 }}>{yorum.restoranlar.ad}</span>
                            ) : null}
                          </div>
                          
                          {/* Puan */}
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{ display: "flex", gap: 2 }}>
                              {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= yorum.puan ? "#fbbf24" : C.muted, fontSize: 14 }}>★</span>)}
                            </div>
                            <span style={{ fontSize: 11, color: C.muted }}>{zamanOnce(yorum.olusturma_tarihi)}</span>
                          </div>
                          
                          {/* Yorum */}
                          {yorum.yorum && (
                            <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, margin: 0 }}>"{yorum.yorum}"</p>
                          )}
                        </div>
                        
                        {/* Fotoğraf */}
                        {(yorum.yemekler?.fotograf_url || yorum.restoranlar?.fotograf_url) && (
                          <div style={{ width: 60, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                            <img src={yorum.yemekler?.fotograf_url || yorum.restoranlar?.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Yeni Yemekler */}
            {aktifSekme === "yemekler" && (
              <div>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 24 }}>YENİ EKLENEN YEMEKLER</h2>
                {yeniYemekler.length === 0 ? (
                  <BosIcerik mesaj="Henüz yemek eklenmemiş." icon="🍽️" />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                    {yeniYemekler.map(y => (
                      <YemekKart key={y.id} yemek={y} onClick={() => router.push(`/yemek/${y.slug}`)} zamanOnce={zamanOnce} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Yeni Restoranlar */}
            {aktifSekme === "restoranlar" && (
              <div>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 24 }}>YENİ EKLENEN RESTORANLAR</h2>
                {yeniRestoranlar.length === 0 ? (
                  <BosIcerik mesaj="Henüz restoran eklenmemiş." icon="🏪" />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
                    {yeniRestoranlar.map(r => (
                      <RestoranKart key={r.id} restoran={r} onClick={() => router.push(`/restoran/${r.slug}`)} zamanOnce={zamanOnce} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Aktif Şehirler */}
            {aktifSekme === "sehirler" && (
              <div>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 24 }}>EN AKTİF ŞEHİRLER</h2>
                {enAktifSehirler.length === 0 ? (
                  <BosIcerik mesaj="Henüz şehir eklenmemiş." icon="📍" />
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                    {enAktifSehirler.map((s, i) => (
                      <div key={s.id} onClick={() => router.push(`/sehir/${s.slug}`)} style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = "rgba(232,0,13,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.border; }}>
                        
                        {/* Sıra */}
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: i < 3 ? C.red : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: i < 3 ? C.white : C.dim }}>
                          {i + 1}
                        </div>
                        
                        {/* Bilgi */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{s.ad}</div>
                          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{s.yemekSayisi} yemek</div>
                        </div>
                        
                        {/* Fotoğraf */}
                        {s.fotograf_url && (
                          <div style={{ width: 48, height: 48, borderRadius: 6, overflow: "hidden" }}>
                            <img src={s.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "80px 48px", textAlign: "center", background: "rgba(232,0,13,0.03)" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h3 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Georgia', serif", marginBottom: 16 }}>Sen de Katıl</h3>
          <p style={{ color: C.dim, marginBottom: 32, lineHeight: 1.7 }}>
            Yemek deneyimlerini paylaş, restoran önerileri al, gastronomi tutkunlarıyla tanış.
          </p>
          <button onClick={() => router.push("/kayit")} style={{ background: C.red, border: "none", color: C.white, padding: "14px 36px", fontSize: 13, letterSpacing: "0.12em", cursor: "pointer", borderRadius: 6, fontFamily: "inherit", fontWeight: 700, boxShadow: "0 4px 20px rgba(232,0,13,0.3)" }}
            onMouseEnter={e => e.target.style.background = "#c8000b"}
            onMouseLeave={e => e.target.style.background = C.red}>
            HEMEN KAYIT OL
          </button>
        </div>
      </div>

      <Footer />
      <style>{`* { box-sizing: border-box; } body { margin: 0; } @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
    </div>
  );
}

function YemekKart({ yemek, onClick, zamanOnce }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s" }}>
      <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
        {yemek.fotograf_url ? (
          <img src={yemek.fotograf_url} alt={yemek.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🍽️</div>
        )}
        <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", color: C.white, fontSize: 9, padding: "4px 10px", borderRadius: 4, backdropFilter: "blur(10px)" }}>🆕 YENİ</span>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif", marginBottom: 4 }}>{yemek.ad}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {yemek.sehirler?.ad && <span style={{ fontSize: 11, color: C.red }}>📍 {yemek.sehirler.ad}</span>}
          <span style={{ fontSize: 10, color: C.muted }}>{zamanOnce(yemek.olusturma_tarihi)}</span>
        </div>
      </div>
    </div>
  );
}

function RestoranKart({ restoran, onClick, zamanOnce }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 16, padding: 16, borderRadius: 8, background: hover ? C.cardHover : C.card, border: `1px solid ${hover ? "rgba(232,0,13,0.2)" : C.border}`, cursor: "pointer", transition: "all 0.2s" }}>
      <div style={{ width: 80, height: 80, borderRadius: 6, overflow: "hidden", flexShrink: 0, position: "relative" }}>
        {restoran.fotograf_url ? (
          <img src={restoran.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏪</div>
        )}
        <span style={{ position: "absolute", top: 4, left: 4, background: C.red, color: C.white, fontSize: 7, padding: "2px 5px", borderRadius: 2 }}>YENİ</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif", marginBottom: 4 }}>{restoran.ad}</div>
        {restoran.sehirler?.ad && <div style={{ fontSize: 11, color: C.red, marginBottom: 6 }}>📍 {restoran.sehirler.ad}</div>}
        <div style={{ fontSize: 10, color: C.muted }}>{zamanOnce(restoran.olusturma_tarihi)}</div>
      </div>
    </div>
  );
}

function BosIcerik({ mesaj, icon = "📝" }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 15 }}>{mesaj}</div>
    </div>
  );
}