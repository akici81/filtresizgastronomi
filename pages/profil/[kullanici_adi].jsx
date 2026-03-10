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

export default function ProfilSayfasi() {
  const router = useRouter();
  const { kullanici_adi } = router.query;
  const [profil, setProfil] = useState(null);
  const [yorumlar, setYorumlar] = useState([]);
  const [favoriler, setFavoriler] = useState([]);
  const [aktifSekme, setAktifSekme] = useState("yorumlar");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bulunamadi, setBulunamadi] = useState(false);
  const [benimProfilim, setBenimProfilim] = useState(false);
  const [duzenleMode, setDuzenleMode] = useState(false);
  const [form, setForm] = useState({ ad: "", bio: "", website: "", instagram: "" });
  const [kaydediliyor, setKaydediliyor] = useState(false);

  useEffect(() => {
    if (!kullanici_adi || kullanici_adi === "me") {
      // "me" ise giriş yapan kullanıcıyı bul
      meKontrol();
      return;
    }
    getir();
  }, [kullanici_adi]);

  async function meKontrol() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/giris");
      return;
    }
    
    const { data } = await supabase.from("kullanicilar").select("kullanici_adi").eq("id", user.id).single();
    
    if (data?.kullanici_adi) {
      router.replace(`/profil/${data.kullanici_adi}`);
    } else {
      // Kullanıcı adı yok - profil tamamlama sayfasına yönlendir veya hata göster
      setBulunamadi(true);
      setYukleniyor(false);
    }
  }

  async function getir() {
    console.log("Profil getiriliyor:", kullanici_adi);
    
    // Profil bilgisi
    const { data: p, error } = await supabase
      .from("kullanicilar")
      .select("*")
      .eq("kullanici_adi", kullanici_adi)
      .single();

    console.log("Profil sonucu:", p, error);

    if (!p) {
      setBulunamadi(true);
      setYukleniyor(false);
      return;
    }

    setProfil(p);
    setForm({ ad: p.ad || "", bio: p.bio || "", website: p.website || "", instagram: p.instagram || "" });

    // Giriş yapan kullanıcı mı?
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === p.id) {
      setBenimProfilim(true);
    }

    // Yorumlar
    const { data: yor } = await supabase
      .from("degerlendirmeler")
      .select("*, yemekler(ad, slug, fotograf_url), restoranlar(ad, slug, fotograf_url)")
      .eq("kullanici_id", p.id)
      .order("olusturma_tarihi", { ascending: false })
      .limit(20);
    setYorumlar(yor || []);

    // Favoriler
    const { data: fav } = await supabase
      .from("favoriler")
      .select("*, yemekler(ad, slug, fotograf_url, sehirler(ad)), restoranlar(ad, slug, fotograf_url, sehirler(ad))")
      .eq("kullanici_id", p.id)
      .order("olusturma_tarihi", { ascending: false });
    setFavoriler(fav || []);

    setYukleniyor(false);
  }

  async function kaydet() {
    setKaydediliyor(true);
    await supabase.from("kullanicilar").update({
      ad: form.ad,
      bio: form.bio,
      website: form.website,
      instagram: form.instagram,
    }).eq("id", profil.id);
    
    setProfil({ ...profil, ...form });
    setDuzenleMode(false);
    setKaydediliyor(false);
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

  if (yukleniyor) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: `2px solid ${C.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: C.dim, fontSize: 13 }}>Profil yükleniyor...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{margin:0}`}</style>
    </div>
  );

  if (bulunamadi) return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />
      <div style={{ paddingTop: 150, textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>😕</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Kullanıcı Bulunamadı</h1>
        <p style={{ color: C.dim, marginBottom: 32 }}>@{kullanici_adi} adında bir kullanıcı yok veya profil henüz oluşturulmamış.</p>
        <button onClick={() => router.push("/")} style={{ padding: "12px 28px", background: C.red, border: "none", color: C.white, fontSize: 13, cursor: "pointer", borderRadius: 4, fontWeight: 700 }}>
          ANA SAYFAYA DÖN
        </button>
      </div>
      <Footer />
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />

      {/* Profil Header */}
      <div style={{ padding: "120px 48px 40px", background: "linear-gradient(180deg, rgba(232,0,13,0.06) 0%, transparent 100%)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 32, alignItems: "flex-start" }}>
          
          {/* Avatar */}
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, fontWeight: 700, flexShrink: 0, border: "4px solid rgba(232,0,13,0.3)" }}>
            {(profil.ad || profil.kullanici_adi || "K")[0].toUpperCase()}
          </div>

          {/* Bilgiler */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, fontFamily: "'Georgia', serif" }}>{profil.ad || profil.kullanici_adi}</h1>
              {benimProfilim && !duzenleMode && (
                <button onClick={() => setDuzenleMode(true)} style={{ padding: "6px 14px", background: "transparent", border: `1px solid ${C.border}`, color: C.dim, fontSize: 11, cursor: "pointer", borderRadius: 4 }}>
                  ✏️ Düzenle
                </button>
              )}
            </div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 16 }}>@{profil.kullanici_adi}</div>
            
            {profil.bio && <p style={{ fontSize: 15, color: C.dim, lineHeight: 1.7, margin: "0 0 16px", maxWidth: 500 }}>{profil.bio}</p>}
            
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {profil.website && (
                <a href={profil.website.startsWith("http") ? profil.website : `https://${profil.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: C.red, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  🔗 {profil.website.replace(/https?:\/\//, "")}
                </a>
              )}
              {profil.instagram && (
                <a href={`https://instagram.com/${profil.instagram}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#E1306C", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  📷 @{profil.instagram}
                </a>
              )}
            </div>

            {/* İstatistikler */}
            <div style={{ display: "flex", gap: 32, marginTop: 24 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{yorumlar.length}</div>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>YORUM</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{favoriler.length}</div>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>FAVORİ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Düzenleme Modu */}
      {duzenleMode && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px 32px" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 14, fontWeight: 600, color: C.white }}>Profili Düzenle</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>AD SOYAD</label>
                <input type="text" value={form.ad} onChange={e => setForm({ ...form, ad: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>INSTAGRAM</label>
                <input type="text" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="kullaniciadi" style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>WEB SİTESİ</label>
              <input type="text" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." style={inputStyle} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>BİYOGRAFİ</label>
              <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Kendinizden bahsedin..." style={{ ...inputStyle, resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={kaydet} disabled={kaydediliyor} style={{ padding: "10px 24px", background: C.red, border: "none", color: C.white, fontSize: 12, cursor: "pointer", borderRadius: 4, fontWeight: 700 }}>
                {kaydediliyor ? "KAYDEDİLİYOR..." : "KAYDET"}
              </button>
              <button onClick={() => setDuzenleMode(false)} style={{ padding: "10px 24px", background: "transparent", border: `1px solid ${C.border}`, color: C.dim, fontSize: 12, cursor: "pointer", borderRadius: 4 }}>
                İPTAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sekmeler */}
      <div style={{ borderBottom: `1px solid ${C.border}`, position: "sticky", top: 53, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(20px)", zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px", display: "flex" }}>
          {[
            ["yorumlar", `Yorumlar (${yorumlar.length})`, "⭐"],
            ["favoriler", `Favoriler (${favoriler.length})`, "❤️"],
          ].map(([key, label, icon]) => (
            <div key={key} onClick={() => setAktifSekme(key)} style={{ padding: "16px 28px", cursor: "pointer", fontSize: 12, letterSpacing: "0.08em", color: aktifSekme === key ? C.white : C.dim, borderBottom: aktifSekme === key ? `2px solid ${C.red}` : "2px solid transparent", transition: "all 0.2s", marginBottom: -1, display: "flex", alignItems: "center", gap: 8 }}>
              <span>{icon}</span> {label.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 48px 80px" }}>
        
        {/* Yorumlar */}
        {aktifSekme === "yorumlar" && (
          yorumlar.length === 0 ? (
            <BosIcerik mesaj={benimProfilim ? "Henüz yorum yapmadın." : "Bu kullanıcı henüz yorum yapmamış."} icon="⭐" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {yorumlar.map((yorum, i) => (
                <div key={yorum.id} style={{ display: "flex", gap: 16, padding: "20px 0", borderBottom: i < yorumlar.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 60, height: 60, borderRadius: 6, overflow: "hidden", flexShrink: 0, cursor: "pointer" }}
                    onClick={() => router.push(yorum.yemekler ? `/yemek/${yorum.yemekler.slug}` : `/restoran/${yorum.restoranlar.slug}`)}>
                    {(yorum.yemekler?.fotograf_url || yorum.restoranlar?.fotograf_url) ? (
                      <img src={yorum.yemekler?.fotograf_url || yorum.restoranlar?.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: C.card, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {yorum.yemekler ? "🍽️" : "🏪"}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span onClick={() => router.push(yorum.yemekler ? `/yemek/${yorum.yemekler.slug}` : `/restoran/${yorum.restoranlar.slug}`)} style={{ fontSize: 15, fontWeight: 600, color: C.white, cursor: "pointer" }}>
                        {yorum.yemekler?.ad || yorum.restoranlar?.ad}
                      </span>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= yorum.puan ? "#fbbf24" : C.muted, fontSize: 14 }}>★</span>)}
                      </div>
                    </div>
                    {yorum.yorum && <p style={{ fontSize: 14, color: C.dim, lineHeight: 1.6, margin: "0 0 8px" }}>"{yorum.yorum}"</p>}
                    <span style={{ fontSize: 11, color: C.muted }}>{zamanOnce(yorum.olusturma_tarihi)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Favoriler */}
        {aktifSekme === "favoriler" && (
          favoriler.length === 0 ? (
            <BosIcerik mesaj={benimProfilim ? "Henüz favori eklemedin." : "Bu kullanıcının favorisi yok."} icon="❤️" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {favoriler.map(fav => {
                const item = fav.yemekler || fav.restoranlar;
                const tip = fav.yemekler ? "yemek" : "restoran";
                if (!item) return null;
                return (
                  <FavoriKart key={fav.id} item={item} tip={tip} onClick={() => router.push(`/${tip}/${item.slug}`)} />
                );
              })}
            </div>
          )
        )}
      </div>

      <Footer />
      <style>{`* { box-sizing: border-box; } body { margin: 0; } textarea::placeholder, input::placeholder { color: rgba(255,255,255,0.3); }`}</style>
    </div>
  );
}

function FavoriKart({ item, tip, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s" }}>
      <div style={{ height: 140, overflow: "hidden", position: "relative" }}>
        {item.fotograf_url ? (
          <img src={item.fotograf_url} alt={item.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>
            {tip === "yemek" ? "🍽️" : "🏪"}
          </div>
        )}
        <span style={{ position: "absolute", top: 8, right: 8, fontSize: 16 }}>❤️</span>
      </div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{item.ad}</div>
        {item.sehirler?.ad && <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>📍 {item.sehirler.ad}</div>}
      </div>
    </div>
  );
}

function BosIcerik({ mesaj, icon = "📝" }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: C.dim }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontSize: 15 }}>{mesaj}</div>
    </div>
  );
}

const labelStyle = { fontSize: 11, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 8 };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "12px 14px", color: "#ffffff", fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };