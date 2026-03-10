import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabase";
import AdminLayout from "../../components/AdminLayout";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)", card: "rgba(255,255,255,0.03)",
};

export default function AdminAyarlar() {
  const router = useRouter();
  const [ayarlar, setAyarlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    getir();
  }, []);

  async function getir() {
    const { data } = await supabase.from("site_ayarlari").select("*").order("anahtar");
    setAyarlar(data || []);
    setYukleniyor(false);
  }

  async function kaydet() {
    setKaydediliyor(true);
    for (const ayar of ayarlar) {
      await supabase.from("site_ayarlari").update({ deger: ayar.deger, guncelleme_tarihi: new Date().toISOString() }).eq("id", ayar.id);
    }
    setMesaj("Ayarlar kaydedildi!");
    setTimeout(() => setMesaj(""), 3000);
    setKaydediliyor(false);
  }

  function guncelle(id, deger) {
    setAyarlar(ayarlar.map(a => a.id === id ? { ...a, deger } : a));
  }

  const gruplar = {
    "Site Bilgileri": ["site_adi", "site_slogan", "site_aciklama"],
    "Sosyal Medya": ["instagram", "twitter", "facebook"],
    "İletişim": ["iletisim_email", "iletisim_telefon"],
  };

  if (yukleniyor) return <AdminLayout><div style={{ padding: 48, textAlign: "center", color: C.dim }}>Yükleniyor...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ padding: "32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.white }}>Site Ayarları</h1>
            <p style={{ margin: "8px 0 0", color: C.dim, fontSize: 14 }}>Genel site ayarlarını buradan yönetin</p>
          </div>
          <button onClick={kaydet} disabled={kaydediliyor} style={{ padding: "12px 28px", background: C.red, border: "none", color: C.white, fontSize: 13, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4, fontWeight: 700 }}>
            {kaydediliyor ? "KAYDEDİLİYOR..." : "KAYDET"}
          </button>
        </div>

        {mesaj && (
          <div style={{ padding: "12px 16px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 4, color: "#10b981", fontSize: 13, marginBottom: 24 }}>
            ✓ {mesaj}
          </div>
        )}

        {Object.entries(gruplar).map(([grup, anahtarlar]) => (
          <div key={grup} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 12, letterSpacing: "0.15em", color: C.red, marginBottom: 20 }}>{grup.toUpperCase()}</h2>
            <div style={{ display: "grid", gap: 16 }}>
              {ayarlar.filter(a => anahtarlar.includes(a.anahtar)).map(ayar => (
                <div key={ayar.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
                  <label style={{ fontSize: 11, letterSpacing: "0.1em", color: C.muted, display: "block", marginBottom: 8 }}>
                    {ayar.aciklama || ayar.anahtar.toUpperCase().replace(/_/g, " ")}
                  </label>
                  {ayar.anahtar === "site_aciklama" ? (
                    <textarea
                      value={ayar.deger || ""}
                      onChange={e => guncelle(ayar.id, e.target.value)}
                      rows={3}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 4, padding: "12px 14px", color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={ayar.deger || ""}
                      onChange={e => guncelle(ayar.id, e.target.value)}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 4, padding: "12px 14px", color: C.white, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}