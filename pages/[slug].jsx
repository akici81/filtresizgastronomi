import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabase";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)",
};

export default function DinamikSayfa() {
  const router = useRouter();
  const { slug } = router.query;
  const [sayfa, setSayfa] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bulunamadi, setBulunamadi] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getir();
  }, [slug]);

  async function getir() {
    const { data } = await supabase.from("sayfalar").select("*").eq("slug", slug).eq("aktif", true).single();
    if (data) {
      setSayfa(data);
    } else {
      setBulunamadi(true);
    }
    setYukleniyor(false);
  }

  // Basit Markdown parser
  function parseMarkdown(text) {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\n/g, "<br />");
  }

  if (yukleniyor) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: `2px solid ${C.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} body{margin:0}`}</style>
    </div>
  );

  if (bulunamadi) return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.white, fontFamily: "system-ui, sans-serif" }}>
      <Nav />
      <div style={{ paddingTop: 150, textAlign: "center" }}>
        <div style={{ fontSize: 80, marginBottom: 24 }}>404</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Sayfa Bulunamadı</h1>
        <p style={{ color: C.dim, marginBottom: 32 }}>Aradığınız sayfa mevcut değil veya kaldırılmış olabilir.</p>
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

      {/* Hero */}
      <div style={{ padding: "140px 48px 60px", background: "linear-gradient(180deg, rgba(232,0,13,0.04) 0%, transparent 100%)", textAlign: "center" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, fontFamily: "'Georgia', serif" }}>{sayfa.baslik}</h1>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 48px 80px" }}>
        <div 
          style={{ fontSize: 16, color: C.dim, lineHeight: 1.9 }}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(sayfa.icerik) }}
        />
      </div>

      <Footer />
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        h1, h2, h3 { color: #ffffff; font-family: 'Georgia', serif; margin: 32px 0 16px; }
        h2 { font-size: 24px; }
        h3 { font-size: 18px; }
        strong { color: #ffffff; }
      `}</style>
    </div>
  );
}