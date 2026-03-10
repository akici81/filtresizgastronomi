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

export default function SefDetay() {
  const router = useRouter();
  const { slug } = router.query;
  const [sef, setSef] = useState(null);
  const [restoranlar, setRestoranlar] = useState([]);
  const [yemekler, setYemekler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState("hakkinda");

  useEffect(() => {
    if (!slug) return;
    getir();
  }, [slug]);

  async function getir() {
    const { data: s } = await supabase.from("sefler").select("*,sehirler(id,ad,slug)").eq("slug", slug).single();
    if (!s) return;
    setSef(s);

    // Şefin restoranları (eğer restoran_id varsa veya şehirdeki restoranlar)
    const [r, y] = await Promise.all([
      supabase.from("restoranlar").select("*,sehirler(ad)").eq("sehir_id", s.sehir_id).eq("aktif", true).limit(6),
      supabase.from("yemekler").select("*,sehirler(ad)").eq("sehir_id", s.sehir_id).eq("aktif", true).limit(8),
    ]);
    setRestoranlar(r.data || []);
    setYemekler(y.data || []);
  }

  if (!sef) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: `2px solid #e8000d`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{margin:0}`}</style>
    </div>
  );

  const sekmeler = [
    { key: "hakkinda", label: "Hakkında" },
    { key: "yemekler", label: "Yöresel Yemekler", sayi: yemekler.length },
    { key: "restoranlar", label: "Restoranlar", sayi: restoranlar.length },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      {/* Hero */}
      <div style={{ position: "relative", marginTop: 53, padding: "80px 48px 60px", background: "linear-gradient(180deg, rgba(232,0,13,0.06) 0%, transparent 100%)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 48, alignItems: "flex-start" }}>
          
          {/* Fotoğraf */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 180, height: 180, borderRadius: "50%", overflow: "hidden", border: `4px solid rgba(232,0,13,0.3)`, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
              {sef.fotograf_url 
                ? <img src={sef.fotograf_url} alt={sef.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(232,0,13,0.2), #141414)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64 }}>👨‍🍳</div>
              }
            </div>
          </div>

          {/* Bilgiler */}
          <div style={{ flex: 1 }}>
            <div onClick={() => router.push("/sefler")} style={{ fontSize: 10, color: C.red, letterSpacing: "0.2em", marginBottom: 12, cursor: "pointer" }}>
              ✦ ŞEFLER
            </div>
            <h1 style={{ margin: "0 0 8px", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>
              {sef.ad}
            </h1>
            {sef.unvan && (
              <div style={{ fontSize: 16, color: C.red, letterSpacing: "0.05em", marginBottom: 16 }}>
                {sef.unvan}
              </div>
            )}
            
            {/* Meta bilgiler */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
              {sef.sehirler && (
                <div onClick={() => router.push(`/sehir/${sef.sehirler.slug}`)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.dim, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.color = C.white}
                  onMouseLeave={e => e.currentTarget.style.color = C.dim}>
                  <span>📍</span> {sef.sehirler.ad}
                </div>
              )}
              {sef.deneyim_yili && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.dim }}>
                  <span>⏱️</span> {sef.deneyim_yili} yıl deneyim
                </div>
              )}
              {sef.restoran && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.dim }}>
                  <span>🏪</span> {sef.restoran}
                </div>
              )}
            </div>

            {/* Sosyal medya */}
            <div style={{ display: "flex", gap: 12 }}>
              {sef.instagram && (
                <a href={`https://instagram.com/${sef.instagram}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 2, color: C.dim, fontSize: 12, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#E1306C"; e.currentTarget.style.color = "#E1306C"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}>
                  <span>📷</span> @{sef.instagram}
                </a>
              )}
              {sef.twitter && (
                <a href={`https://twitter.com/${sef.twitter}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 2, color: C.dim, fontSize: 12, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#1DA1F2"; e.currentTarget.style.color = "#1DA1F2"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}>
                  <span>𝕏</span> @{sef.twitter}
                </a>
              )}
              {sef.website && (
                <a href={sef.website} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 2, color: C.dim, fontSize: 12, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.white; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.dim; }}>
                  <span>🌐</span> Web Sitesi
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{ borderBottom: `1px solid ${C.border}`, position: "sticky", top: 53, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", display: "flex" }}>
          {sekmeler.map(({ key, label, sayi }) => (
            <div key={key} onClick={() => setAktifSekme(key)} style={{ padding: "16px 24px", cursor: "pointer", fontSize: 12, letterSpacing: "0.08em", color: aktifSekme === key ? C.white : C.dim, borderBottom: aktifSekme === key ? `2px solid ${C.red}` : "2px solid transparent", transition: "all 0.2s", marginBottom: -1, display: "flex", alignItems: "center", gap: 8 }}>
              {label.toUpperCase()}
              {sayi !== undefined && <span style={{ fontSize: 10, background: aktifSekme === key ? C.red : "rgba(255,255,255,0.08)", color: C.white, padding: "1px 6px", borderRadius: 10 }}>{sayi}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px 80px" }}>

        {/* Hakkında */}
        {aktifSekme === "hakkinda" && (
          <div style={{ maxWidth: 760 }}>
            {sef.biyografi ? (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>BİYOGRAFİ</h2>
                <p style={{ fontSize: 16, color: C.dim, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{sef.biyografi}</p>
              </div>
            ) : null}

            {sef.uzmanlik && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>UZMANLIK ALANLARI</h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {sef.uzmanlik.split(",").map((u, i) => (
                    <span key={i} style={{ padding: "8px 16px", background: "rgba(232,0,13,0.08)", border: `1px solid rgba(232,0,13,0.2)`, borderRadius: 20, fontSize: 12, color: C.white, letterSpacing: "0.05em" }}>
                      {u.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {sef.oduller && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>ÖDÜLLER & BAŞARILAR</h2>
                <div style={{ display: "grid", gap: 12 }}>
                  {sef.oduller.split("\n").filter(Boolean).map((o, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 4 }}>
                      <span style={{ fontSize: 20 }}>🏆</span>
                      <span style={{ fontSize: 14, color: C.dim }}>{o.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!sef.biyografi && !sef.uzmanlik && !sef.oduller && (
              <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>👨‍🍳</div>
                <div>Henüz detaylı bilgi eklenmemiş.</div>
              </div>
            )}

            {/* Şehri Keşfet CTA */}
            {sef.sehirler && (
              <div onClick={() => router.push(`/sehir/${sef.sehirler.slug}`)} style={{ marginTop: 48, padding: "20px 24px", background: "rgba(232,0,13,0.06)", border: `1px solid rgba(232,0,13,0.2)`, borderRadius: 4, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(232,0,13,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(232,0,13,0.06)"}>
                <div>
                  <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.1em", marginBottom: 4 }}>ŞEHRİ KEŞFET</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{sef.sehirler.ad}</div>
                </div>
                <span style={{ color: C.red, fontSize: 24 }}>→</span>
              </div>
            )}
          </div>
        )}

        {/* Yöresel Yemekler */}
        {aktifSekme === "yemekler" && (
          yemekler.length === 0 ? (
            <BosIcerik mesaj="Bu şehirde henüz yemek eklenmemiş." />
          ) : (
            <div>
              <p style={{ fontSize: 14, color: C.dim, marginBottom: 32 }}>
                {sef.sehirler?.ad || "Bu bölge"} mutfağından yöresel lezzetler
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                {yemekler.map(y => <YemekKarti key={y.id} yemek={y} onClick={() => router.push(`/yemek/${y.slug}`)} />)}
              </div>
            </div>
          )
        )}

        {/* Restoranlar */}
        {aktifSekme === "restoranlar" && (
          restoranlar.length === 0 ? (
            <BosIcerik mesaj="Bu şehirde henüz restoran eklenmemiş." />
          ) : (
            <div>
              <p style={{ fontSize: 14, color: C.dim, marginBottom: 32 }}>
                {sef.sehirler?.ad || "Bu bölge"}'deki restoranlar
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
                {restoranlar.map(r => <RestoranKarti key={r.id} restoran={r} onClick={() => router.push(`/restoran/${r.slug}`)} />)}
              </div>
            </div>
          )
        )}
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
      style={{ cursor: "pointer", borderRadius: 4, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s" }}>
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
      style={{ display: "flex", gap: 16, padding: 16, borderRadius: 4, background: hover ? C.cardHover : C.card, border: `1px solid ${hover ? "rgba(232,0,13,0.2)" : C.border}`, transition: "all 0.2s", cursor: "pointer" }}>
      <div style={{ width: 72, height: 72, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
        {restoran.fotograf_url ? <img src={restoran.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>🏪</div>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{restoran.ad}</div>
          {restoran.premium && <span style={{ fontSize: 9, padding: "2px 8px", border: "1px solid #fbbf24", color: "#fbbf24", borderRadius: 2, letterSpacing: "0.1em" }}>⭐</span>}
        </div>
        {restoran.sehirler?.ad && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>📍 {restoran.sehirler.ad}</div>}
        {restoran.aciklama && <div style={{ fontSize: 12, color: C.dim, marginTop: 6, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{restoran.aciklama}</div>}
      </div>
    </div>
  );
}

function BosIcerik({ mesaj }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
      <div>{mesaj}</div>
    </div>
  );
}