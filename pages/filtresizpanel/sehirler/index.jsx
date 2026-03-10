import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PanelLayout from "../../../components/PanelLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

export default function SehirlerPanel() {
  const router = useRouter();
  const [sehirler, setSehirler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [arama, setArama] = useState("");

  useEffect(() => { getir(); }, []);

  async function getir() {
    const { data } = await supabase.from("sehirler").select("*").order("ad");
    setSehirler(data || []);
    setYukleniyor(false);
  }

  async function sil(id) {
    if (!confirm("Bu şehri silmek istediğinize emin misiniz?")) return;
    await supabase.from("sehirler").delete().eq("id", id);
    getir();
  }

  const filtrelenmis = sehirler.filter(s => s.ad.toLowerCase().includes(arama.toLowerCase()));

  return (
    <PanelLayout baslik="Şehirler">
      <div style={{ display: "flex", gap: 12, marginBottom: 24, alignItems: "center" }}>
        <input value={arama} onChange={e => setArama(e.target.value)} placeholder="🔍  Şehir ara..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "9px 14px", color: WHITE, fontSize: 13, fontFamily: "inherit", outline: "none" }} onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
        <button onClick={() => router.push("/filtresizpanel/sehirler/yeni")} style={{ background: RED, border: "none", color: WHITE, padding: "9px 20px", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2, fontFamily: "inherit", fontWeight: 700, whiteSpace: "nowrap" }}>+ YENİ ŞEHİR</button>
      </div>

      {yukleniyor ? <div style={{ textAlign: "center", padding: 40, color: WHITE_DIM }}>Yükleniyor...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtrelenmis.map(s => (
            <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden" }}>
              {s.fotograf_url
                ? <img src={s.fotograf_url} alt={s.ad} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                : <div style={{ width: "100%", height: 140, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>🗺️</div>
              }
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>{s.ad}</div>
                  <span style={{ fontSize: 9, padding: "3px 7px", borderRadius: 2, background: s.aktif ? "rgba(0,200,80,0.1)" : "rgba(232,0,13,0.1)", color: s.aktif ? "#00c850" : RED }}>{s.aktif ? "AKTİF" : "PASİF"}</span>
                </div>
                {s.kapat_etiketi && <div style={{ fontSize: 11, color: RED, marginBottom: 8 }}>{s.kapat_etiketi}</div>}
                {s.aciklama && <div style={{ fontSize: 12, color: WHITE_DIM, marginBottom: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.aciklama}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => router.push("/filtresizpanel/sehirler/" + s.id)} style={{ flex: 1, background: "transparent", border: "1px solid " + BORDER, color: WHITE_DIM, padding: "7px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Düzenle</button>
                  <button onClick={() => sil(s.id)} style={{ background: "transparent", border: "1px solid rgba(232,0,13,0.3)", color: RED, padding: "7px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>Sil</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {filtrelenmis.length === 0 && !yukleniyor && <div style={{ padding: "48px", textAlign: "center", color: WHITE_DIM, fontStyle: "italic" }}>Henüz şehir eklenmemiş.</div>}
      <div style={{ marginTop: 16, fontSize: 12, color: WHITE_DIM }}>Toplam {filtrelenmis.length} şehir</div>
    </PanelLayout>
  );
}
