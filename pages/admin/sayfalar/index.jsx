import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../../lib/supabase";
import AdminLayout from "../../../components/AdminLayout";

const C = {
  bg: "#080808", red: "#e8000d", white: "#ffffff",
  dim: "rgba(255,255,255,0.55)", muted: "rgba(255,255,255,0.25)",
  border: "rgba(255,255,255,0.07)", card: "rgba(255,255,255,0.03)",
};

export default function AdminSayfalar() {
  const router = useRouter();
  const [sayfalar, setSayfalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    getir();
  }, []);

  async function getir() {
    const { data } = await supabase.from("sayfalar").select("*").order("baslik");
    setSayfalar(data || []);
    setYukleniyor(false);
  }

  async function toggleAktif(id, aktif) {
    await supabase.from("sayfalar").update({ aktif: !aktif }).eq("id", id);
    getir();
  }

  return (
    <AdminLayout>
      <div style={{ padding: "32px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: C.white }}>Sayfalar</h1>
            <p style={{ margin: "8px 0 0", color: C.dim, fontSize: 14 }}>Hakkımızda, Gizlilik gibi statik sayfaları yönetin</p>
          </div>
          <button onClick={() => router.push("/admin/sayfalar/yeni")} style={{ padding: "12px 24px", background: C.red, border: "none", color: C.white, fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 4, fontWeight: 700 }}>
            + YENİ SAYFA
          </button>
        </div>

        {yukleniyor ? (
          <div style={{ textAlign: "center", padding: 48, color: C.dim }}>Yükleniyor...</div>
        ) : sayfalar.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: C.dim }}>Henüz sayfa eklenmemiş.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sayfalar.map(sayfa => (
              <div key={sayfa.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: C.white, marginBottom: 4 }}>{sayfa.baslik}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>/{sayfa.slug}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 12, background: sayfa.aktif ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: sayfa.aktif ? "#10b981" : "#ef4444" }}>
                    {sayfa.aktif ? "Aktif" : "Pasif"}
                  </span>
                  <button onClick={() => toggleAktif(sayfa.id, sayfa.aktif)} style={{ padding: "8px 14px", background: "transparent", border: `1px solid ${C.border}`, color: C.dim, fontSize: 11, cursor: "pointer", borderRadius: 4 }}>
                    {sayfa.aktif ? "Pasifleştir" : "Aktifleştir"}
                  </button>
                  <button onClick={() => router.push(`/admin/sayfalar/${sayfa.id}`)} style={{ padding: "8px 14px", background: "rgba(232,0,13,0.1)", border: `1px solid ${C.red}`, color: C.red, fontSize: 11, cursor: "pointer", borderRadius: 4 }}>
                    Düzenle
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
