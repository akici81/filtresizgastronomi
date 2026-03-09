import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "../../../components/AdminLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";

function slugOlustur(ad) {
  return ad.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const bosForm = { ad: "", slug: "", sehir_id: "", adres: "", telefon: "", website: "", aciklama: "", fotograf_url: "", premium: false, aktif: true };

export default function RestoranForm() {
  const router = useRouter();
  const { id } = router.query;
  const yeni = id === "yeni";

  const [form, setForm] = useState(bosForm);
  const [sehirler, setSehirler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    supabase.from("sehirler").select("id, ad").order("ad").then(({ data }) => setSehirler(data || []));
    if (!id || yeni) return;
    setYukleniyor(true);
    supabase.from("restoranlar").select("*").eq("id", id).single().then(({ data }) => {
      if (data) setForm(data);
      setYukleniyor(false);
    });
  }, [id]);

  function guncelle(alan, deger) {
    setForm(prev => {
      const yeniForm = { ...prev, [alan]: deger };
      if (alan === "ad") yeniForm.slug = slugOlustur(deger);
      return yeniForm;
    });
  }

  async function kaydet() {
    setKaydediliyor(true); setMesaj("");
    const veri = { ad: form.ad, slug: form.slug, sehir_id: form.sehir_id || null, adres: form.adres, telefon: form.telefon, website: form.website, aciklama: form.aciklama, fotograf_url: form.fotograf_url, premium: form.premium, aktif: form.aktif, guncelleme_tarihi: new Date().toISOString() };

    let hata;
    if (yeni) {
      const res = await supabase.from("restoranlar").insert([veri]);
      hata = res.error;
    } else {
      const res = await supabase.from("restoranlar").update(veri).eq("id", id);
      hata = res.error;
    }

    setKaydediliyor(false);
    if (hata) { setMesaj("❌ Hata: " + hata.message); return; }
    setMesaj("✅ Kaydedildi!");
    setTimeout(() => router.push("/admin/restoranlar"), 1000);
  }

  if (yukleniyor) return <AdminLayout baslik="..."><div style={{ color: WHITE_DIM }}>Yükleniyor...</div></AdminLayout>;

  return (
    <AdminLayout baslik={yeni ? "Yeni Restoran Ekle" : "Restoran Düzenle"}>
      <div style={{ maxWidth: 720 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Alan label="Restoran Adı *" value={form.ad} onChange={v => guncelle("ad", v)} />
          <Alan label="Slug (otomatik)" value={form.slug} onChange={v => guncelle("slug", v)} mono />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM, marginBottom: 8 }}>ŞEHİR</label>
          <select value={form.sehir_id || ""} onChange={e => guncelle("sehir_id", e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid " + BORDER, borderRadius: 2, padding: "10px 14px", color: WHITE, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            <option value="">Seçiniz</option>
            {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Alan label="Adres" value={form.adres} onChange={v => guncelle("adres", v)} />
          <Alan label="Telefon" value={form.telefon} onChange={v => guncelle("telefon", v)} />
        </div>
        <Alan label="Website" value={form.website} onChange={v => guncelle("website", v)} />
        <Alan label="Açıklama" value={form.aciklama} onChange={v => guncelle("aciklama", v)} cok />
        <Alan label="Fotoğraf URL" value={form.fotograf_url} onChange={v => guncelle("fotograf_url", v)} />

        <div style={{ display: "flex", gap: 24, marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="premium" checked={form.premium} onChange={e => guncelle("premium", e.target.checked)} style={{ accentColor: RED, width: 16, height: 16 }} />
            <label htmlFor="premium" style={{ fontSize: 13, color: WHITE_DIM, cursor: "pointer" }}>Premium (Öne Çıkan)</label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="aktif" checked={form.aktif} onChange={e => guncelle("aktif", e.target.checked)} style={{ accentColor: RED, width: 16, height: 16 }} />
            <label htmlFor="aktif" style={{ fontSize: 13, color: WHITE_DIM, cursor: "pointer" }}>Aktif</label>
          </div>
        </div>

        {mesaj && <div style={{ marginBottom: 16, fontSize: 13, color: mesaj.includes("❌") ? RED : "#00c850" }}>{mesaj}</div>}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={kaydet} disabled={kaydediliyor} style={{ background: RED, border: "none", color: WHITE, padding: "12px 32px", fontSize: 12, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2, fontFamily: "inherit", fontWeight: 700 }}>
            {kaydediliyor ? "KAYDEDİLİYOR..." : "KAYDET"}
          </button>
          <button onClick={() => router.push("/admin/restoranlar")} style={{ background: "transparent", border: "1px solid " + BORDER, color: WHITE_DIM, padding: "12px 24px", fontSize: 12, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>İptal</button>
        </div>
      </div>
    </AdminLayout>
  );
}

function Alan({ label, value, onChange, cok, mono }) {
  const style = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 2, padding: "10px 14px", color: "#ffffff", fontSize: 13, fontFamily: mono ? "monospace" : "inherit", outline: "none", resize: cok ? "vertical" : "none" };
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>{label.toUpperCase()}</label>
      {cok
        ? <textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={4} style={style} onFocus={e => e.target.style.borderColor = "#e8000d"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
        : <input value={value || ""} onChange={e => onChange(e.target.value)} style={style} onFocus={e => e.target.style.borderColor = "#e8000d"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
      }
    </div>
  );
}
