import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";
import Nav from "../../components/Nav";
import Footer from "../../components/Footer";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)", card: "rgba(255,255,255,0.03)", cardHover: "rgba(255,255,255,0.06)",
};

export default function SehirDetay() {
  const router = useRouter();
  const { slug } = router.query;
  const [sehir, setSehir] = useState(null);
  const [yemekler, setYemekler] = useState([]);
  const [restoranlar, setRestoranlar] = useState([]);
  const [sefler, setSefler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState("yemekler");
  const [paylasMenuAcik, setPaylasMenuAcik] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getir();
  }, [slug]);

  async function getir() {
    const { data: s } = await supabase.from("sehirler").select("*").eq("slug", slug).single();
    if (!s) return;
    setSehir(s);
    const [y, r, sf] = await Promise.all([
      supabase.from("yemekler").select("*").eq("sehir_id", s.id).eq("aktif", true).order("ad"),
      supabase.from("restoranlar").select("*").eq("sehir_id", s.id).eq("aktif", true).order("premium", { ascending: false }),
      supabase.from("sefler").select("*").eq("sehir_id", s.id).eq("aktif", true),
    ]);
    setYemekler(y.data || []);
    setRestoranlar(r.data || []);
    setSefler(sf.data || []);
  }

  function paylas(platform) {
    const url = window.location.href;
    const text = `${sehir.ad} Mutfağı - Filtresiz Gastronomi`;
    if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    else if (platform === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    else if (platform === "kopyala") {
      navigator.clipboard.writeText(url);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }
    setPaylasMenuAcik(false);
  }

  if (!sehir) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: `2px solid #e8000d`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{margin:0}`}</style>
    </div>
  );

  const sekmeler = [
    { key: "yemekler", label: "Yemekler", sayi: yemekler.length, icon: "🍽️" },
    { key: "restoranlar", label: "Restoranlar", sayi: restoranlar.length, icon: "🏪" },
    { key: "sefler", label: "Şefler", sayi: sefler.length, icon: "👨‍🍳" },
    { key: "hikaye", label: "Hikaye", sayi: null, icon: "📖" },
  ];

  // En popüler yemek (ilk sıradaki)
  const enPopulerYemek = yemekler[0];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      {/* Hero */}
      <div style={{ position: "relative", height: 520, marginTop: 53 }}>
        {sehir.fotograf_url
          ? <img src={sehir.fotograf_url} alt={sehir.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(232,0,13,0.2), #0a0a0a)" }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.4) 50%, rgba(8,8,8,0.2) 100%)" }} />
        
        {/* Paylaş butonu */}
        <div style={{ position: "absolute", top: 24, right: 24 }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => setPaylasMenuAcik(!paylasMenuAcik)} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.15)", color: C.white, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ↗
            </button>
            {paylasMenuAcik && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#1a1a1a", border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", minWidth: 160, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}>
                <div onClick={() => paylas("twitter")} style={paylasItemStyle}>🐦 Twitter</div>
                <div onClick={() => paylas("whatsapp")} style={paylasItemStyle}>💬 WhatsApp</div>
                <div onClick={() => paylas("kopyala")} style={paylasItemStyle}>{kopyalandi ? "✓ Kopyalandı!" : "🔗 Linki Kopyala"}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 48 }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div onClick={() => router.push("/sehirler")} style={{ fontSize: 10, color: C.red, letterSpacing: "0.2em", marginBottom: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              ← TÜM ŞEHİRLER
            </div>
            <h1 style={{ margin: "0 0 12px", fontSize: "clamp(44px, 8vw, 80px)", fontWeight: 900, fontFamily: "'Georgia', serif", lineHeight: 1 }}>{sehir.ad}</h1>
            {sehir.kapat_etiketi && <div style={{ fontSize: 13, color: C.dim, letterSpacing: "0.08em", marginBottom: 24 }}>{sehir.kapat_etiketi}</div>}
            
            {/* İstatistikler */}
            <div style={{ display: "flex", gap: 40, flexWrap: "wrap" }}>
              {[
                [yemekler.length, "Yöresel Yemek", "🍽️"],
                [restoranlar.length, "Restoran", "🏪"],
                [sefler.length, "Şef", "👨‍🍳"],
              ].map(([sayi, etiket, icon]) => (
                <div key={etiket} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28, opacity: 0.8 }}>{icon}</div>
                  <div>
                    <span style={{ fontSize: 28, fontWeight: 800, color: C.white }}>{sayi}</span>
                    <span style={{ fontSize: 13, color: C.dim, marginLeft: 8 }}>{etiket}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* En Popüler Yemek Highlight */}
      {enPopulerYemek && (
        <div style={{ background: "rgba(232,0,13,0.04)", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", border: `2px solid ${C.red}` }}>
                {enPopulerYemek.fotograf_url 
                  ? <img src={enPopulerYemek.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>🍽️</div>
                }
              </div>
              <div>
                <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.15em", marginBottom: 4 }}>⭐ MUTLAKA DENEYİN</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{enPopulerYemek.ad}</div>
              </div>
            </div>
            <button onClick={() => router.push(`/yemek/${enPopulerYemek.slug}`)} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${C.red}`, color: C.red, fontSize: 11, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4, fontWeight: 600 }}
              onMouseEnter={e => { e.target.style.background = C.red; e.target.style.color = C.white; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = C.red; }}>
              KEŞFET →
            </button>
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div style={{ borderBottom: `1px solid ${C.border}`, position: "sticky", top: 53, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px", display: "flex" }}>
          {sekmeler.map(({ key, label, sayi, icon }) => (
            <div key={key} onClick={() => setAktifSekme(key)} style={{ padding: "16px 24px", cursor: "pointer", fontSize: 12, letterSpacing: "0.08em", color: aktifSekme === key ? C.white : C.dim, borderBottom: aktifSekme === key ? `2px solid ${C.red}` : "2px solid transparent", transition: "all 0.2s", marginBottom: -1, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label.toUpperCase()}
              {sayi !== null && <span style={{ fontSize: 10, background: aktifSekme === key ? C.red : "rgba(255,255,255,0.08)", color: C.white, padding: "2px 8px", borderRadius: 10 }}>{sayi}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 48px 80px" }}>

        {/* Yemekler */}
        {aktifSekme === "yemekler" && (
          yemekler.length === 0 ? <BosIcerik mesaj="Bu şehre henüz yemek eklenmemiş." icon="🍽️" /> : (
            <div>
              <p style={{ fontSize: 14, color: C.dim, marginBottom: 32 }}>{sehir.ad} mutfağından {yemekler.length} yöresel lezzet</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {yemekler.map(y => <YemekKarti key={y.id} yemek={y} onClick={() => router.push(`/yemek/${y.slug}`)} />)}
              </div>
            </div>
          )
        )}

        {/* Restoranlar */}
        {aktifSekme === "restoranlar" && (
          restoranlar.length === 0 ? <BosIcerik mesaj="Bu şehirde henüz restoran eklenmemiş." icon="🏪" /> : (
            <div>
              <p style={{ fontSize: 14, color: C.dim, marginBottom: 32 }}>{sehir.ad}'da {restoranlar.length} restoran</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {restoranlar.map(r => <RestoranKarti key={r.id} restoran={r} onClick={() => router.push(`/restoran/${r.slug}`)} />)}
              </div>
            </div>
          )
        )}

        {/* Şefler */}
        {aktifSekme === "sefler" && (
          sefler.length === 0 ? <BosIcerik mesaj="Bu şehre henüz şef eklenmemiş." icon="👨‍🍳" /> : (
            <div>
              <p style={{ fontSize: 14, color: C.dim, marginBottom: 32 }}>{sehir.ad}'dan {sefler.length} usta şef</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
                {sefler.map(sf => <SefKarti key={sf.id} sef={sf} onClick={() => router.push(`/sef/${sf.slug}`)} />)}
              </div>
            </div>
          )
        )}

        {/* Hikaye */}
        {aktifSekme === "hikaye" && (
          <div style={{ maxWidth: 800 }}>
            {sehir.aciklama && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>GASTRONOMİ KİMLİĞİ</h2>
                <p style={{ fontSize: 17, color: C.dim, lineHeight: 1.9 }}>{sehir.aciklama}</p>
              </div>
            )}
            {sehir.tarihce && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>TARİHÇE</h2>
                <p style={{ fontSize: 17, color: C.dim, lineHeight: 1.9 }}>{sehir.tarihce}</p>
              </div>
            )}
            {sehir.ozellikler && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>MUTFAK ÖZELLİKLERİ</h2>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {sehir.ozellikler.split(",").map((o, i) => (
                    <span key={i} style={{ padding: "10px 18px", background: "rgba(232,0,13,0.08)", border: `1px solid rgba(232,0,13,0.2)`, borderRadius: 24, fontSize: 13, color: C.white }}>
                      {o.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!sehir.aciklama && !sehir.tarihce && !sehir.ozellikler && <BosIcerik mesaj="Bu şehir için henüz hikaye yazılmamış." icon="📖" />}
          </div>
        )}
      </div>

      {/* Harita */}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: "64px 48px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 8 }}>📍 KONUM</h3>
          <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Georgia', serif", marginBottom: 32 }}>{sehir.ad}, Türkiye</h2>
          <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}`, height: 400 }}>
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(sehir.ad + ", Türkiye")}&output=embed`}
            />
          </div>
        </div>
      </div>

      <Footer />
      <style>{`* { box-sizing: border-box; } body { margin: 0; }`}</style>
    </div>
  );
}

function YemekKarti({ yemek, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s" }}>
      <div style={{ height: 180, overflow: "hidden" }}>
        {yemek.fotograf_url
          ? <img src={yemek.fotograf_url} alt={yemek.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s" }} />
          : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>🍽️</div>
        }
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{yemek.ad}</div>
        {yemek.tag && <div style={{ fontSize: 10, color: C.red, marginTop: 5, letterSpacing: "0.08em" }}>{yemek.tag.toUpperCase()}</div>}
      </div>
    </div>
  );
}

function RestoranKarti({ restoran, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 16, padding: 16, borderRadius: 8, background: hover ? C.cardHover : C.card, border: `1px solid ${hover ? "rgba(232,0,13,0.2)" : C.border}`, transition: "all 0.2s", cursor: "pointer" }}>
      <div style={{ width: 80, height: 80, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
        {restoran.fotograf_url ? <img src={restoran.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏪</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{restoran.ad}</div>
          {restoran.premium && <span style={{ fontSize: 9, padding: "3px 8px", background: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24", color: "#fbbf24", borderRadius: 4 }}>⭐</span>}
        </div>
        {restoran.adres && <div style={{ fontSize: 12, color: C.dim, marginTop: 6, lineHeight: 1.4 }}>📍 {restoran.adres}</div>}
        {restoran.telefon && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>📞 {restoran.telefon}</div>}
      </div>
    </div>
  );
}

function SefKarti({ sef, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ textAlign: "center", padding: "28px 20px", borderRadius: 8, background: hover ? C.cardHover : C.card, border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, cursor: "pointer", transition: "all 0.25s" }}>
      <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: `3px solid ${hover ? C.red : "rgba(232,0,13,0.3)"}`, transition: "all 0.3s" }}>
        {sef.fotograf_url ? <img src={sef.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>👨‍🍳</div>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{sef.ad}</div>
      {sef.unvan && <div style={{ fontSize: 11, color: C.red, marginTop: 6, letterSpacing: "0.06em" }}>{sef.unvan}</div>}
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

const paylasItemStyle = {
  padding: "12px 16px",
  fontSize: 13,
  color: "rgba(255,255,255,0.8)",
  cursor: "pointer",
  transition: "background 0.15s",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
};