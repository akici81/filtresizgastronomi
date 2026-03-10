import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PanelLayout from "../../../components/PanelLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

export default function YemeklerPanel() {
  const router = useRouter();
  const [yemekler, setYemekler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState("");
  const [filtre, setFiltre] = useState("");

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

  const filtrelenmis = yemekler.filter(y => {
    const aramaEslesen = y.ad.toLowerCase().includes(arama.toLowerCase()) ||
      (y.sehirler?.ad || "").toLowerCase().includes(arama.toLowerCase());
    const filtreEslesen = !filtre || y.tag === filtre;
    return aramaEslesen && filtreEslesen;
  });

  const tagler = [...new Set(yemekler.map(y => y.tag).filter(Boolean))];

  return (
    <PanelLayout baslik="Yemekler">
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={arama} onChange={e => setArama(e.target.value)}
          placeholder="🔍  Yemek veya şehir ara..."
          style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "9px 14px", color: WHITE, fontSize: 13, fontFamily: "inherit", outline: "none" }}
          onFocus={e => e.target.style.borderColor = RED}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
        <select value={filtre} onChange={e => setFiltre(e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "9px 14px", color: filtre ? WHITE : WHITE_DIM, fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
          <option value="">Tüm Kategoriler</option>
          {tagler.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => router.push("/filtresizpanel/yemekler/yeni")} style={{ background: RED, border: "none", color: WHITE, padding: "9px 20px", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2, fontFamily: "inherit", fontWeight: 700, whiteSpace: "nowrap" }}>
          + YENİ YEMEK
        </button>
      </div>

      {/* Tablo */}
      {yukleniyor ? (
        <div style={{ textAlign: "center", padding: 40, color: WHITE_DIM }}>Yükleniyor...</div>
      ) : (
        <div style={{ border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid " + BORDER }}>
                {["Fotoğraf", "Yemek Adı", "Şehir", "Kategori", "Durum", "İşlemler"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrelenmis.map((y, i) => (
                <tr key={y.id} style={{ borderBottom: "1px solid " + BORDER, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "10px 16px" }}>
                    {y.fotograf_url
                      ? <img src={y.fotograf_url} alt={y.ad} style={{ width: 48, height: 36, objectFit: "cover", borderRadius: 2, border: "1px solid " + BORDER }} />
                      : <div style={{ width: 48, height: 36, background: "rgba(255,255,255,0.03)", borderRadius: 2, border: "1px solid " + BORDER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🍽️</div>
                    }
                  </td>
                  <td style={{ padding: "10px 16px", color: WHITE, fontWeight: 600 }}>{y.ad}</td>
                  <td style={{ padding: "10px 16px", color: WHITE_DIM }}>{y.sehirler?.ad || "-"}</td>
                  <td style={{ padding: "10px 16px" }}>
                    {y.tag && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, border: "1px solid rgba(232,0,13,0.3)", color: RED }}>{y.tag}</span>}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, background: y.aktif ? "rgba(0,200,80,0.1)" : "rgba(255,0,0,0.1)", color: y.aktif ? "#00c850" : RED }}>
                      {y.aktif ? "AKTİF" : "PASİF"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => router.push("/filtresizpanel/yemekler/" + y.id)} style={{ background: "transparent", border: "1px solid " + BORDER, color: WHITE_DIM, padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Düzenle</button>
                      <button onClick={() => sil(y.id)} style={{ background: "transparent", border: "1px solid rgba(232,0,13,0.3)", color: RED, padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrelenmis.length === 0 && (
            <div style={{ padding: "48px", textAlign: "center", color: WHITE_DIM, fontStyle: "italic" }}>
              {arama || filtre ? "Aramanızla eşleşen yemek bulunamadı." : "Henüz yemek eklenmemiş."}
            </div>
          )}
        </div>
      )}

      {/* Alt bilgi */}
      <div style={{ marginTop: 16, fontSize: 12, color: WHITE_DIM }}>
        Toplam {filtrelenmis.length} yemek {arama || filtre ? `(${yemekler.length} yemekten filtrelendi)` : ""}
      </div>
    </PanelLayout>
  );
}
