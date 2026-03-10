import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)", card: "rgba(255,255,255,0.03)", cardHover: "rgba(255,255,255,0.06)",
};

function AramaKutusu() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sonuclar, setSonuclar] = useState([]);
  const [acik, setAcik] = useState(false);
  const ref = useRef();
  
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setAcik(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  
  useEffect(() => {
    if (q.length < 2) { setSonuclar([]); setAcik(false); return; }
    const t = setTimeout(async () => {
      const [y, s, r] = await Promise.all([
        supabase.from("yemekler").select("id,ad,slug,sehirler(ad)").ilike("ad", `%${q}%`).limit(4),
        supabase.from("sehirler").select("id,ad,slug").ilike("ad", `%${q}%`).limit(3),
        supabase.from("restoranlar").select("id,ad,slug").ilike("ad", `%${q}%`).limit(3),
      ]);
      const liste = [
        ...(y.data || []).map(x => ({ ...x, tip: "yemek", url: `/yemek/${x.slug}` })),
        ...(s.data || []).map(x => ({ ...x, tip: "sehir", url: `/sehir/${x.slug}` })),
        ...(r.data || []).map(x => ({ ...x, tip: "restoran", url: `/restoran/${x.slug}` })),
      ];
      setSonuclar(liste);
      setAcik(liste.length > 0);
    }, 280);
    return () => clearTimeout(t);
  }, [q]);
  
  const tipRenk = { yemek: C.red, sehir: "#f59e0b", restoran: "#10b981" };
  
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", maxWidth: 600 }}>
      <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.06)", border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6, overflow: "hidden", backdropFilter: "blur(10px)" }}>
        <span style={{ padding: "0 16px", color: C.dim }}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Yemek, şehir veya restoran ara..." style={{ flex: 1, background: "transparent", border: "none", padding: "16px 0", color: C.white, fontSize: 15, fontFamily: "inherit", outline: "none" }} />
        {q && <button onClick={() => { setQ(""); setSonuclar([]); setAcik(false); }} style={{ background: "transparent", border: "none", color: C.dim, padding: "0 12px", cursor: "pointer", fontSize: 20 }}>×</button>}
        <button onClick={() => q && router.push(`/ara?q=${q}`)} style={{ background: C.red, border: "none", color: C.white, padding: "16px 24px", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>ARA</button>
      </div>
      {acik && sonuclar.length > 0 && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, background: "#141414", border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.7)", zIndex: 100 }}>
          {sonuclar.map(s => (
            <div key={`${s.tip}-${s.id}`} onClick={() => { router.push(s.url); setAcik(false); setQ(""); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", borderBottom: `1px solid ${C.border}`, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontSize: 9, padding: "2px 8px", border: `1px solid ${tipRenk[s.tip]}44`, color: tipRenk[s.tip], letterSpacing: "0.1em", borderRadius: 2, flexShrink: 0 }}>{s.tip.toUpperCase()}</span>
              <span style={{ fontSize: 13, color: C.white }}>{s.ad}</span>
              {s.sehirler?.ad && <span style={{ fontSize: 11, color: C.muted, marginLeft: "auto" }}>{s.sehirler.ad}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AnaSayfa() {
  const router = useRouter();
  const [yemekler, setYemekler] = useState([]);
  const [sehirler, setSehirler] = useState([]);
  const [restoranlar, setRestoranlar] = useState([]);
  const [stats, setStats] = useState({ y: 0, s: 0, r: 0 });

  useEffect(() => {
    async function getir() {
      const [y, s, r, yc, sc, rc] = await Promise.all([
        supabase.from("yemekler").select("*,sehirler(ad)").eq("aktif", true).limit(8),
        supabase.from("sehirler").select("*").eq("aktif", true).limit(12),
        supabase.from("restoranlar").select("*,sehirler(ad)").eq("aktif", true).order("premium", { ascending: false }).limit(6),
        supabase.from("yemekler").select("id", { count: "exact", head: true }),
        supabase.from("sehirler").select("id", { count: "exact", head: true }),
        supabase.from("restoranlar").select("id", { count: "exact", head: true }),
      ]);
      setYemekler(y.data || []);
      setSehirler(s.data || []);
      setRestoranlar(r.data || []);
      setStats({ y: yc.count || 0, s: sc.count || 0, r: rc.count || 0 });
    }
    getir();
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav transparent />

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 48px" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 70% 50% at 50% 40%, rgba(232,0,13,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: 820 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.35em", color: C.red, marginBottom: 24 }}>TÜRKİYE'NİN GASTRONOMİ HAFIZASI</div>
          <h1 style={{ margin: "0 0 24px", fontSize: "clamp(52px, 9vw, 96px)", fontWeight: 900, letterSpacing: "-0.02em", fontFamily: "'Georgia', serif", lineHeight: 0.95 }}>
            Filtresiz<br /><span style={{ color: C.red }}>Gastronomi</span>
          </h1>
          <p style={{ fontSize: 16, color: C.dim, marginBottom: 48, lineHeight: 1.75, maxWidth: 480, margin: "0 auto 48px" }}>
            Yöresel lezzetleri keşfedin. Hikayeleri okuyun.<br />En iyi restoranları bulun. Deneyimlerinizi paylaşın.
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 72 }}>
            <AramaKutusu />
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 64 }}>
            {[[stats.y || "500+", "Yöresel Yemek"], [stats.s || "81", "İl"], [stats.r || "1000+", "Restoran"]].map(([n, l]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: C.white, fontFamily: "'Georgia', serif" }}>{n}</div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.dim, marginTop: 6 }}>{l.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: C.muted, fontSize: 9, letterSpacing: "0.2em" }}>
          <span>KAYDIRIN</span>
          <div style={{ width: 1, height: 40, background: `linear-gradient(${C.red}, transparent)` }} />
        </div>
      </section>

      {/* POPÜLER YEMEKLER */}
      <section style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.25em", marginBottom: 10 }}>✦ KEŞFET</div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, fontFamily: "'Georgia', serif" }}>Popüler Yemekler</h2>
            </div>
            <div onClick={() => router.push("/yemekler")} style={{ fontSize: 12, color: C.dim, cursor: "pointer", letterSpacing: "0.06em" }} onMouseEnter={e => e.target.style.color = C.red} onMouseLeave={e => e.target.style.color = C.dim}>Tüm Yemekler →</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {yemekler.map(y => (
              <div key={y.id} onClick={() => router.push(`/yemek/${y.slug}`)} style={{ cursor: "pointer", borderRadius: 6, overflow: "hidden", border: `1px solid ${C.border}`, background: C.card, transition: "all 0.25s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(232,0,13,0.3)"; e.currentTarget.style.background = C.cardHover; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}>
                <div style={{ height: 196, overflow: "hidden", position: "relative" }}>
                  {y.fotograf_url ? <img src={y.fotograf_url} alt={y.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44 }}>🍽️</div>}
                  {y.tag && <span style={{ position: "absolute", top: 12, left: 12, background: C.red, color: C.white, fontSize: 9, padding: "3px 8px", letterSpacing: "0.12em", borderRadius: 2 }}>{y.tag.toUpperCase()}</span>}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 6, fontFamily: "'Georgia', serif" }}>{y.ad}</div>
                  {y.sehirler?.ad && <div style={{ fontSize: 11, color: C.red, letterSpacing: "0.08em", marginBottom: 6 }}>📍 {y.sehirler.ad}</div>}
                  {y.aciklama && <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{y.aciklama}</div>}
                </div>
              </div>
            ))}
            {yemekler.length === 0 && [...Array(8)].map((_, i) => <div key={i} style={{ height: 300, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6 }} />)}
          </div>
        </div>
      </section>

      {/* ŞEHİRLER */}
      <section style={{ padding: "96px 48px", background: "rgba(255,255,255,0.012)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.25em", marginBottom: 10 }}>✦ 81 İL</div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, fontFamily: "'Georgia', serif" }}>Şehre Göre Keşfet</h2>
            </div>
            <div onClick={() => router.push("/sehirler")} style={{ fontSize: 12, color: C.dim, cursor: "pointer", letterSpacing: "0.06em" }} onMouseEnter={e => e.target.style.color = C.red} onMouseLeave={e => e.target.style.color = C.dim}>Tüm Şehirler →</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {sehirler.map(s => (
              <SehirKarti key={s.id} sehir={s} onClick={() => router.push(`/sehir/${s.slug}`)} />
            ))}
            {sehirler.length === 0 && [...Array(6)].map((_, i) => <div key={i} style={{ height: 160, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6 }} />)}
          </div>
        </div>
      </section>

      {/* RESTORANLAR */}
      <section style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.25em", marginBottom: 10 }}>✦ TAVSİYE EDİLEN</div>
              <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, fontFamily: "'Georgia', serif" }}>Öne Çıkan Restoranlar</h2>
            </div>
            <div onClick={() => router.push("/restoranlar")} style={{ fontSize: 12, color: C.dim, cursor: "pointer", letterSpacing: "0.06em" }} onMouseEnter={e => e.target.style.color = C.red} onMouseLeave={e => e.target.style.color = C.dim}>Tüm Restoranlar →</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
            {restoranlar.map(r => (
              <div key={r.id} onClick={() => router.push(`/restoran/${r.slug}`)} style={{ display: "flex", gap: 16, padding: 16, borderRadius: 6, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = "rgba(232,0,13,0.25)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ width: 84, height: 84, borderRadius: 4, overflow: "hidden", flexShrink: 0 }}>
                  {r.fotograf_url ? <img src={r.fotograf_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🏪</div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.white, fontFamily: "'Georgia', serif" }}>{r.ad}</div>
                    {r.premium && <span style={{ fontSize: 8, padding: "2px 6px", border: "1px solid #fbbf2466", color: "#fbbf24", borderRadius: 2, flexShrink: 0 }}>ÖNERİLEN</span>}
                  </div>
                  {r.sehirler?.ad && <div style={{ fontSize: 11, color: C.red, marginBottom: 4 }}>📍 {r.sehirler.ad}</div>}
                  {r.aciklama && <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.aciklama}</div>}
                </div>
              </div>
            ))}
            {restoranlar.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 48, color: C.dim, fontStyle: "italic" }}>Panelden restoran ekleyerek burayı doldurun!</div>}
          </div>
        </div>
      </section>

      {/* GASTRONOMİ LİSTELERİ */}
      <section style={{ padding: "96px 48px", background: "rgba(255,255,255,0.012)", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.25em", marginBottom: 10 }}>✦ EDİTÖR SEÇİMLERİ</div>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, fontFamily: "'Georgia', serif" }}>Gastronomi Listeleri</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { icon: "🔥", baslik: "Türkiye'nin En İyi 20 Kebabı", alt: "20 yemek", renk: "#ef4444" },
              { icon: "🍯", baslik: "Anadolu'nun En İyi Tatlıları", alt: "15 yemek", renk: "#f59e0b" },
              { icon: "🌿", baslik: "Sokak Lezzetleri", alt: "25 yemek", renk: "#10b981" },
              { icon: "⭐", baslik: "UNESCO Gastronomi Şehirleri", alt: "7 şehir", renk: "#8b5cf6" },
            ].map(l => (
              <div key={l.baslik} style={{ padding: 24, background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = C.cardHover; e.currentTarget.style.borderColor = `${l.renk}44`; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.card; e.currentTarget.style.borderColor = C.border; }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{l.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 8, fontFamily: "'Georgia', serif" }}>{l.baslik}</div>
                <div style={{ fontSize: 10, color: l.renk, letterSpacing: "0.12em" }}>{l.alt.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "96px 48px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: C.red, letterSpacing: "0.25em", marginBottom: 16 }}>✦ TOPLULUĞA KATIL</div>
          <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, fontFamily: "'Georgia', serif", margin: "0 0 20px", lineHeight: 1.2 }}>
            Gastronomi hafızasını<br />birlikte yazıyoruz
          </h2>
          <p style={{ fontSize: 16, color: C.dim, lineHeight: 1.75, marginBottom: 40 }}>
            Yöresel tarifleri ekleyin, restoranları değerlendirin,<br />gastronomi öğrencilerine rehber olun.
          </p>
          <button onClick={() => router.push("/kayit")} style={{ background: C.red, border: "none", color: C.white, padding: "16px 40px", fontSize: 13, letterSpacing: "0.12em", cursor: "pointer", borderRadius: 4, fontFamily: "inherit", fontWeight: 800 }}
            onMouseEnter={e => e.currentTarget.style.background = "#c8000b"}
            onMouseLeave={e => e.currentTarget.style.background = C.red}>
            ÜYE OL — ÜCRETSİZ
          </button>
        </div>
      </section>

      <Footer />

      <style>{`* { box-sizing: border-box; } body { margin: 0; background: #080808; } input::placeholder { color: rgba(255,255,255,0.3); } @media (max-width: 768px) { section { padding: 64px 20px !important; } }`}</style>
    </div>
  );
}

function SehirKarti({ sehir, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ cursor: "pointer", position: "relative", height: 160, borderRadius: 6, overflow: "hidden", border: `1px solid ${hover ? "rgba(232,0,13,0.3)" : C.border}`, transition: "all 0.25s" }}>
      {sehir.fotograf_url ? <img src={sehir.fotograf_url} alt={sehir.ad} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform 0.4s" }} /> : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, rgba(232,0,13,0.12), rgba(0,0,0,0.8))` }} />}
      <div style={{ position: "absolute", inset: 0, background: hover ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.5)", transition: "background 0.3s" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 16, pointerEvents: "none" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.white, fontFamily: "'Georgia', serif" }}>{sehir.ad}</div>
        {sehir.kapat_etiketi && <div style={{ fontSize: 9, color: C.red, letterSpacing: "0.1em", marginTop: 2 }}>{sehir.kapat_etiketi.toUpperCase()}</div>}
      </div>
    </div>
  );
}