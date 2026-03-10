// Ortak form bileşenleri — tüm panel sayfalarında kullanılır

const RED = "#e8000d";
const WHITE = "#ffffff";
const WHITE_DIM = "rgba(255,255,255,0.5)";
const BORDER = "rgba(255,255,255,0.08)";
const INPUT_BG = "rgba(255,255,255,0.04)";

export function FormSatir({ children, kolonlar = 1 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${kolonlar}, 1fr)`,
      gap: 20, marginBottom: 0
    }}>
      {children}
    </div>
  );
}

export function MetinAlani({ label, value, onChange, placeholder, zorunlu, mono, ipucu }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM, marginBottom: 8 }}>
        <span>{label.toUpperCase()}{zorunlu && <span style={{ color: RED }}> *</span>}</span>
        {ipucu && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic", letterSpacing: 0 }}>{ipucu}</span>}
      </label>
      <input
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: INPUT_BG,
          border: "1px solid " + BORDER, borderRadius: 2,
          padding: "10px 14px", color: WHITE, fontSize: 13,
          fontFamily: mono ? "monospace" : "inherit",
          outline: "none", boxSizing: "border-box"
        }}
        onFocus={e => e.target.style.borderColor = RED}
        onBlur={e => e.target.style.borderColor = BORDER}
      />
    </div>
  );
}

export function MetinKutusu({ label, value, onChange, placeholder, satirSayisi = 4, ipucu }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM, marginBottom: 8 }}>
        <span>{label.toUpperCase()}</span>
        {ipucu && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", fontStyle: "italic", letterSpacing: 0 }}>{ipucu}</span>}
      </label>
      <textarea
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={satirSayisi}
        style={{
          width: "100%", background: INPUT_BG,
          border: "1px solid " + BORDER, borderRadius: 2,
          padding: "10px 14px", color: WHITE, fontSize: 13,
          fontFamily: "inherit", outline: "none",
          boxSizing: "border-box", resize: "vertical"
        }}
        onFocus={e => e.target.style.borderColor = RED}
        onBlur={e => e.target.style.borderColor = BORDER}
      />
    </div>
  );
}

export function SecimAlani({ label, value, onChange, secenekler, placeholder }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM, marginBottom: 8 }}>
        {label.toUpperCase()}
      </label>
      <select
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", background: INPUT_BG,
          border: "1px solid " + BORDER, borderRadius: 2,
          padding: "10px 14px", color: value ? WHITE : WHITE_DIM,
          fontSize: 13, fontFamily: "inherit", outline: "none",
          boxSizing: "border-box", cursor: "pointer"
        }}
        onFocus={e => e.target.style.borderColor = RED}
        onBlur={e => e.target.style.borderColor = BORDER}
      >
        <option value="">{placeholder || "Seçiniz"}</option>
        {secenekler.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

export function AnahtarAlani({ label, value, onChange, ipucu }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid " + BORDER }}>
      <div>
        <div style={{ fontSize: 13, color: WHITE }}>{label}</div>
        {ipucu && <div style={{ fontSize: 11, color: WHITE_DIM, marginTop: 3 }}>{ipucu}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? RED : "rgba(255,255,255,0.1)",
          cursor: "pointer", position: "relative", transition: "background 0.2s",
          flexShrink: 0, marginLeft: 16
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: WHITE,
          position: "absolute", top: 3,
          left: value ? 23 : 3,
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)"
        }} />
      </div>
    </div>
  );
}

export function FotografYukle({ label, value, onChange, supabase, bucket = "fotograflar" }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [surukle, setSurukle] = useState(false);

  async function dosyaYukle(dosya) {
    if (!dosya) return;
    if (!dosya.type.startsWith("image/")) { alert("Sadece görsel dosyası yükleyebilirsiniz."); return; }
    setYukleniyor(true);
    const dosyaAdi = `${Date.now()}-${dosya.name.replace(/\s/g, "-")}`;
    const { data, error } = await supabase.storage.from(bucket).upload(dosyaAdi, dosya);
    if (error) { alert("Yükleme hatası: " + error.message); setYukleniyor(false); return; }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(dosyaAdi);
    onChange(urlData.publicUrl);
    setYukleniyor(false);
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 10, letterSpacing: "0.1em", color: WHITE_DIM, marginBottom: 8 }}>
        {label.toUpperCase()}
      </label>

      {/* Önizleme */}
      {value && (
        <div style={{ marginBottom: 12, position: "relative", display: "inline-block" }}>
          <img src={value} alt="önizleme" style={{ height: 80, width: "auto", borderRadius: 2, border: "1px solid " + BORDER, objectFit: "cover" }} />
          <button onClick={() => onChange("")} style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: RED, border: "none", color: WHITE, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>×</button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setSurukle(true); }}
        onDragLeave={() => setSurukle(false)}
        onDrop={e => { e.preventDefault(); setSurukle(false); dosyaYukle(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById("fotograf-input-" + label).click()}
        style={{
          border: "2px dashed " + (surukle ? RED : BORDER),
          borderRadius: 2, padding: "20px", textAlign: "center",
          cursor: "pointer", transition: "all 0.2s",
          background: surukle ? "rgba(232,0,13,0.05)" : "transparent"
        }}
      >
        {yukleniyor ? (
          <div style={{ color: WHITE_DIM, fontSize: 13 }}>Yükleniyor...</div>
        ) : (
          <>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📸</div>
            <div style={{ fontSize: 13, color: WHITE_DIM }}>Sürükle bırak veya <span style={{ color: RED }}>tıkla</span></div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>PNG, JPG, WEBP</div>
          </>
        )}
      </div>
      <input
        id={"fotograf-input-" + label}
        type="file" accept="image/*" style={{ display: "none" }}
        onChange={e => dosyaYukle(e.target.files[0])}
      />
    </div>
  );
}

export function KaydetButon({ kaydediliyor, onClick, iptal }) {
  return (
    <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
      <button onClick={onClick} disabled={kaydediliyor} style={{
        background: RED, border: "none", color: WHITE,
        padding: "13px 36px", fontSize: 12, letterSpacing: "0.15em",
        cursor: kaydediliyor ? "not-allowed" : "pointer",
        borderRadius: 2, fontFamily: "inherit", fontWeight: 700,
        opacity: kaydediliyor ? 0.7 : 1, transition: "opacity 0.2s"
      }}>
        {kaydediliyor ? "KAYDEDİLİYOR..." : "KAYDET"}
      </button>
      <button onClick={iptal} style={{
        background: "transparent", border: "1px solid " + BORDER,
        color: WHITE_DIM, padding: "13px 24px", fontSize: 12,
        cursor: "pointer", borderRadius: 2, fontFamily: "inherit",
        transition: "all 0.2s"
      }}
        onMouseEnter={e => { e.target.style.borderColor = RED; e.target.style.color = RED; }}
        onMouseLeave={e => { e.target.style.borderColor = BORDER; e.target.style.color = WHITE_DIM; }}
      >
        İptal
      </button>
    </div>
  );
}

export function MesajBildir({ mesaj }) {
  if (!mesaj) return null;
  const basari = mesaj.startsWith("✅");
  return (
    <div style={{
      padding: "12px 16px", borderRadius: 2, marginBottom: 20,
      background: basari ? "rgba(0,200,80,0.08)" : "rgba(232,0,13,0.08)",
      border: "1px solid " + (basari ? "rgba(0,200,80,0.2)" : "rgba(232,0,13,0.2)"),
      color: basari ? "#00c850" : RED, fontSize: 13
    }}>
      {mesaj}
    </div>
  );
}

// useState import için
import { useState } from "react";
