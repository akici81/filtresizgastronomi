import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/AdminLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

export default function YemeklerAdmin() {
  const router = useRouter();
  const [yemekler, setYemekler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => { getir(); }, []);

  async function getir() {
    const { data } = await supabase
      .from("yemekler")
      .select("*, sehirler(ad)")
      .order("ad");
    setYemekler(data || []);
    setYukleniyor(false);
  }

  async function sil(id) {
    if (!confirm("Bu yemeği silmek istediğinize emin misiniz?")) return;
    await supabase.from("yemekler").delete().eq("id", id);
    getir();
  }

  return (
    <AdminLayout baslik="Yemekler">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <button onClick={() => router.push("/admin/yemekler/yeni")} style={{ background: RED, border: "none", color: WHITE, padding: "10px 24px", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>
          + YENİ YEMEK
        </button>
      </div>

      {yukleniyor ? <div style={{ color: WHITE_DIM }}>Yükleniyor...</div> : (
        <div style={{ border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid " + BORDER }}>
                {["Yemek", "Şehir", "Kategori", "Durum", "İşlemler"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {yemekler.map((y, i) => (
                <tr key={y.id} style={{ borderBottom: "1px solid " + BORDER, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "12px 16px", color: WHITE, fontWeight: 600 }}>{y.ad}</td>
                  <td style={{ padding: "12px 16px", color: WHITE_DIM }}>{y.sehirler?.ad || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {y.tag && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, border: "1px solid rgba(232,0,13,0.3)", color: RED }}>{y.tag}</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: y.aktif ? "rgba(0,200,80,0.15)" : "rgba(255,0,0,0.1)", color: y.aktif ? "#00c850" : RED }}>
                      {y.aktif ? "AKTİF" : "PASİF"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", display: "flex", gap: 8 }}>
                    <button onClick={() => router.push("/admin/yemekler/" + y.id)} style={{ background: "transparent", border: "1px solid " + BORDER, color: WHITE_DIM, padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Düzenle</button>
                    <button onClick={() => sil(y.id)} style={{ background: "transparent", border: "1px solid rgba(232,0,13,0.3)", color: RED, padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {yemekler.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: WHITE_DIM, fontStyle: "italic" }}>Henüz yemek eklenmemiş.</div>}
        </div>
      )}
    </AdminLayout>
  );
}
