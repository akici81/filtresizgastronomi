import { useState, useEffect } from "react";
import AdminLayout from "../../../components/AdminLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

const ROLLER = ["admin", "editor", "uye"];
const ROL_RENK = { admin: RED, editor: "#f59e0b", uye: WHITE_DIM };

export default function KullanicilarAdmin() {
  const [kullanicilar, setKullanicilar] = useState([]);
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

  return (
    <AdminLayout baslik="Kullanıcılar">
      {mesaj && <div style={{ marginBottom: 16, fontSize: 13, color: "#00c850" }}>{mesaj}</div>}

      {yukleniyor ? <div style={{ color: WHITE_DIM }}>Yükleniyor...</div> : (
        <div style={{ border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid " + BORDER }}>
                {["Kullanıcı", "E-posta", "Rol", "Kayıt Tarihi", "Rol Değiştir"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kullanicilar.map((k, i) => (
                <tr key={k.id} style={{ borderBottom: "1px solid " + BORDER, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "12px 16px", color: WHITE, fontWeight: 600 }}>{k.ad || "-"}</td>
                  <td style={{ padding: "12px 16px", color: WHITE_DIM }}>{k.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 2, border: "1px solid", borderColor: ROL_RENK[k.rol] + "50", color: ROL_RENK[k.rol] }}>
                      {k.rol?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: WHITE_DIM, fontSize: 12 }}>
                    {k.olusturma_tarihi ? new Date(k.olusturma_tarihi).toLocaleDateString("tr-TR") : "-"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <select value={k.rol} onChange={e => rolDegistir(k.id, e.target.value)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "5px 10px", color: WHITE, fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                      {ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kullanicilar.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: WHITE_DIM, fontStyle: "italic" }}>Henüz kullanıcı yok.</div>}
        </div>
      )}
    </AdminLayout>
  );
}
