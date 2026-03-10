import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";
const ROLLER = ["admin", "editor", "uye"];
const ROL_RENK = { admin: RED, editor: "#f59e0b", uye: WHITE_DIM };

const MODULLER = [
  { key: "sehirler",    label: "Şehirler" },
  { key: "yemekler",   label: "Yemekler" },
  { key: "restoranlar",label: "Restoranlar" },
  { key: "sefler",     label: "Şefler" },
  { key: "galeri",     label: "Galeri" },
];

export default function KullanicilarAdmin() {
  const [kullanicilar, setKullanicilar] = useState([]);
  const [secili, setSecili] = useState(null); // izin düzenlenen kullanıcı
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => { getir(); }, []);

  async function getir() {
    const { data } = await supabase.from("kullanicilar").select("*").order("olusturma_tarihi", { ascending: false });
    setKullanicilar(data || []);
    setYukleniyor(false);
  }

  async function rolDegistir(id, yeniRol) {
    await supabase.from("kullanicilar").update({ rol: yeniRol }).eq("id", id);
    setMesaj("✅ Rol güncellendi.");
    getir();
    setTimeout(() => setMesaj(""), 2000);
  }

  async function izinGuncelle(kullaniciId, modul, aktif) {
    const kullanici = kullanicilar.find(k => k.id === kullaniciId);
    const mevcutIzinler = kullanici?.panel_izinleri || [];
    const yeniIzinler = aktif
      ? [...new Set([...mevcutIzinler, modul])]
      : mevcutIzinler.filter(i => i !== modul);

    await supabase.from("kullanicilar").update({ panel_izinleri: yeniIzinler }).eq("id", kullaniciId);
    getir();
  }

  return (
    <AdminLayout baslik="Kullanıcılar & İzinler">
      {mesaj && <div style={{ marginBottom: 16, fontSize: 13, color: "#00c850" }}>{mesaj}</div>}

      {yukleniyor ? <div style={{ color: WHITE_DIM }}>Yükleniyor...</div> : (
        <div style={{ display: "grid", gridTemplateColumns: secili ? "1fr 320px" : "1fr", gap: 24 }}>

          {/* Kullanıcı listesi */}
          <div style={{ border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid " + BORDER }}>
                  {["Kullanıcı", "E-posta", "Kullanıcı Adı", "Rol", "İzinler", "İşlem"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kullanicilar.map((k, i) => (
                  <tr key={k.id} style={{ borderBottom: "1px solid " + BORDER, background: secili?.id === k.id ? "rgba(232,0,13,0.05)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "12px 16px", color: WHITE, fontWeight: 600 }}>{k.ad || "-"}</td>
                    <td style={{ padding: "12px 16px", color: WHITE_DIM, fontSize: 12 }}>{k.email}</td>
                    <td style={{ padding: "12px 16px", color: WHITE_DIM, fontFamily: "monospace", fontSize: 12 }}>{k.kullanici_adi || "-"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <select value={k.rol || "uye"} onChange={e => rolDegistir(k.id, e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "4px 8px", color: ROL_RENK[k.rol] || WHITE, fontSize: 11, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                        {ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {k.rol === "admin" ? (
                        <span style={{ fontSize: 11, color: RED }}>Tümü</span>
                      ) : (
                        <span style={{ fontSize: 11, color: WHITE_DIM }}>{(k.panel_izinleri || []).length} modül</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {k.rol === "editor" && (
                        <button onClick={() => setSecili(secili?.id === k.id ? null : k)} style={{ background: secili?.id === k.id ? RED : "transparent", border: "1px solid " + (secili?.id === k.id ? RED : BORDER), color: secili?.id === k.id ? WHITE : WHITE_DIM, padding: "5px 12px", fontSize: 11, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>
                          {secili?.id === k.id ? "Kapat" : "İzinler"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {kullanicilar.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: WHITE_DIM, fontStyle: "italic" }}>Henüz kullanıcı yok.</div>}
          </div>

          {/* İzin paneli */}
          {secili && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + BORDER, borderRadius: 4, padding: "24px", height: "fit-content" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: WHITE, marginBottom: 4 }}>{secili.ad || secili.email}</div>
              <div style={{ fontSize: 11, color: WHITE_DIM, marginBottom: 24 }}>Modül izinlerini aç/kapat</div>

              {MODULLER.map(m => {
                const izinli = (secili.panel_izinleri || []).includes(m.key);
                return (
                  <div key={m.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid " + BORDER }}>
                    <span style={{ fontSize: 13, color: izinli ? WHITE : WHITE_DIM }}>{m.label}</span>
                    <div onClick={() => {
                      izinGuncelle(secili.id, m.key, !izinli);
                      setSecili(prev => ({
                        ...prev,
                        panel_izinleri: izinli
                          ? (prev.panel_izinleri || []).filter(i => i !== m.key)
                          : [...(prev.panel_izinleri || []), m.key]
                      }));
                    }} style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: izinli ? RED : "rgba(255,255,255,0.1)",
                      cursor: "pointer", position: "relative", transition: "background 0.2s"
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%", background: WHITE,
                        position: "absolute", top: 3,
                        left: izinli ? 21 : 3,
                        transition: "left 0.2s"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
