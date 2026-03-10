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

export default function YemeklerSayfasi() {
  const router = useRouter();
  const [yemekler, setYemekler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [toplam, setToplam] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const PER_PAGE = 24;
  const [aramaMetni, setAramaMetni] = useState("");
  const [seciliSehir, setSeciliSehir] = useState("");
  const [seciliTag, setSeciliTag] = useState("");
  const [siralama, setSiralama] = useState("ad");
  const [gorunumTipi, setGorunumTipi] = useState("grid"); // grid veya liste
  const [kullanici, setKullanici] = useState(null);
  const [favoriler, setFavoriler] = useState([]);
  const TAGLAR = ["Yöresel", "Sokak Lezzeti", "Tatlı", "Çorba", "Et Yemeği", "Deniz Ürünleri", "Vejetaryen", "Kahvaltılık"];

  useEffect(() => {
    supabase.from("sehirler").select("id,ad").eq("aktif", true).order("ad").then(({ data }) => setSehirler(data || []));
    supabase.auth.getUser().then(({ data: { user } }) => {
      setKullanici(user);
      if (user) getFavoriler(user.id);
    });
  }, []);

  useEffect(() => { getir(); }, [aramaMetni, seciliSehir, seciliTag, siralama, sayfa]);

  async function getir() {
    setYukleniyor(true);
    let q = supabase.from("yemekler").select("*,sehirler(ad,slug)", { count: "exact" }).eq("aktif", true);
    if (aramaMetni) q = q.ilike("ad", `%${aramaMetni}%`);
    if (seciliSehir) q = q.eq("sehir_id", seciliSehir);
    if (seciliTag) q = q.ilike("tag", `%${seciliTag}%`);
    q = q.order(siralama === "yeni" ? "olusturma_tarihi" : "ad", { ascending: siralama !== "yeni" }).range((sayfa - 1) * PER_PAGE, sayfa * PER_PAGE - 1);
    const { data, count } = await q;
    
    // Her yemek için ortalama puanı al
    if (data && data.length > 0) {
      const yemekIds = data.map(y => y.id);
      const { data: puanlar } = await supabase
        .from("degerlendirmeler")
        .select("yemek_id, puan")
        .in("yemek_id", yemekIds);
      
      const puanMap = {};
      if (puanlar) {
        puanlar.forEach(p => {
          if (!puanMap[p.yemek_id]) puanMap[p.yemek_id] = { toplam: 0, sayi: 0 };
          puanMap[p.yemek_id].toplam += p.puan;
          puanMap[p.yemek_id].sayi++;
        });
      }
      
      data.forEach(y => {
        if (puanMap[y.id]) {
          y.ortPuan = (puanMap[y.id].toplam / puanMap[y.id].sayi).toFixed(1);
          y.yorumSayisi = puanMap[y.id].sayi;
        }
      });
    }
    
    setYemekler(data || []); 
    setToplam(count || 0); 
    setYukleniyor(false);
  }

  async function getFavoriler(userId) {
    const { data } = await supabase.from("favoriler").select("yemek_id").eq("kullanici_id", userId);
    setFavoriler(data ? data.map(f => f.yemek_id) : []);
  }

  async function toggleFavori(e, yemekId) {
    e.stopPropagation();
    if (!kullanici) { router.push("/giris"); return; }
    
    if (favoriler.includes(yemekId)) {
      await supabase.from("favoriler").delete().eq("kullanici_id", kullanici.id).eq("yemek_id", yemekId);
      setFavoriler(favoriler.filter(id => id !== yemekId));
    } else {
      await supabase.from("favoriler").insert({ kullanici_id: kullanici.id, yemek_id: yemekId });
      setFavoriler([...favoriler, yemekId]);
    }
  }

  const sayfaSayisi = Math.ceil(toplam / PER_PAGE);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />
      
      {/* Hero */}
      <div style={{ padding: "120px 48px 60px", background: "linear-gradient(180deg, rgba(232,0,13,0.05) 0%, transparent 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.25em", color: C.red, marginBottom: 12 }}>✦ KEŞFET</div>
          <h1 style={{ margin: "0 0 8px", fontSize: 48, fontWeight: 900, fontFamily: "'Georgia', serif" }}>Yöresel Yemekler</h1>
          <p style={{ margin: 0, fontSize: 15, color: C.dim }}>{toplam} yemek · Türkiye'nin dört bir yanından</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 80px" }}>
        {/* Filtreler */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 14px", flex: 1, minWidth: 200 }}>
            <span style={{ color: C.muted }}>🔍</span>
            <input value={aramaMetni} onChange={e => { setAramaMetni(e.target.value); setSayfa(1); }} placeholder="Yemek ara..." style={{ background: "transparent", border: "none", color: C.white, fontSize: 13, fontFamily: "inherit", outline: "none", flex: 1 }} />
          </div>
          <select value={seciliSehir} onChange={e => { setSeciliSehir(e.target.value); setSayfa(1); }} style={selectStyle}>
            <option value="">Tüm Şehirler</option>
            {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </select>
          <select value={siralama} onChange={e => setSiralama(e.target.value)} style={selectStyle}>
            <option value="ad">A → Z</option>
            <option value="yeni">En Yeni</option>
          </select>
          
          {/* Görünüm Toggle */}
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
            <button onClick={() => setGorunumTipi("grid")} style={{ padding: "10px 14px", background: gorunumTipi === "grid" ? "rgba(232,0,13,0.1)" : "transparent", border: "none", color: gorunumTipi === "grid" ? C.white : C.dim, cursor: "pointer", fontSize: 14 }}>▦</button>
            <button onClick={() => setGorunumTipi("liste")} style={{ padding: "10px 14px", background: gorunumTipi === "liste" ? "rgba(232,0,13,0.1)" : "transparent", border: "none", borderLeft: `1px solid ${C.border}`, color: gorunumTipi === "liste" ? C.white : C.dim, cursor: "pointer", fontSize: 14 }}>☰</button>
          </div>
        </div>

        {/* Tag'ler */}
        <div style={{ display: "flex", gap: 8, marginBottom: 40, flexWrap: "wrap" }}>
          {["Tümü", ...TAGLAR].map(t => (
            <div key={t} onClick={() => { setSeciliTag(t === "Tümü" ? "" : t); setSayfa(1); }} style={{ fontSize: 11, padding: "8px 16px", borderRadius: 20, cursor: "pointer", border: `1px solid ${(t === "Tümü" ? !seciliTag : seciliTag === t) ? C.red : C.border}`, color: (t === "Tümü" ? !seciliTag : seciliTag === t) ? C.white : C.dim, background: (t === "Tümü" ? !seciliTag : seciliTag === t) ? "rgba(232,0,13,0.1)" : "transparent", transition: "all 0.2s", letterSpacing: "0.05em" }}>{t}</div>
          ))}
        </div>

        {/* İçerik */}
        {yukleniyor ? (
          <div style={{ display: "grid", gridTemplateColumns: gorunumTipi === "grid" ? "repeat(auto-fill, minmax(260px, 1fr))" : "1fr", gap: 20 }}>
            {[...Array(12)].map((_, i) => <div key={i} style={{ height: gorunumTipi === "grid" ? 300 : 120, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : yemekler.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Sonuç bulunamadı</div>
            <div style={{ fontSize: 14 }}>Farklı filtreler deneyin</div>
          </div>
        ) : gorunumTipi === "grid" ? (
          // GRID GÖRÜNÜMÜ
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {yemekler.map(y => (
              <YemekKartGrid 
                key={y.id} 
                yemek={y} 
                favori={favoriler.includes(y.id)}
                onFavoriToggle={(e) => toggleFavori(e, y.id)}
                onClick={() => router.push(`/yemek/${y.slug}`)} 
              />
            ))}
          </div>
        ) : (
          // LİSTE GÖRÜNÜMÜ
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {yemekler.map(y => (
              <YemekKartListe 
                key={y.id} 
                yemek={y}
                favori={favoriler.includes(y.id)}
                onFavoriToggle={(e) => toggleFavori(e, y.id)}
                onClick={() => router.push(`/yemek/${y.slug}`)} 
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {sayfaSayisi > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 48 }}>
            <PageBtn disabled={sayfa === 1} onClick={() => setSayfa(s => s - 1)} label="←" />
            {[...Array(Math.min(sayfaSayisi, 7))].map((_, i) => {
              let pageNum;
              if (sayfaSayisi <= 7) pageNum = i + 1;
              else if (sayfa <= 4) pageNum = i + 1;
              else if (sayfa >= sayfaSayisi - 3) pageNum = sayfaSayisi - 6 + i;
              else pageNum = sayfa - 3 + i;
              return <PageBtn key={i} aktif={sayfa === pageNum} onClick={() => setSayfa(pageNum)} label={pageNum} />;
            })}
            <PageBtn disabled={sayfa === sayfaSayisi} onClick={() => setSayfa(s => s + 1)} label="→" />
          </div>
        )}
      </div>

      <Footer />
      <style>{`* { box-sizing: border-box; } body { margin: 0; } input::placeholder { color: rgba(255,255,255,0.3); } option { background: #141414; } @keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
    </div>
  );
}

// Grid Kart Komponenti
function YemekKartGrid({ yemek, favori, onFavoriToggle, onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s", position: "relative" }}>
      
      {/* Fotoğraf */}
      <div style={{ height: 190, overflow: "hidden", position: "relative" }}>
        {yemek.fotograf_url ? (
          <img src={yemek.fotograf_url} alt={yemek.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🍽️</div>
        )}
        
        {/* Tag */}
        {yemek.tag && (
          <span style={{ position: "absolute", top: 12, left: 12, background: C.red, color: C.white, fontSize: 9, padding: "4px 10px", letterSpacing: "0.1em", borderRadius: 4 }}>{yemek.tag.toUpperCase()}</span>
        )}
        
        {/* Favori butonu */}
        <button onClick={onFavoriToggle} style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "none", color: favori ? "#ff6b6b" : C.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", opacity: hover || favori ? 1 : 0 }}>
          {favori ? "❤️" : "🤍"}
        </button>
        
        {/* Puan */}
        {yemek.ortPuan && (
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", padding: "4px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#fbbf24", fontSize: 12 }}>★</span>
            <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{yemek.ortPuan}</span>
          </div>
        )}
      </div>
      
      {/* Bilgiler */}
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 6, fontFamily: "'Georgia', serif" }}>{yemek.ad}</div>
        {yemek.sehirler?.ad && (
          <div style={{ fontSize: 11, color: C.red, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span> {yemek.sehirler.ad.toUpperCase()}
          </div>
        )}
        {yemek.aciklama && (
          <div style={{ fontSize: 12, color: C.dim, marginTop: 8, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{yemek.aciklama}</div>
        )}
      </div>
    </div>
  );
}

// Liste Kart Komponenti
function YemekKartListe({ yemek, favori, onFavoriToggle, onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 20, padding: 16, borderRadius: 8, background: hover ? C.cardHover : C.card, border: `1px solid ${hover ? "rgba(232,0,13,0.2)" : C.border}`, cursor: "pointer", transition: "all 0.2s" }}>
      
      {/* Fotoğraf */}
      <div style={{ width: 120, height: 90, borderRadius: 6, overflow: "hidden", flexShrink: 0, position: "relative" }}>
        {yemek.fotograf_url ? (
          <img src={yemek.fotograf_url} alt={yemek.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🍽️</div>
        )}
      </div>
      
      {/* Bilgiler */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{yemek.ad}</div>
            {yemek.sehirler?.ad && (
              <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>📍 {yemek.sehirler.ad}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {yemek.ortPuan && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#fbbf24", fontSize: 14 }}>★</span>
                <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{yemek.ortPuan}</span>
                <span style={{ color: C.muted, fontSize: 11 }}>({yemek.yorumSayisi})</span>
              </div>
            )}
            <button onClick={onFavoriToggle} style={{ width: 32, height: 32, borderRadius: "50%", background: favori ? "rgba(232,0,13,0.1)" : "transparent", border: `1px solid ${favori ? C.red : C.border}`, color: favori ? "#ff6b6b" : C.dim, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {favori ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
        {yemek.aciklama && (
          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{yemek.aciklama}</div>
        )}
        {yemek.tag && (
          <span style={{ display: "inline-block", marginTop: 8, fontSize: 9, padding: "4px 10px", background: "rgba(232,0,13,0.1)", border: `1px solid ${C.red}`, color: C.red, borderRadius: 12, letterSpacing: "0.1em" }}>{yemek.tag.toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}

function PageBtn({ aktif, disabled, onClick, label }) {
  return (
    <div onClick={!disabled ? onClick : undefined} 
      style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: `1px solid ${aktif ? C.red : C.border}`, color: aktif ? C.white : disabled ? "rgba(255,255,255,0.2)" : C.dim, background: aktif ? "rgba(232,0,13,0.1)" : "transparent", cursor: disabled ? "default" : "pointer", fontSize: 13, transition: "all 0.2s", fontWeight: aktif ? 700 : 400 }}>
      {label}
    </div>
  );
}

const selectStyle = { 
  background: "rgba(255,255,255,0.03)", 
  border: "1px solid rgba(255,255,255,0.07)", 
  color: "rgba(255,255,255,0.7)", 
  padding: "10px 14px", 
  fontSize: 13, 
  fontFamily: "inherit", 
  outline: "none", 
  cursor: "pointer", 
  borderRadius: 4 
};