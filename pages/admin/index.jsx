import { useState, useEffect } from "react";
import AdminLayout from "../../components/AdminLayout";
import { supabase } from "../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

export default function AdminDashboard() {
  const [istatistik, setIstatistik] = useState({ sehir: 0, yemek: 0, restoran: 0, sef: 0, kullanici: 0 });

  useEffect(() => {
    async function getIstatistik() {
      const [s, y, r, sf, k] = await Promise.all([
        supabase.from("sehirler").select("id", { count: "exact", head: true }),
        supabase.from("yemekler").select("id", { count: "exact", head: true }),
        supabase.from("restoranlar").select("id", { count: "exact", head: true }),
        supabase.from("sefler").select("id", { count: "exact", head: true }),
        supabase.from("kullanicilar").select("id", { count: "exact", head: true }),
      ]);
      setIstatistik({ sehir: s.count || 0, yemek: y.count || 0, restoran: r.count || 0, sef: sf.count || 0, kullanici: k.count || 0 });
    }
    getIstatistik();
  }, []);

  const kartlar = [
    { label: "Şehir", sayi: istatistik.sehir, icon: "🗺️", href: "/admin/sehirler" },
    { label: "Yemek", sayi: istatistik.yemek, icon: "🍽️", href: "/admin/yemekler" },
    { label: "Restoran", sayi: istatistik.restoran, icon: "🏪", href: "/admin/restoranlar" },
    { label: "Şef", sayi: istatistik.sef, icon: "👨‍🍳", href: "/admin/sefler" },
    { label: "Kullanıcı", sayi: istatistik.kullanici, icon: "👥", href: "/admin/kullanicilar" },
  ];

  return (
    <AdminLayout baslik="Dashboard">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
        {kartlar.map(k => (
          <div key={k.label} onClick={() => window.location.href = k.href} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid " + BORDER,
            borderRadius: 4, padding: "24px", cursor: "pointer", transition: "all 0.2s"
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.background = "rgba(232,0,13,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: RED, marginBottom: 4 }}>{k.sayi}</div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", color: WHITE_DIM }}>{k.label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + BORDER, borderRadius: 4, padding: "24px" }}>
        <div style={{ fontSize: 13, color: WHITE_DIM, marginBottom: 16, letterSpacing: "0.05em" }}>HIZLI ERİŞİM</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "+ Şehir Ekle", href: "/admin/sehirler/yeni" },
            { label: "+ Yemek Ekle", href: "/admin/yemekler/yeni" },
            { label: "+ Restoran Ekle", href: "/admin/restoranlar/yeni" },
            { label: "+ Şef Ekle", href: "/admin/sefler/yeni" },
          ].map(b => (
            <button key={b.label} onClick={() => window.location.href = b.href} style={{
              background: RED, border: "none", color: WHITE,
              padding: "10px 20px", fontSize: 12, letterSpacing: "0.1em",
              cursor: "pointer", borderRadius: 2, fontFamily: "inherit"
            }}>{b.label}</button>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
