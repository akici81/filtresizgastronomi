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

const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

export default function RestoranDetay() {
  const router = useRouter();
  const { slug } = router.query;
  const [restoran, setRestoran] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [benzerRestoranlar, setBenzerRestoranlar] = useState([]);
  const [kullanici, setKullanici] = useState(null);
  const [puanim, setPuanim] = useState(0);
  const [yorumMetni, setYorumMetni] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [aktifSekme, setAktifSekme] = useState("hakkinda");
  const [favori, setFavori] = useState(false);
  const [paylasMenuAcik, setPaylasMenuAcik] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getir();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setKullanici(user);
    });
  }, [slug]);

  useEffect(() => {
    if (kullanici && restoran) kontrolFavori();
  }, [kullanici, restoran]);

  async function getir() {
    const { data: r } = await supabase.from("restoranlar").select("*,sehirler(ad,slug)").eq("slug", slug).single();
    if (!r) return;
    setRestoran(r);
    const [y, benzer] = await Promise.all([
      supabase.from("degerlendirmeler").select("*,kullanicilar(ad,kullanici_adi)").eq("restoran_id", r.id).order("olusturma_tarihi", { ascending: false }).limit(20),
      supabase.from("restoranlar").select("id,ad,slug,fotograf_url,sehirler(ad)").eq("sehir_id", r.sehir_id).eq("aktif", true).neq("id", r.id).limit(4),
    ]);
    setYorumlar(y.data || []);
    setBenzerRestoranlar(benzer.data || []);
  }

  async function kontrolFavori() {
    const { data } = await supabase.from("favoriler").select("id").eq("kullanici_id", kullanici.id).eq("restoran_id", restoran.id).single();
    setFavori(!!data);
  }

  async function toggleFavori() {
    if (!kullanici) { router.push("/giris"); return; }
    if (favori) {
      await supabase.from("favoriler").delete().eq("kullanici_id", kullanici.id).eq("restoran_id", restoran.id);
      setFavori(false);
    } else {
      await supabase.from("favoriler").insert({ kullanici_id: kullanici.id, restoran_id: restoran.id });
      setFavori(true);
    }
  }

  async function yorumGonder() {
    if (!kullanici) { router.push("/giris"); return; }
    if (!puanim) { alert("Lütfen puan verin."); return; }
    setGonderiliyor(true);
    await supabase.from("degerlendirmeler").upsert({ kullanici_id: kullanici.id, restoran_id: restoran.id, puan: puanim, yorum: yorumMetni });
    setPuanim(0); setYorumMetni("");
    await getir();
    setGonderiliyor(false);
  }

  function paylas(platform) {
    const url = window.location.href;
    const text = `${restoran.ad} - Filtresiz Gastronomi`;
    if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
    else if (platform === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    else if (platform === "kopyala") {
      navigator.clipboard.writeText(url);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    }
    setPaylasMenuAcik(false);
  }

  const ortPuan = yorumlar.length > 0 ? (yorumlar.reduce((s, y) => s + y.puan, 0) / yorumlar.length).toFixed(1) : null;

  // Çalışma saatlerini parse et (JSON formatında saklanıyorsa)
  const calismaSaatleri = restoran?.calisma_saatleri ? (typeof restoran.calisma_saatleri === "string" ? JSON.parse(restoran.calisma_saatleri) : restoran.calisma_saatleri) : null;

  // Menü items (JSON formatında saklanıyorsa)
  const menuItems = restoran?.menu ? (typeof restoran.menu === "string" ? JSON.parse(restoran.menu) : restoran.menu) : null;

  if (!restoran) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: `2px solid #e8000d`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{margin:0}`}</style>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      {/* Hero */}
      <div style={{ position: "relative", height: 480, marginTop: 53 }}>
        {restoran.fotograf_url
          ? <img src={restoran.fotograf_url} alt={restoran.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(232,0,13,0.1), #0a0a0a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100 }}>🏪</div>
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.4) 50%, rgba(8,8,8,0.2) 100%)" }} />
        
        {/* Aksiyon butonları */}
        <div style={{ position: "absolute", top: 24, right: 24, display: "flex", gap: 10 }}>
          <button onClick={toggleFavori} style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", border: `1px solid ${favori ? C.red : "rgba(255,255,255,0.15)"}`, color: favori ? C.red : C.white, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            title={favori ? "Favorilerden çıkar" : "Favorilere ekle"}>
            {favori ? "❤️" : "🤍"}
          </button>
          
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
          {restoran.sehirler && (
            <div onClick={() => router.push(`/sehir/${restoran.sehirler.slug}`)} style={{ fontSize: 11, color: C.red, letterSpacing: "0.15em", marginBottom: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              📍 {restoran.sehirler.ad.toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ margin: "0 0 12px", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, fontFamily: "'Georgia', serif", lineHeight: 1.1 }}>{restoran.ad}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                {ortPuan && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.4)", padding: "8px 14px", borderRadius: 4 }}>
                    <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(ortPuan) ? "#fbbf24" : C.muted, fontSize: 16 }}>★</span>)}</div>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{ortPuan}</span>
                    <span style={{ fontSize: 12, color: C.dim }}>({yorumlar.length})</span>
                  </div>
                )}
                {restoran.premium && <span style={{ fontSize: 10, padding: "6px 14px", background: "rgba(251,191,36,0.15)", border: "1px solid #fbbf24", color: "#fbbf24", letterSpacing: "0.1em", borderRadius: 20 }}>⭐ ÖNERİLEN</span>}
                {restoran.fiyat_araligi && <span style={{ fontSize: 12, color: C.dim, background: "rgba(255,255,255,0.08)", padding: "6px 12px", borderRadius: 4 }}>{restoran.fiyat_araligi}</span>}
              </div>
            </div>
            {restoran.telefon && (
              <a href={`tel:${restoran.telefon}`} style={{ padding: "12px 24px", background: C.red, border: "none", color: C.white, fontSize: 12, letterSpacing: "0.1em", textDecoration: "none", borderRadius: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                📞 ARA
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", position: "sticky", top: 53, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", display: "flex" }}>
          {[
            ["hakkinda", "Hakkında"],
            ["menu", "Menü"],
            ["yorumlar", `Yorumlar (${yorumlar.length})`],
            ["konum", "Konum"],
          ].map(([key, label]) => (
            <div key={key} onClick={() => setAktifSekme(key)} style={{ padding: "16px 24px", cursor: "pointer", fontSize: 12, letterSpacing: "0.08em", color: aktifSekme === key ? C.white : C.dim, borderBottom: aktifSekme === key ? `2px solid ${C.red}` : "2px solid transparent", transition: "all 0.2s", marginBottom: -1 }}>
              {label.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 48px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 56 }}>

          {/* Sol */}
          <div>
            {/* Hakkında */}
            {aktifSekme === "hakkinda" && (
              <div>
                {restoran.aciklama ? (
                  <p style={{ fontSize: 17, color: C.dim, lineHeight: 1.9, marginBottom: 40 }}>{restoran.aciklama}</p>
                ) : (
                  <BosIcerik mesaj="Henüz açıklama eklenmemiş." />
                )}

                {/* Özellikler */}
                {restoran.ozellikler && (
                  <div style={{ marginTop: 40 }}>
                    <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>ÖZELLİKLER</h3>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {restoran.ozellikler.split(",").map((o, i) => (
                        <span key={i} style={{ padding: "8px 16px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, fontSize: 12, color: C.dim }}>
                          {o.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Menü */}
            {aktifSekme === "menu" && (
              <div>
                {menuItems && menuItems.length > 0 ? (
                  <div style={{ display: "grid", gap: 16 }}>
                    {menuItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 0", borderBottom: `1px solid ${C.border}` }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: C.white, marginBottom: 4 }}>{item.ad}</div>
                          {item.aciklama && <div style={{ fontSize: 13, color: C.dim }}>{item.aciklama}</div>}
                        </div>
                        {item.fiyat && <div style={{ fontSize: 15, fontWeight: 700, color: C.red, whiteSpace: "nowrap" }}>{item.fiyat} ₺</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <BosIcerik mesaj="Menü bilgisi henüz eklenmemiş." />
                )}
              </div>
            )}

            {/* Yorumlar */}
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
                {yorumlar.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", color: C.dim, fontStyle: "italic" }}>Henüz yorum yok. İlk yorumu siz yapın!</div>
                ) : (
                  yorumlar.map(y => (
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
                )}
              </div>
            )}

            {/* Konum */}
            {aktifSekme === "konum" && (
              <div>
                {restoran.adres && (
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 12 }}>ADRES</h3>
                    <p style={{ fontSize: 15, color: C.dim, lineHeight: 1.7 }}>{restoran.adres}</p>
                  </div>
                )}
                {restoran.adres && (
                  <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${C.border}`, height: 350 }}>
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0, filter: "invert(90%) hue-rotate(180deg)" }}
                      loading="lazy"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(restoran.adres + ", " + (restoran.sehirler?.ad || ""))}&output=embed`}
                    />
                  </div>
                )}
                {!restoran.adres && <BosIcerik mesaj="Konum bilgisi henüz eklenmemiş." />}
                
                {/* Yol Tarifi */}
                {restoran.adres && (
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restoran.adres)}`} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, padding: "12px 24px", background: C.red, color: C.white, textDecoration: "none", borderRadius: 4, fontSize: 12, letterSpacing: "0.1em", fontWeight: 700 }}>
                    🧭 YOL TARİFİ AL
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sağ Sidebar */}
          <div>
            <div style={{ position: "sticky", top: 120 }}>
              {/* İletişim Kartı */}
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>İLETİŞİM</div>
                
                {restoran.adres && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>📍</span>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.muted, marginBottom: 4 }}>ADRES</div>
                      <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>{restoran.adres}</div>
                    </div>
                  </div>
                )}
                
                {restoran.telefon && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>📞</span>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.muted, marginBottom: 4 }}>TELEFON</div>
                      <a href={`tel:${restoran.telefon}`} style={{ fontSize: 13, color: C.white, textDecoration: "none" }}>{restoran.telefon}</a>
                    </div>
                  </div>
                )}
                
                {restoran.website && (
                  <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>🌐</span>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.muted, marginBottom: 4 }}>WEB SİTESİ</div>
                      <a href={restoran.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.red, textDecoration: "none" }}>{restoran.website.replace(/https?:\/\//, "")}</a>
                    </div>
                  </div>
                )}

                {restoran.instagram && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>📷</span>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: "0.1em", color: C.muted, marginBottom: 4 }}>INSTAGRAM</div>
                      <a href={`https://instagram.com/${restoran.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#E1306C", textDecoration: "none" }}>@{restoran.instagram}</a>
                    </div>
                  </div>
                )}
              </div>

              {/* Çalışma Saatleri */}
              {calismaSaatleri && (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.15em", color: C.red, marginBottom: 16 }}>ÇALIŞMA SAATLERİ</div>
                  {GUNLER.map((gun, i) => (
                    <div key={gun} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 6 ? `1px solid ${C.border}` : "none", fontSize: 13 }}>
                      <span style={{ color: C.dim }}>{gun}</span>
                      <span style={{ color: calismaSaatleri[gun] === "Kapalı" ? C.red : C.white }}>{calismaSaatleri[gun] || "—"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Şehri Keşfet */}
              {restoran.sehirler && (
                <div onClick={() => router.push(`/sehir/${restoran.sehirler.slug}`)} style={{ padding: "16px 20px", background: "rgba(232,0,13,0.06)", border: `1px solid rgba(232,0,13,0.2)`, borderRadius: 8, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(232,0,13,0.1)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(232,0,13,0.06)"}>
                  <div>
                    <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.1em", marginBottom: 4 }}>ŞEHRİ KEŞFET</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>{restoran.sehirler.ad}</div>
                  </div>
                  <span style={{ color: C.red, fontSize: 20 }}>→</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Benzer Restoranlar */}
      {benzerRestoranlar.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "64px 48px 80px", background: "rgba(255,255,255,0.01)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h3 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 8 }}>✦ BENZER RESTORANLAR</h3>
            <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Georgia', serif", marginBottom: 32 }}>{restoran.sehirler?.ad}'da Diğer Mekanlar</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {benzerRestoranlar.map(r => <RestoranKart key={r.id} restoran={r} onClick={() => router.push(`/restoran/${r.slug}`)} />)}
            </div>
          </div>
        </div>
      )}

      <Footer />
      
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        textarea::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

function RestoranKart({ restoran, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s" }}>
      <div style={{ height: 160, overflow: "hidden" }}>
        {restoran.fotograf_url
          ? <img src={restoran.fotograf_url} alt={restoran.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.08)" : "scale(1)", transition: "transform 0.5s" }} />
          : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🏪</div>
        }
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{restoran.ad}</div>
        {restoran.sehirler?.ad && <div style={{ fontSize: 11, color: C.dim, marginTop: 5 }}>📍 {restoran.sehirler.ad}</div>}
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