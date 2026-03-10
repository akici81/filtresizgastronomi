import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../lib/supabase";
import AdminLayout from "../../../components/AdminLayout";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)", card: "rgba(255,255,255,0.03)",
};

export default function AdminSayfaDuzenle() {
  const router = useRouter();
  const { id } = router.query;
  const [sayfa, setSayfa] = useState({ baslik: "", slug: "", icerik: "", aktif: true });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    if (!id) return;
    if (id === "yeni") {
      setYukleniyor(false);
      return;
    }
    getir();
  }, [id]);

  async function getir() {
    const { data } = await supabase.from("sayfalar").select("*").eq("id", id).single();
    if (data) setSayfa(data);
    setYukleniyor(false);
  }

  async function kaydet() {
    if (!sayfa.baslik || !sayfa.slug) {
      setMesaj("Başlık ve slug zorunludur!");
      return;
    }
    setKaydediliyor(true);
    
    if (id === "yeni") {
      await supabase.from("sayfalar").insert({ ...sayfa });
    } else {
      await supabase.from("sayfalar").update({ ...sayfa, guncelleme_tarihi: new Date().toISOString() }).eq("id", id);
    }
    
    setMesaj("Kaydedildi!");
    setTimeout(() => router.push("/admin/sayfalar"), 1000);
    setKaydediliyor(false);
  }

  if (yukleniyor) return <AdminLayout><div style={{ padding: 48, textAlign: "center", color: C.dim }}>Yükleniyor...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ padding: "32px 48px", maxWidth: 900 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <div onClick={() => router.push("/admin/sayfalar")} style={{ fontSize: 12, color: C.red, cursor: "pointer", marginBottom: 8 }}>← Sayfalara Dön</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.white }}>
              {id === "yeni" ? "Yeni Sayfa" : "Sayfa Düzenle"}
            </h1>
          </div>
          <button onClick={kaydet} disabled={kaydediliyor} style={{ padding: "12px 28px", background: C.red, border: "none", color: C.white, fontSize: 13, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4, fontWeight: 700 }}>
            {kaydediliyor ? "KAYDEDİLİYOR..." : "KAYDET"}
          </button>
        </div>

        {mesaj && (
          <div style={{ padding: "12px 16px", background: mesaj.includes("!") && !mesaj.includes("Kaydedildi") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)", border: `1px solid ${mesaj.includes("!") && !mesaj.includes("Kaydedildi") ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: 4, color: mesaj.includes("!") && !mesaj.includes("Kaydedildi") ? "#ef4444" : "#10b981", fontSize: 13, marginBottom: 24 }}>
            {mesaj}
          </div>
        )}

        <div style={{ display: "grid", gap: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.1em", color: C.muted, display: "block", marginBottom: 8 }}>BAŞLIK</label>
              <input
                type="text"
                value={sayfa.baslik}
                onChange={e => setSayfa({ ...sayfa, baslik: e.target.value, slug: id === "yeni" ? e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") : sayfa.slug })}
                placeholder="Sayfa başlığı"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, letterSpacing: "0.1em", color: C.muted, display: "block", marginBottom: 8 }}>SLUG (URL)</label>
              <input
                type="text"
                value={sayfa.slug}
                onChange={e => setSayfa({ ...sayfa, slug: e.target.value })}
                placeholder="sayfa-url"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, letterSpacing: "0.1em", color: C.muted, display: "block", marginBottom: 8 }}>İÇERİK</label>
            <textarea
              value={sayfa.icerik || ""}
              onChange={e => setSayfa({ ...sayfa, icerik: e.target.value })}
              placeholder="Sayfa içeriği (Markdown desteklenir)"
              rows={20}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
              💡 Markdown kullanabilirsiniz: **kalın**, *italik*, # başlık
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              checked={sayfa.aktif}
              onChange={e => setSayfa({ ...sayfa, aktif: e.target.checked })}
              style={{ width: 18, height: 18 }}
            />
            <label style={{ fontSize: 14, color: C.dim }}>Sayfa aktif (yayında)</label>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 4,
  padding: "12px 14px",
  color: "#ffffff",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};