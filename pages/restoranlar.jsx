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

export default function RestoranlarSayfasi() {
  const router = useRouter();
  const [restoranlar, setRestoranlar] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [toplam, setToplam] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const PER_PAGE = 18;
  const [aramaMetni, setAramaMetni] = useState("");
  const [seciliSehir, setSeciliSehir] = useState("");
  const [sadecePremium, setSadecePremium] = useState(false);
  const [gorunumTipi, setGorunumTipi] = useState("grid");
  const [kullanici, setKullanici] = useState(null);
  const [favoriler, setFavoriler] = useState([]);

  useEffect(() => {
    supabase.from("sehirler").select("id,ad").eq("aktif", true).order("ad").then(({ data }) => setSehirler(data || []));
    supabase.auth.getUser().then(({ data: { user } }) => {
      setKullanici(user);
      if (user) getFavoriler(user.id);
    });
  }, []);

  useEffect(() => { getir(); }, [aramaMetni, seciliSehir, sadecePremium, sayfa]);

  async function getir() {
    setYukleniyor(true);
    let q = supabase.from("restoranlar").select("*,sehirler(ad,slug)", { count: "exact" }).eq("aktif", true);
    if (aramaMetni) q = q.ilike("ad", `%${aramaMetni}%`);
    if (seciliSehir) q = q.eq("sehir_id", seciliSehir);
    if (sadecePremium) q = q.eq("premium", true);
    q = q.order("premium", { ascending: false }).order("ad").range((sayfa - 1) * PER_PAGE, sayfa * PER_PAGE - 1);
    const { data, count } = await q;

    // Her restoran için ortalama puanı al
    if (data && data.length > 0) {
      const restoranIds = data.map(r => r.id);
      const { data: puanlar } = await supabase
        .from("degerlendirmeler")
        .select("restoran_id, puan")
        .in("restoran_id", restoranIds);
      
      const puanMap = {};
      if (puanlar) {
        puanlar.forEach(p => {
          if (!puanMap[p.restoran_id]) puanMap[p.restoran_id] = { toplam: 0, sayi: 0 };
          puanMap[p.restoran_id].toplam += p.puan;
          puanMap[p.restoran_id].sayi++;
        });
      }
      
      data.forEach(r => {
        if (puanMap[r.id]) {
          r.ortPuan = (puanMap[r.id].toplam / puanMap[r.id].sayi).toFixed(1);
          r.yorumSayisi = puanMap[r.id].sayi;
        }
      });
    }

    setRestoranlar(data || []); 
    setToplam(count || 0); 
    setYukleniyor(false);
  }

  async function getFavoriler(userId) {
    const { data } = await supabase.from("favoriler").select("restoran_id").eq("kullanici_id", userId);
    setFavoriler(data ? data.filter(f => f.restoran_id).map(f => f.restoran_id) : []);
  }

  async function toggleFavori(e, restoranId) {
    e.stopPropagation();
    if (!kullanici) { router.push("/giris"); return; }
    
    if (favoriler.includes(restoranId)) {
      await supabase.from("favoriler").delete().eq("kullanici_id", kullanici.id).eq("restoran_id", restoranId);
      setFavoriler(favoriler.filter(id => id !== restoranId));
    } else {
      await supabase.from("favoriler").insert({ kullanici_id: kullanici.id, restoran_id: restoranId });
      setFavoriler([...favoriler, restoranId]);
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
          <h1 style={{ margin: "0 0 8px", fontSize: 48, fontWeight: 900, fontFamily: "'Georgia', serif" }}>Restoranlar</h1>
          <p style={{ margin: 0, fontSize: 15, color: C.dim }}>{toplam} restoran · Tüm Türkiye'de</p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 48px 80px" }}>
        {/* Filtreler */}
        <div style={{ display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "10px 14px", flex: 1, minWidth: 200 }}>
            <span style={{ color: C.muted }}>🔍</span>
            <input value={aramaMetni} onChange={e => { setAramaMetni(e.target.value); setSayfa(1); }} placeholder="Restoran ara..." style={{ background: "transparent", border: "none", color: C.white, fontSize: 13, fontFamily: "inherit", outline: "none", flex: 1 }} />
          </div>
          <select value={seciliSehir} onChange={e => { setSeciliSehir(e.target.value); setSayfa(1); }} style={selectStyle}>
            <option value="">Tüm Şehirler</option>
            {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </select>
          <div onClick={() => { setSadecePremium(!sadecePremium); setSayfa(1); }} style={{ fontSize: 11, padding: "10px 16px", borderRadius: 4, cursor: "pointer", border: `1px solid ${sadecePremium ? "#fbbf24" : C.border}`, color: sadecePremium ? "#fbbf24" : C.dim, background: sadecePremium ? "rgba(251,191,36,0.08)" : "transparent", transition: "all 0.2s", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 6 }}>
            ⭐ ÖNERİLENLER
          </div>
          
          {/* Görünüm Toggle */}
          <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 4, overflow: "hidden" }}>
            <button onClick={() => setGorunumTipi("grid")} style={{ padding: "10px 14px", background: gorunumTipi === "grid" ? "rgba(232,0,13,0.1)" : "transparent", border: "none", color: gorunumTipi === "grid" ? C.white : C.dim, cursor: "pointer", fontSize: 14 }}>▦</button>
            <button onClick={() => setGorunumTipi("liste")} style={{ padding: "10px 14px", background: gorunumTipi === "liste" ? "rgba(232,0,13,0.1)" : "transparent", border: "none", borderLeft: `1px solid ${C.border}`, color: gorunumTipi === "liste" ? C.white : C.dim, cursor: "pointer", fontSize: 14 }}>☰</button>
          </div>
        </div>

        {/* İçerik */}
        {yukleniyor ? (
          <div style={{ display: "grid", gridTemplateColumns: gorunumTipi === "grid" ? "repeat(auto-fill, minmax(300px, 1fr))" : "1fr", gap: 16 }}>
            {[...Array(9)].map((_, i) => <div key={i} style={{ height: gorunumTipi === "grid" ? 280 : 120, background: C.card, borderRadius: 8, border: `1px solid ${C.border}`, animation: "pulse 1.5s infinite" }} />)}
          </div>
        ) : restoranlar.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.dim }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏪</div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Sonuç bulunamadı</div>
            <div style={{ fontSize: 14 }}>Farklı filtreler deneyin</div>
          </div>
        ) : gorunumTipi === "grid" ? (
          // GRID GÖRÜNÜMÜ
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {restoranlar.map(r => (
              <RestoranKartGrid
                key={r.id}
                restoran={r}
                favori={favoriler.includes(r.id)}
                onFavoriToggle={(e) => toggleFavori(e, r.id)}
                onClick={() => router.push(`/restoran/${r.slug}`)}
              />
            ))}
          </div>
        ) : (
          // LİSTE GÖRÜNÜMÜ
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {restoranlar.map(r => (
              <RestoranKartListe
                key={r.id}
                restoran={r}
                favori={favoriler.includes(r.id)}
                onFavoriToggle={(e) => toggleFavori(e, r.id)}
                onClick={() => router.push(`/restoran/${r.slug}`)}
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
      <style>{`* { box-sizing: border-box; } body { margin: 0; } input::placeholder { color: rgba(255,255,255,0.3); } option { background: #141414; } @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
    </div>
  );
}

// Grid Kart
function RestoranKartGrid({ restoran, favori, onFavoriToggle, onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, background: hover ? C.cardHover : C.card, transition: "all 0.25s", position: "relative" }}>
      
      {/* Fotoğraf */}
      <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
        {restoran.fotograf_url ? (
          <img src={restoran.fotograf_url} alt={restoran.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🏪</div>
        )}
        
        {/* Premium badge */}
        {restoran.premium && (
          <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(251,191,36,0.9)", color: "#000", fontSize: 9, padding: "4px 10px", letterSpacing: "0.1em", borderRadius: 4, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>⭐ ÖNERİLEN</span>
        )}
        
        {/* Favori butonu */}
        <button onClick={onFavoriToggle} style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(10px)", border: "none", color: favori ? "#ff6b6b" : C.white, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", opacity: hover || favori ? 1 : 0 }}>
          {favori ? "❤️" : "🤍"}
        </button>
        
        {/* Puan */}
        {restoran.ortPuan && (
          <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", padding: "4px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#fbbf24", fontSize: 12 }}>★</span>
            <span style={{ color: C.white, fontSize: 12, fontWeight: 700 }}>{restoran.ortPuan}</span>
          </div>
        )}
      </div>
      
      {/* Bilgiler */}
      <div style={{ padding: "16px" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.white, marginBottom: 6, fontFamily: "'Georgia', serif" }}>{restoran.ad}</div>
        {restoran.sehirler?.ad && (
          <div style={{ fontSize: 11, color: C.red, letterSpacing: "0.08em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <span>📍</span> {restoran.sehirler.ad.toUpperCase()}
          </div>
        )}
        {restoran.aciklama && (
          <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 10 }}>{restoran.aciklama}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
          {restoran.telefon && <span style={{ fontSize: 11, color: C.muted }}>📞 {restoran.telefon}</span>}
          {restoran.fiyat_araligi && <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{restoran.fiyat_araligi}</span>}
        </div>
      </div>
    </div>
  );
}

// Liste Kart
function RestoranKartListe({ restoran, favori, onFavoriToggle, onClick }) {
  const [hover, setHover] = useState(false);
  
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: "flex", gap: 20, padding: 16, borderRadius: 8, background: hover ? C.cardHover : C.card, border: `1px solid ${hover ? "rgba(232,0,13,0.2)" : C.border}`, cursor: "pointer", transition: "all 0.2s" }}>
      
      {/* Fotoğraf */}
      <div style={{ width: 140, height: 100, borderRadius: 6, overflow: "hidden", flexShrink: 0, position: "relative" }}>
        {restoran.fotograf_url ? (
          <img src={restoran.fotograf_url} alt={restoran.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🏪</div>
        )}
        {restoran.premium && (
          <span style={{ position: "absolute", top: 6, left: 6, background: "#fbbf24", color: "#000", fontSize: 8, padding: "2px 6px", borderRadius: 2, fontWeight: 700 }}>⭐</span>
        )}
      </div>
      
      {/* Bilgiler */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{restoran.ad}</div>
            {restoran.sehirler?.ad && (
              <div style={{ fontSize: 11, color: C.red, marginTop: 4 }}>📍 {restoran.sehirler.ad}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {restoran.ortPuan && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: "#fbbf24", fontSize: 14 }}>★</span>
                <span style={{ color: C.white, fontSize: 14, fontWeight: 700 }}>{restoran.ortPuan}</span>
                <span style={{ color: C.muted, fontSize: 11 }}>({restoran.yorumSayisi})</span>
              </div>
            )}
            <button onClick={onFavoriToggle} style={{ width: 32, height: 32, borderRadius: "50%", background: favori ? "rgba(232,0,13,0.1)" : "transparent", border: `1px solid ${favori ? C.red : C.border}`, color: favori ? "#ff6b6b" : C.dim, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {favori ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
        {restoran.aciklama && (
          <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 8 }}>{restoran.aciklama}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {restoran.telefon && <span style={{ fontSize: 11, color: C.muted }}>📞 {restoran.telefon}</span>}
          {restoran.fiyat_araligi && <span style={{ fontSize: 11, color: C.muted }}>{restoran.fiyat_araligi}</span>}
        </div>
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