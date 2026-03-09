import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/AdminLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

export default function RestoranlarAdmin() {
  const router = useRouter();
  const [restoranlar, setRestoranlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => { getir(); }, []);

  async function getir() {
    const { data } = await supabase.from("restoranlar").select("*, sehirler(ad)").order("ad");
    setRestoranlar(data || []);
    setYukleniyor(false);
  }

  async function sil(id) {
    if (!confirm("Bu restoranı silmek istediğinize emin misiniz?")) return;
    await supabase.from("restoranlar").delete().eq("id", id);
    getir();
  }

  return (
    <AdminLayout baslik="Restoranlar">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <button onClick={() => router.push("/admin/restoranlar/yeni")} style={{ background: RED, border: "none", color: WHITE, padding: "10px 24px", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>
          + YENİ RESTORAN
        </button>
      </div>

      {yukleniyor ? <div style={{ color: WHITE_DIM }}>Yükleniyor...</div> : (
        <div style={{ border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid " + BORDER }}>
                {["Restoran", "Şehir", "Telefon", "Premium", "Durum", "İşlemler"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {restoranlar.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: "1px solid " + BORDER, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "12px 16px", color: WHITE, fontWeight: 600 }}>{r.ad}</td>
                  <td style={{ padding: "12px 16px", color: WHITE_DIM }}>{r.sehirler?.ad || "-"}</td>
                  <td style={{ padding: "12px 16px", color: WHITE_DIM }}>{r.telefon || "-"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: r.premium ? "rgba(232,0,13,0.15)" : "rgba(255,255,255,0.05)", color: r.premium ? RED : WHITE_DIM }}>
                      {r.premium ? "PREMİUM" : "STANDART"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: r.aktif ? "rgba(0,200,80,0.15)" : "rgba(255,0,0,0.1)", color: r.aktif ? "#00c850" : RED }}>
                      {r.aktif ? "AKTİF" : "PASİF"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", display: "flex", gap: 8 }}>
                    <button onClick={() => router.push("/admin/restoranlar/" + r.id)} style={{ background: "transparent", border: "1px solid " + BORDER, color: WHITE_DIM, padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Düzenle</button>
                    <button onClick={() => sil(r.id)} style={{ background: "transparent", border: "1px solid rgba(232,0,13,0.3)", color: RED, padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Sil</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {restoranlar.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: WHITE_DIM, fontStyle: "italic" }}>Henüz restoran eklenmemiş.</div>}
        </div>
      )}
    </AdminLayout>
  );
}
