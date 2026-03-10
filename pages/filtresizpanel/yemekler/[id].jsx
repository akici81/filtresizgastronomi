import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import PanelLayout from "../../../components/PanelLayout";
import { supabase } from "../../../lib/supabase";

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";
const INPUT_BG = "rgba(255,255,255,0.04)";

const SEKMELER = [
  { key: "temel", label: "Temel Bilgiler", ikon: "📋" },
  { key: "icerik", label: "İçerik", ikon: "📝" },
  { key: "fotograf", label: "Fotoğraf", ikon: "📸" },
  { key: "ayarlar", label: "Ayarlar", ikon: "⚙️" },
];

const KATEGORILER = ["Ana Yemek", "Çorba", "Meze", "Tatlı", "İçecek", "Kahvaltı", "Sokak Yemeği", "Diğer"];

function slugOlustur(metin) {
  return metin.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export default function YemekForm() {
  const router = useRouter();
  const { id } = router.query;
  const yeni = id === "yeni";

  const [sekme, setSekme] = useState("temel");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [mesaj, setMesaj] = useState("");
  const [sehirler, setSehirler] = useState([]);
  const [surukle, setSurukle] = useState(false);
  const [fotografYukleniyor, setFotografYukleniyor] = useState(false);
  const [fotografMod, setFotografMod] = useState("yukle"); // "yukle" | "url"

  const [form, setForm] = useState({
    ad: "", slug: "", sehir_id: "", tag: "", aciklama: "",
    tarihce: "", malzemeler: "", yapilis: "",
    fotograf_url: "", aktif: true
  });

  useEffect(() => {
    getSehirler();
    if (!yeni && id) getYemek();
  }, [id]);

  async function getSehirler() {
    const { data } = await supabase.from("sehirler").select("id, ad").order("ad");
    setSehirler(data || []);
  }

  async function getYemek() {
    const { data } = await supabase.from("yemekler").select("*").eq("id", id).single();
    if (data) setForm(data);
  }

  function guncelle(alan, deger) {
    setForm(prev => {
      const yeni = { ...prev, [alan]: deger };
      if (alan === "ad") yeni.slug = slugOlustur(deger);
      return yeni;
    });
  }

  async function fotografYukle(dosya) {
    if (!dosya || !dosya.type.startsWith("image/")) {
      setMesaj("❌ Sadece görsel dosyası yükleyebilirsiniz.");
      return;
    }
    setFotografYukleniyor(true);
    const dosyaAdi = `yemekler/${Date.now()}-${dosya.name.replace(/\s/g, "-")}`;
    const { error } = await supabase.storage.from("fotograflar").upload(dosyaAdi, dosya);
    if (error) {
      setMesaj("❌ Yükleme hatası: " + error.message);
      setFotografYukleniyor(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("fotograflar").getPublicUrl(dosyaAdi);
    guncelle("fotograf_url", urlData.publicUrl);
    setFotografYukleniyor(false);
    setMesaj("✅ Fotoğraf yüklendi.");
    setTimeout(() => setMesaj(""), 2000);
  }

  async function kaydet() {
    if (!form.ad) { setMesaj("❌ Yemek adı zorunludur."); setSekme("temel"); return; }
    if (!form.sehir_id) { setMesaj("❌ Şehir seçimi zorunludur."); setSekme("temel"); return; }
    setKaydediliyor(true);

    const veri = { ...form };
    delete veri.id;
    delete veri.olusturma_tarihi;

    let hata;
    if (yeni) {
      ({ error: hata } = await supabase.from("yemekler").insert(veri));
    } else {
      ({ error: hata } = await supabase.from("yemekler").update(veri).eq("id", id));
    }

    setKaydediliyor(false);
    if (hata) { setMesaj("❌ Hata: " + hata.message); return; }
    setMesaj("✅ Yemek kaydedildi!");
    setTimeout(() => router.push("/filtresizpanel/yemekler"), 1200);
  }

  const inputStyle = {
    width: "100%", background: INPUT_BG, border: "1px solid " + BORDER,
    borderRadius: 2, padding: "10px 14px", color: WHITE,
    fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box"
  };

  return (
    <PanelLayout baslik={yeni ? "Yeni Yemek Ekle" : "Yemeği Düzenle"}>

      {/* Mesaj */}
      {mesaj && (
        <div style={{
          padding: "12px 16px", borderRadius: 2, marginBottom: 20,
          background: mesaj.startsWith("✅") ? "rgba(0,200,80,0.08)" : "rgba(232,0,13,0.08)",
          border: "1px solid " + (mesaj.startsWith("✅") ? "rgba(0,200,80,0.2)" : "rgba(232,0,13,0.2)"),
          color: mesaj.startsWith("✅") ? "#00c850" : RED, fontSize: 13
        }}>{mesaj}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "start" }}>

        {/* Sol: Sekmeler */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + BORDER, borderRadius: 4, overflow: "hidden", position: "sticky", top: 24 }}>
          {SEKMELER.map(s => (
            <div key={s.key} onClick={() => setSekme(s.key)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "14px 16px", cursor: "pointer",
              background: sekme === s.key ? "rgba(232,0,13,0.08)" : "transparent",
              borderLeft: sekme === s.key ? "2px solid " + RED : "2px solid transparent",
              color: sekme === s.key ? WHITE : WHITE_DIM,
              fontSize: 13, transition: "all 0.15s",
              borderBottom: "1px solid " + BORDER
            }}>
              <span>{s.ikon}</span>
              <span>{s.label}</span>
            </div>
          ))}

          {/* Kaydet butonu sol altta */}
          <div style={{ padding: 16 }}>
            <button onClick={kaydet} disabled={kaydediliyor} style={{
              width: "100%", background: RED, border: "none", color: WHITE,
              padding: "11px", fontSize: 11, letterSpacing: "0.12em",
              cursor: kaydediliyor ? "not-allowed" : "pointer",
              borderRadius: 2, fontFamily: "inherit", fontWeight: 700,
              opacity: kaydediliyor ? 0.7 : 1
            }}>
              {kaydediliyor ? "KAYDEDİLİYOR..." : "KAYDET"}
            </button>
            <button onClick={() => router.push("/filtresizpanel/yemekler")} style={{
              width: "100%", marginTop: 8, background: "transparent",
              border: "1px solid " + BORDER, color: WHITE_DIM,
              padding: "9px", fontSize: 11, cursor: "pointer",
              borderRadius: 2, fontFamily: "inherit"
            }}>İptal</button>
          </div>
        </div>

        {/* Sağ: Form */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid " + BORDER, borderRadius: 4, padding: 28 }}>

          {/* TEMEL BİLGİLER */}
          {sekme === "temel" && (
            <div>
              <Baslik>Temel Bilgiler</Baslik>
              <Alan label="Yemek Adı" zorunlu>
                <input value={form.ad} onChange={e => guncelle("ad", e.target.value)} placeholder="örn: Cağ Kebabı" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
              </Alan>
              <Alan label="URL Adresi (Slug)" ipucu="Otomatik oluşturulur">
                <input value={form.slug} onChange={e => guncelle("slug", e.target.value)} placeholder="cag-kebabi" style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
                  onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
              </Alan>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Alan label="Şehir" zorunlu>
                  <select value={form.sehir_id} onChange={e => guncelle("sehir_id", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER}>
                    <option value="">Şehir seçin</option>
                    {sehirler.map(s => <option key={s.id} value={s.id}>{s.ad}</option>)}
                  </select>
                </Alan>
                <Alan label="Kategori">
                  <select value={form.tag} onChange={e => guncelle("tag", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER}>
                    <option value="">Kategori seçin</option>
                    {KATEGORILER.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </Alan>
              </div>
              <Alan label="Kısa Açıklama">
                <textarea value={form.aciklama} onChange={e => guncelle("aciklama", e.target.value)}
                  placeholder="Bu yemek hakkında kısa bir açıklama..." rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
              </Alan>
            </div>
          )}

          {/* İÇERİK */}
          {sekme === "icerik" && (
            <div>
              <Baslik>İçerik & Tarif</Baslik>
              <Alan label="Tarihçe" ipucu="Bu yemeğin hikayesi, kökeni">
                <textarea value={form.tarihce} onChange={e => guncelle("tarihce", e.target.value)}
                  placeholder="Bu yemeğin tarihi ve kültürel önemi..." rows={5}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
              </Alan>
              <Alan label="Malzemeler" ipucu="Her malzemeyi yeni satıra yazın">
                <textarea value={form.malzemeler} onChange={e => guncelle("malzemeler", e.target.value)}
                  placeholder={"500g kuzu eti\n2 yemek kaşığı zeytinyağı\n..."}
                  rows={6} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                  onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
              </Alan>
              <Alan label="Yapılışı">
                <textarea value={form.yapilis} onChange={e => guncelle("yapilis", e.target.value)}
                  placeholder="Adım adım tarif..." rows={7}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
              </Alan>
            </div>
          )}

          {/* FOTOĞRAF */}
          {sekme === "fotograf" && (
            <div>
              <Baslik>Fotoğraf</Baslik>

              {/* Mod seçici */}
              <div style={{ display: "flex", border: "1px solid " + BORDER, borderRadius: 2, overflow: "hidden", marginBottom: 20, width: "fit-content" }}>
                {[["yukle", "📁 Dosya Yükle"], ["url", "🔗 URL ile Ekle"]].map(([mod, etiket]) => (
                  <button key={mod} onClick={() => setFotografMod(mod)} style={{
                    padding: "9px 20px", fontSize: 12, border: "none", cursor: "pointer",
                    background: fotografMod === mod ? RED : "transparent",
                    color: fotografMod === mod ? WHITE : WHITE_DIM,
                    fontFamily: "inherit", transition: "all 0.2s"
                  }}>{etiket}</button>
                ))}
              </div>

              {/* Önizleme */}
              {form.fotograf_url && (
                <div style={{ marginBottom: 20, position: "relative", display: "inline-block" }}>
                  <img src={form.fotograf_url} alt="önizleme" style={{ height: 160, width: "auto", maxWidth: "100%", borderRadius: 2, border: "1px solid " + BORDER, objectFit: "cover" }} />
                  <button onClick={() => guncelle("fotograf_url", "")} style={{ position: "absolute", top: -10, right: -10, width: 24, height: 24, borderRadius: "50%", background: RED, border: "none", color: WHITE, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              )}

              {/* Dosya Yükleme */}
              {fotografMod === "yukle" && (
                <div
                  onDragOver={e => { e.preventDefault(); setSurukle(true); }}
                  onDragLeave={() => setSurukle(false)}
                  onDrop={e => { e.preventDefault(); setSurukle(false); fotografYukle(e.dataTransfer.files[0]); }}
                  onClick={() => document.getElementById("foto-input").click()}
                  style={{
                    border: "2px dashed " + (surukle ? RED : BORDER),
                    borderRadius: 2, padding: "40px 20px", textAlign: "center",
                    cursor: "pointer", transition: "all 0.2s",
                    background: surukle ? "rgba(232,0,13,0.04)" : "transparent"
                  }}
                >
                  {fotografYukleniyor ? (
                    <div style={{ color: WHITE_DIM }}>Yükleniyor...</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>📸</div>
                      <div style={{ fontSize: 14, color: WHITE }}>Fotoğrafı buraya sürükleyin</div>
                      <div style={{ fontSize: 12, color: WHITE_DIM, marginTop: 6 }}>veya <span style={{ color: RED }}>tıklayarak seçin</span></div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>PNG, JPG, WEBP · Maks 10MB</div>
                    </>
                  )}
                </div>
              )}
              <input id="foto-input" type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => fotografYukle(e.target.files[0])} />

              {/* URL */}
              {fotografMod === "url" && (
                <Alan label="Fotoğraf URL">
                  <input value={form.fotograf_url} onChange={e => guncelle("fotograf_url", e.target.value)}
                    placeholder="https://..." style={inputStyle}
                    onFocus={e => e.target.style.borderColor = RED} onBlur={e => e.target.style.borderColor = BORDER} />
                </Alan>
              )}
            </div>
          )}

          {/* AYARLAR */}
          {sekme === "ayarlar" && (
            <div>
              <Baslik>Yayın Ayarları</Baslik>
              <div style={{ padding: "8px 0" }}>
                <Anahtar label="Aktif" ipucu="Kapalıysa sitede görünmez" value={form.aktif} onChange={v => guncelle("aktif", v)} />
              </div>
              {!yeni && (
                <div style={{ marginTop: 32, padding: 20, border: "1px solid rgba(232,0,13,0.2)", borderRadius: 4, background: "rgba(232,0,13,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: RED, marginBottom: 8 }}>Tehlikeli Bölge</div>
                  <div style={{ fontSize: 12, color: WHITE_DIM, marginBottom: 16 }}>Bu yemeği silmek geri alınamaz.</div>
                  <button onClick={async () => {
                    if (!confirm("Bu yemeği silmek istediğinize emin misiniz?")) return;
                    await supabase.from("yemekler").delete().eq("id", id);
                    router.push("/filtresizpanel/yemekler");
                  }} style={{ background: "transparent", border: "1px solid " + RED, color: RED, padding: "9px 20px", fontSize: 12, cursor: "pointer", borderRadius: 2, fontFamily: "inherit" }}>
                    Bu Yemeği Sil
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`* { box-sizing: border-box; } body { margin: 0; } select option { background: #1a1a1a; } textarea { font-family: inherit; } input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }`}</style>
    </PanelLayout>
  );
}

function Baslik({ children }) {
  return <div style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{children}</div>;
}

function Alan({ label, children, zorunlu, ipucu }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
        <span>{label.toUpperCase()}{zorunlu && <span style={{ color: "#e8000d" }}> *</span>}</span>
        {ipucu && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic", letterSpacing: 0 }}>{ipucu}</span>}
      </label>
      {children}
    </div>
  );
}

function Anahtar({ label, ipucu, value, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <div>
        <div style={{ fontSize: 13, color: "#ffffff" }}>{label}</div>
        {ipucu && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{ipucu}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, background: value ? "#e8000d" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, marginLeft: 16 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#ffffff", position: "absolute", top: 3, left: value ? 23 : 3, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </div>
    </div>
  );
}
