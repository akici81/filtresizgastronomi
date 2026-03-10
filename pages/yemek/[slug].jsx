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

export default function YemekDetay() {
  const router = useRouter();
  const { slug } = router.query;
  const [yemek, setYemek] = useState(null);
  const [restoranlar, setRestoranlar] = useState([]);
  const [benzerYemekler, setBenzerYemekler] = useState([]);
  const [yorumlar, setYorumlar] = useState([]);
  const [kullanici, setKullanici] = useState(null);
  const [puanim, setPuanim] = useState(0);
  const [yorumMetni, setYorumMetni] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [aktifSekme, setAktifSekme] = useState("hikaye");
  const [favori, setFavori] = useState(false);
  const [paylasMenuAcik, setPaylasMenuAcik] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getir();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setKullanici(user);
      if (user) kontrolFavori(user.id);
    });
  }, [slug]);

  async function getir() {
    const { data: y } = await supabase.from("yemekler").select("*,sehirler(id,ad,slug)").eq("slug", slug).single();
    if (!y) return;
    setYemek(y);
    const [r, yor, benzer] = await Promise.all([
      supabase.from("restoranlar").select("id,ad,slug,fotograf_url,sehirler(ad)").eq("sehir_id", y.sehir_id).eq("aktif", true).limit(6),
      supabase.from("degerlendirmeler").select("*,kullanicilar(ad,kullanici_adi)").eq("yemek_id", y.id).order("olusturma_tarihi", { ascending: false }).limit(20),
      supabase.from("yemekler").select("id,ad,slug,fotograf_url,sehirler(ad)").eq("aktif", true).neq("id", y.id).eq("sehir_id", y.sehir_id).limit(4),
    ]);
    setRestoranlar(r.data || []);
    setYorumlar(yor.data || []);
    setBenzerYemekler(benzer.data || []);
  }

  async function kontrolFavori(userId) {
    const { data } = await supabase.from("favoriler").select("id").eq("kullanici_id", userId).eq("yemek_id", yemek?.id).single();
    setFavori(!!data);
  }

  async function toggleFavori() {
    if (!kullanici) { router.push("/giris"); return; }
    if (favori) {
      await supabase.from("favoriler").delete().eq("kullanici_id", kullanici.id).eq("yemek_id", yemek.id);
      setFavori(false);
    } else {
      await supabase.from("favoriler").insert({ kullanici_id: kullanici.id, yemek_id: yemek.id });
      setFavori(true);
    }
  }

  async function yorumGonder() {
    if (!kullanici) { router.push("/giris"); return; }
    if (!puanim) { alert("Lütfen puan verin."); return; }
    setGonderiliyor(true);
    await supabase.from("degerlendirmeler").upsert({ kullanici_id: kullanici.id, yemek_id: yemek.id, puan: puanim, yorum: yorumMetni });
    setPuanim(0); setYorumMetni("");
    await getir();
    setGonderiliyor(false);
  }

  function paylas(platform) {
    const url = window.location.href;
    const text = `${yemek.ad} - Filtresiz Gastronomi`;
    if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    else if (platform === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    else if (platform === "kopyala") {
      navigator.clipboard.writeText(url);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }
    setPaylasMenuAcik(false);
  }

  function yazdir() {
    window.print();
  }

  const ortPuan = yorumlar.length > 0 ? (yorumlar.reduce((s, y) => s + y.puan, 0) / yorumlar.length).toFixed(1) : null;

  if (!yemek) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: `2px solid #e8000d`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{margin:0}`}</style>
    </div>
  );

  const malzemeler = yemek.malzemeler ? yemek.malzemeler.split("\n").filter(Boolean) : [];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      {/* Hero */}
      <div style={{ position: "relative", height: 500, marginTop: 53 }}>
        {yemek.fotograf_url
          ? <img src={yemek.fotograf_url} alt={yemek.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(232,0,13,0.15), #0a0a0a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100 }}>🍽️</div>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.4) 50%, rgba(8,8,8,0.2) 100%)" }} />
        
        {/* Aksiyon butonları */}
        <div style={{ position: "absolute", top: 24, right: 24, display: "flex", gap: 10 }}>
          {/* Favori */}
          <button onClick={toggleFavori} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: `1px solid ${favori ? C.red : "rgba(255,255,255,0.15)"}`, color: favori ? C.red : C.white, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            title={favori ? "Favorilerden çıkar" : "Favorilere ekle"}>
            {favori ? "❤️" : "🤍"}
          </button>
          
          {/* Paylaş */}
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

        <div style={{ position: "absolute", bottom: 48, left: 48, right: 48 }}>
          {yemek.sehirler && (
            <div onClick={() => router.push(`/sehir/${yemek.sehirler.slug}`)} style={{ fontSize: 11, color: C.red, letterSpacing: "0.15em", marginBottom: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              📍 {yemek.sehirler.ad.toUpperCase()}
            </div>
          )}
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 900, fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>{yemek.ad}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            {ortPuan && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.4)", padding: "8px 14px", borderRadius: 4 }}>
                <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(ortPuan) ? "#fbbf24" : C.muted, fontSize: 16 }}>★</span>)}</div>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{ortPuan}</span>
                <span style={{ fontSize: 12, color: C.dim }}>({yorumlar.length})</span>
              </div>
            )}
            {yemek.tag && <span style={{ fontSize: 10, padding: "6px 14px", background: "rgba(232,0,13,0.15)", border: `1px solid ${C.red}`, color: C.red, letterSpacing: "0.12em", borderRadius: 20 }}>{yemek.tag.toUpperCase()}</span>}
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", position: "sticky", top: 53, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex" }}>
            {[["hikaye", "Hikaye"], ["tarif", "Tarif"], ["yorumlar", `Yorumlar (${yorumlar.length})`]].map(([key, label]) => (
              <div key={key} onClick={() => setAktifSekme(key)} style={{ padding: "16px 24px", cursor: "pointer", fontSize: 12, letterSpacing: "0.08em", color: aktifSekme === key ? C.white : C.dim, borderBottom: aktifSekme === key ? `2px solid ${C.red}` : "2px solid transparent", transition: "all 0.2s", marginBottom: -1 }}>
                {label.toUpperCase()}
              </div>
            ))}
          </div>
          {aktifSekme === "tarif" && (malzemeler.length > 0 || yemek.yapilis) && (
            <button onClick={yazdir} style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${C.border}`, color: C.dim, fontSize: 11, letterSpacing: "0.08em", cursor: "pointer", borderRadius: 2, display: "flex", alignItems: "center", gap: 6 }}
              onMouseEnter={e => { e.target.style.borderColor = C.red; e.target.style.color = C.white; }}
              onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.dim; }}>
              🖨️ YAZDIR
            </button>
          )}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 56 }}>

          {/* Sol */}
          <div>
            {aktifSekme === "hikaye" && (
              <div className="print-content">
                {yemek.aciklama && <p style={{ fontSize: 18, color: C.dim, lineHeight: 1.9, marginBottom: 40 }}>{yemek.aciklama}</p>}
                {yemek.tarihce && (
                  <div>
                    <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>TARİHÇE</h3>
                    <p style={{ fontSize: 16, color: C.dim, lineHeight: 1.9 }}>{yemek.tarihce}</p>
                  </div>
                )}
                {!yemek.aciklama && !yemek.tarihce && <BosIcerik mesaj="Henüz hikaye eklenmemiş." />}
              </div>
            )}

            {aktifSekme === "tarif" && (
              <div className="print-content">
                {malzemeler.length > 0 && (
                  <div style={{ marginBottom: 48 }}>
                    <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>MALZEMELER</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {malzemeler.map((m, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: C.card, borderRadius: 4, fontSize: 14, color: C.dim, border: `1px solid ${C.border}` }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.red, flexShrink: 0 }} /> {m}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {yemek.yapilis && (
                  <div>
                    <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>YAPILIŞI</h3>
                    <div style={{ fontSize: 16, color: C.dim, lineHeight: 2, whiteSpace: "pre-wrap" }}>{yemek.yapilis}</div>
                  </div>
                )}
                {!malzemeler.length && !yemek.yapilis && <BosIcerik mesaj="Henüz tarif eklenmemiş." />}
              </div>
            )}

            {aktifSekme === "yorumlar" && (
              <div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 28, marginBottom: 32 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.white, marginBottom: 20 }}>Değerlendirme Yap</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} onClick={() => setPuanim(i)} style={{ fontSize: 32, cursor: "pointer", color: i <= puanim ? "#fbbf24" : C.muted, transition: "all 0.15s", transform: i <= puanim ? "scale(1.1)" : "scale(1)" }}>★</span>
                    ))}
                  </div>
                  <textarea value={yorumMetni} onChange={e => setYorumMetni(e.target.value)} placeholder="Deneyiminizi paylaşın..." rows={4} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 4, padding: "14px 16px", color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                  <button onClick={yorumGonder} disabled={gonderiliyor} style={{ marginTop: 16, background: C.red, border: "none", color: C.white, padding: "12px 28px", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4, fontFamily: "inherit", fontWeight: 700 }}>
                    {kullanici ? (gonderiliyor ? "GÖNDERİLİYOR..." : "GÖNDER") : "GİRİŞ YAP"}
                  </button>
                </div>
                {yorumlar.length === 0
                  ? <div style={{ textAlign: "center", padding: "40px", color: C.dim, fontStyle: "italic" }}>Henüz yorum yok. İlk yorumu siz yapın!</div>
                  : yorumlar.map(y => (
                    <div key={y.id} style={{ padding: "24px 0", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                            {(y.kullanicilar?.ad || y.kullanicilar?.kullanici_adi || "K")[0].toUpperCase()}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{y.kullanicilar?.ad || y.kullanicilar?.kullanici_adi || "Kullanıcı"}</div>
                        </div>
                        <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= y.puan ? "#fbbf24" : C.muted, fontSize: 14 }}>★</span>)}</div>
                      </div>
                      {y.yorum && <div style={{ fontSize: 15, color: C.dim, lineHeight: 1.7, marginLeft: 48 }}>{y.yorum}</div>}
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          {/* Sağ Sidebar */}
          <div>
            <div style={{ position: "sticky", top: 120 }}>
              {/* Restoranlar */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 11, letterSpacing: "0.15em", color: C.red, marginBottom: 16 }}>NEREDE YENİR?</h3>
                {restoranlar.length > 0 ? restoranlar.slice(0, 4).map(r => (
                  <div key={r.id} onClick={() => router.push(`/restoran/${r.slug}`)} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    <div style={{ width: 48, height: 48, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                      {r.fotograf_url ? <img src={r.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>🏪</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{r.ad}</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{r.sehirler?.ad}</div>
                    </div>
                  </div>
                )) : <div style={{ fontSize: 12, color: C.dim, fontStyle: "italic" }}>Henüz restoran eklenmemiş.</div>}
              </div>

              {/* Şehri Keşfet */}
              {yemek.sehirler && (
                <div onClick={() => router.push(`/sehir/${yemek.sehirler.slug}`)} style={{ padding: "16px 20px", background: "rgba(232,0,13,0.06)", border: `1px solid rgba(232,0,13,0.2)`, borderRadius: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(232,0,13,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(232,0,13,0.06)"}>
                  <div>
                    <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.1em", marginBottom: 4 }}>ŞEHRİ KEŞFET</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{yemek.sehirler.ad}</div>
                  </div>
                  <span style={{ color: C.red, fontSize: 20 }}>→</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Benzer Yemekler */}
      {benzerYemekler.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "64px 48px 80px", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 8 }}>✦ BENZER YEMEKLER</h3>
            <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Georgia', serif", marginBottom: 32 }}>{yemek.sehirler?.ad} Mutfağından</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {benzerYemekler.map(y => <BenzerYemekKart key={y.id} yemek={y} onClick={() => router.push(`/yemek/${y.slug}`)} />)}
            </div>
          </div>
        </div>
      )}

      <Footer />
      
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
        @media print {
          nav, footer, button, .no-print { display: none !important; }
          .print-content { color: #000 !important; }
        }
        @media (max-width: 900px) {
          .grid-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function BenzerYemekKart({ yemek, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s" }}>
      <div style={{ height: 160, overflow: "hidden" }}>
        {yemek.fotograf_url
          ? <img src={yemek.fotograf_url} alt={yemek.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.08)" : "scale(1)", transition: "transform 0.5s" }} />
          : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🍽️</div>
        }
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{yemek.ad}</div>
        {yemek.sehirler?.ad && <div style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>📍 {yemek.sehirler.ad}</div>}
      </div>
    </div>
  );
}

function BosIcerik({ mesaj }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
      <div>{mesaj}</div>
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