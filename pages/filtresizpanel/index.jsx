import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PanelLayout from "../../components/PanelLayout";
import { supabase } from "../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

export default function PanelDashboard() {
  const [istatistik, setIstatistik] = useState({ sehir: 0, yemek: 0, restoran: 0, sef: 0 });
  const [sonEklenen, setSonEklenen] = useState([]);

  useEffect(() => {
    async function getir() {
      const [s, y, r, sf] = await Promise.all([
        supabase.from("sehirler").select("id", { count: "exact", head: true }),
        supabase.from("yemekler").select("id", { count: "exact", head: true }),
        supabase.from("restoranlar").select("id", { count: "exact", head: true }),
        supabase.from("sefler").select("id", { count: "exact", head: true }),
      ]);
      setIstatistik({ sehir: s.count || 0, yemek: y.count || 0, restoran: r.count || 0, sef: sf.count || 0 });

      // Son eklenen yemekler
      const { data } = await supabase.from("yemekler").select("id, ad, olusturma_tarihi, sehirler(ad)").order("olusturma_tarihi", { ascending: false }).limit(5);
      setSonEklenen(data || []);
    }
    getir();
  }, []);

  return (
    <PanelLayout baslik="İçerik Paneli">

      {/* İstatistikler */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16, marginBottom: 40 }}>
        {[
          { label: "Şehir", sayi: istatistik.sehir, icon: "🗺️" },
          { label: "Yemek", sayi: istatistik.yemek, icon: "🍽️" },
          { label: "Restoran", sayi: istatistik.restoran, icon: "🏪" },
          { label: "Şef", sayi: istatistik.sef, icon: "👨‍🍳" },
        ].map(k => (
          <div key={k.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid " + BORDER, borderRadius: 4, padding: "24px" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: RED, marginBottom: 4 }}>{k.sayi}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: WHITE_DIM }}>{k.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Hızlı ekle */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + BORDER, borderRadius: 4, padding: "24px", marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: WHITE_DIM, marginBottom: 16, letterSpacing: "0.08em" }}>HIZLI EKLE</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "+ Şehir", href: "/filtresizpanel/sehirler/yeni" },
            { label: "+ Yemek", href: "/filtresizpanel/yemekler/yeni" },
            { label: "+ Restoran", href: "/filtresizpanel/restoranlar/yeni" },
            { label: "+ Şef", href: "/filtresizpanel/sefler/yeni" },
          ].map(b => (
            <button key={b.label} onClick={() => window.location.href = b.href} style={{
              background: RED, border: "none", color: WHITE, padding: "10px 20px",
              fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2, fontFamily: "inherit"
            }}>{b.label}</button>
          ))}
        </div>
      </div>

      {/* Son eklenenler */}
      {sonEklenen.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + BORDER, borderRadius: 4, padding: "24px" }}>
          <div style={{ fontSize: 11, color: WHITE_DIM, marginBottom: 16, letterSpacing: "0.08em" }}>SON EKLENEN YEMEKLER</div>
          {sonEklenen.map(y => (
            <div key={y.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid " + BORDER }}>
              <div style={{ fontSize: 13, color: WHITE }}>{y.ad}</div>
              <div style={{ fontSize: 12, color: WHITE_DIM }}>{y.sehirler?.ad} · {new Date(y.olusturma_tarihi).toLocaleDateString("tr-TR")}</div>
            </div>
          ))}
        </div>
      )}
    </PanelLayout>
  );
}
