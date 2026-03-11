// pages/admin/turkpatent-import.jsx
// Türkpatent'ten coğrafi işaretli yemekleri içe aktarma aracı

import { useState, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';
import { useRouter } from 'next/router';

const S = {
  page: {
    padding: '32px',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: COLORS.text || '#ffffff',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
    marginTop: '6px',
  },
  tabs: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '28px',
  },
  tab: (active) => ({
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: active ? '#ffffff' : 'rgba(255,255,255,0.4)',
    background: 'none',
    border: 'none',
    borderBottom: active ? `2px solid ${COLORS.accent || '#e8000d'}` : '2px solid transparent',
    cursor: 'pointer',
    marginBottom: '-1px',
    transition: 'all 0.2s',
  }),
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '24px',
    marginBottom: '20px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    display: 'block',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '14px',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  row: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end',
  },
  btnPrimary: (loading) => ({
    background: loading ? 'rgba(232,0,13,0.5)' : (COLORS.accent || '#e8000d'),
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.2s',
  }),
  btnSecondary: {
    background: 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    marginTop: '6px',
  },
  error: {
    background: 'rgba(232,0,13,0.12)',
    border: '1px solid rgba(232,0,13,0.3)',
    color: '#ff6b6b',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '13px',
    marginTop: '16px',
  },
  resultGrid: {
    display: 'grid',
    gap: '12px',
    marginTop: '20px',
  },
  resultCard: (selected) => ({
    background: selected ? 'rgba(232,0,13,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${selected ? 'rgba(232,0,13,0.4)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    cursor: 'pointer',
    transition: 'all 0.15s',
  }),
  thumb: {
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    objectFit: 'cover',
    background: 'rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  thumbPlaceholder: {
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
  },
  resultName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  resultMeta: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.45)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  badge: (color) => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    background: color === 'red' ? 'rgba(232,0,13,0.2)' : 'rgba(255,255,255,0.1)',
    color: color === 'red' ? '#ff6b6b' : 'rgba(255,255,255,0.6)',
  }),
  progressBar: {
    height: '4px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '12px',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: COLORS.accent || '#e8000d',
    borderRadius: '2px',
    transition: 'width 0.3s',
  }),
  importBar: {
    position: 'sticky',
    bottom: '24px',
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    zIndex: 10,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  selectRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: COLORS.accent || '#e8000d',
    cursor: 'pointer',
    flexShrink: 0,
  },
  editField: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    color: '#ffffff',
    width: '100%',
    boxSizing: 'border-box',
  },
  successBanner: {
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#4ade80',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '13px',
    marginTop: '16px',
  },
};

export default function TurkpatentImport() {
  const { user, role } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState('single'); // 'single' | 'bulk'

  // Single mode
  const [singleUrl, setSingleUrl] = useState('');

  // Bulk mode
  const [idStart, setIdStart] = useState('');
  const [idEnd, setIdEnd] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null); // { current, total }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]); // parsed items
  const [selected, setSelected] = useState({}); // { index: true/false }
  const [edits, setEdits] = useState({}); // { index: { field: val } }
  const [cities, setCities] = useState(null); // { 'Düzce': id, ... }
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);

  // Şehirleri Supabase'den çek (ilk sonuç geldiğinde)
  async function loadCities() {
    if (cities) return cities;
    const { data } = await supabase.from('cities').select('id, name');
    const map = {};
    (data || []).forEach((c) => {
      map[c.name.toUpperCase()] = c.id;
      // Türkçe karakter normalizasyonu
      map[normalize(c.name)] = c.id;
    });
    setCities(map);
    return map;
  }

  function normalize(str) {
    return str
      .toUpperCase()
      .replace(/İ/g, 'I')
      .replace(/Ğ/g, 'G')
      .replace(/Ü/g, 'U')
      .replace(/Ş/g, 'S')
      .replace(/Ö/g, 'O')
      .replace(/Ç/g, 'C');
  }

  function matchCity(cityMap, ilName) {
    if (!ilName || !cityMap) return null;
    const upper = ilName.toUpperCase();
    const norm = normalize(ilName);
    return cityMap[upper] || cityMap[norm] || null;
  }

  async function fetchData(body) {
    setError(null);
    setResults([]);
    setSelected({});
    setEdits({});
    setImportSuccess(null);
    setLoading(true);
    try {
      const res = await fetch('/api/turkpatent-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sunucu hatası');

      const cityMap = await loadCities();
      const items = (json.results || []).map((r) => ({
        ...r,
        mapped: {
          ...r.mapped,
          city_id: matchCity(cityMap, r.il),
        },
      }));

      setResults(items);
      // Hepsini varsayılan olarak seç
      const sel = {};
      items.forEach((_, i) => { sel[i] = true; });
      setSelected(sel);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setBulkProgress(null);
    }
  }

  function handleSingleFetch() {
    if (!singleUrl.includes('ci.turkpatent.gov.tr')) {
      setError('Geçerli bir Türkpatent URL\'si girin');
      return;
    }
    fetchData({ mode: 'single', url: singleUrl });
  }

  function handleBulkFetch() {
    const s = parseInt(idStart);
    const e = parseInt(idEnd);
    if (isNaN(s) || isNaN(e) || e < s) {
      setError('Geçerli bir ID aralığı girin');
      return;
    }
    if (e - s > 200) {
      setError('Maksimum 200 kayıt taranabilir');
      return;
    }
    fetchData({ mode: 'bulk', idStart: s, idEnd: e });
  }

  function toggleSelect(i) {
    setSelected((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  function selectAll() {
    const sel = {};
    results.forEach((_, i) => { sel[i] = true; });
    setSelected(sel);
  }

  function deselectAll() {
    setSelected({});
  }

  function getEdit(i, field, fallback) {
    return edits[i]?.[field] !== undefined ? edits[i][field] : fallback;
  }

  function setEdit(i, field, val) {
    setEdits((prev) => ({
      ...prev,
      [i]: { ...(prev[i] || {}), [field]: val },
    }));
  }

  async function handleImport() {
    const toImport = results
      .map((r, i) => ({ r, i }))
      .filter(({ i }) => selected[i]);

    if (toImport.length === 0) {
      setError('En az bir kayıt seçin');
      return;
    }

    setImporting(true);
    setError(null);
    let successCount = 0;
    const errors = [];

    for (const { r, i } of toImport) {
      const name = getEdit(i, 'name', r.mapped.name);
      const city_id = getEdit(i, 'city_id', r.mapped.city_id);
      const geographical_indication = getEdit(i, 'geographical_indication', r.mapped.geographical_indication);
      const geographical_indication_no = getEdit(i, 'geographical_indication_no', r.mapped.geographical_indication_no);
      const geographical_indication_date = getEdit(i, 'geographical_indication_date', r.mapped.geographical_indication_date);
      const image_url = getEdit(i, 'image_url', r.mapped.image_url);

      // Slug oluştur
      const slug = slugify(name);

      const record = {
        name,
        slug,
        city_id: city_id || null,
        geographical_indication: geographical_indication || null,
        geographical_indication_no: geographical_indication_no || null,
        geographical_indication_date: geographical_indication_date || null,
        is_geographical_indication: true,
        image_url: image_url || null,
        source_url: r.source_url,
        // Diğer zorunlu alanlar için varsayılan
        status: 'draft',
      };

      const { error: dbErr } = await supabase
        .from('dishes')
        .insert(record);

      if (dbErr) {
        errors.push({ name, error: dbErr.message });
      } else {
        successCount++;
      }
    }

    setImporting(false);

    if (errors.length > 0) {
      setError(`${errors.length} kayıt eklenemedi: ${errors.map((e) => e.name).join(', ')}`);
    }

    if (successCount > 0) {
      setImportSuccess(`${successCount} yemek başarıyla dishes tablosuna eklendi (taslak olarak).`);
      // Eklenen kayıtları listeden kaldır
      const insertedIndices = new Set(
        toImport
          .map(({ i }) => i)
          .filter((i) => !errors.find((e) => e.name === getEdit(i, 'name', results[i]?.mapped?.name)))
      );
      setResults((prev) => prev.filter((_, i) => !insertedIndices.has(i)));
      setSelected({});
    }
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;

  // Erişim kontrolü
  if (role && !['superadmin', 'admin', 'editor'].includes(role)) {
    return (
      <AdminLayout>
        <div style={{ ...S.page, textAlign: 'center', paddingTop: '80px' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <h1 style={S.title}>🏷️ Türkpatent İçe Aktarma</h1>
          <p style={S.subtitle}>
            Coğrafi işaretli yemekleri ci.turkpatent.gov.tr'den otomatik çek ve dishes tablosuna ekle.
          </p>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(tab === 'single')} onClick={() => { setTab('single'); setError(null); setResults([]); }}>
            Tekil URL
          </button>
          <button style={S.tab(tab === 'bulk')} onClick={() => { setTab('bulk'); setError(null); setResults([]); }}>
            Toplu Tarama
          </button>
        </div>

        {/* Single Mode */}
        {tab === 'single' && (
          <div style={S.card}>
            <label style={S.label}>Türkpatent Detay URL'si</label>
            <div style={S.row}>
              <input
                style={{ ...S.input, flex: 1 }}
                placeholder="https://ci.turkpatent.gov.tr/cografi-isaretler/detay/38367"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSingleFetch()}
              />
              <button
                style={S.btnPrimary(loading)}
                onClick={handleSingleFetch}
                disabled={loading}
              >
                {loading ? 'Çekiliyor…' : 'Getir'}
              </button>
            </div>
            <p style={S.hint}>
              Detay sayfasının URL'sini yapıştırın. Yalnızca yemek/gıda kategorisindeki kayıtlar kabul edilir.
            </p>
          </div>
        )}

        {/* Bulk Mode */}
        {tab === 'bulk' && (
          <div style={S.card}>
            <label style={S.label}>ID Aralığı</label>
            <div style={S.row}>
              <div style={{ flex: 1 }}>
                <label style={{ ...S.label, marginBottom: '4px' }}>Başlangıç ID</label>
                <input
                  style={S.input}
                  type="number"
                  placeholder="38000"
                  value={idStart}
                  onChange={(e) => setIdStart(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...S.label, marginBottom: '4px' }}>Bitiş ID</label>
                <input
                  style={S.input}
                  type="number"
                  placeholder="38200"
                  value={idEnd}
                  onChange={(e) => setIdEnd(e.target.value)}
                />
              </div>
              <button
                style={{ ...S.btnPrimary(loading), marginTop: '20px' }}
                onClick={handleBulkFetch}
                disabled={loading}
              >
                {loading ? 'Taranıyor…' : 'Tara'}
              </button>
            </div>
            <p style={S.hint}>
              Maksimum 200 ID taranabilir. Sadece yemek/gıda grubundaki tescilli ürünler listelenir.
              Her istek ~300ms aralıklı gönderilir.
            </p>

            {loading && idStart && idEnd && (
              <div style={S.progressBar}>
                <div style={S.progressFill(bulkProgress
                  ? Math.round((bulkProgress.current / bulkProgress.total) * 100)
                  : 15
                )} />
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && <div style={S.error}>⚠️ {error}</div>}

        {/* Success */}
        {importSuccess && <div style={S.successBanner}>✓ {importSuccess}</div>}

        {/* Results */}
        {results.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                {results.length} sonuç bulundu
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={S.btnSecondary} onClick={selectAll}>Tümünü Seç</button>
                <button style={S.btnSecondary} onClick={deselectAll}>Seçimi Kaldır</button>
              </div>
            </div>

            <div style={S.resultGrid}>
              {results.map((item, i) => (
                <ResultCard
                  key={i}
                  item={item}
                  index={i}
                  selected={!!selected[i]}
                  onToggle={() => toggleSelect(i)}
                  getEdit={getEdit}
                  setEdit={setEdit}
                  cities={cities}
                  S={S}
                />
              ))}
            </div>

            {/* Sticky import bar */}
            {selectedCount > 0 && (
              <div style={S.importBar}>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  <strong style={{ color: '#ffffff' }}>{selectedCount}</strong> kayıt seçili
                </span>
                <button
                  style={S.btnPrimary(importing)}
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? 'Ekleniyor…' : `${selectedCount} Yemeği Ekle →`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// ---- Alt bileşen: Sonuç kartı (inline edit destekli) ----
function ResultCard({ item, index, selected, onToggle, getEdit, setEdit, cities, S }) {
  const [showEdit, setShowEdit] = useState(false);
  const m = item.mapped;

  const name = getEdit(index, 'name', m.name);
  const cityId = getEdit(index, 'city_id', m.city_id);
  const giType = getEdit(index, 'geographical_indication', m.geographical_indication);
  const giNo = getEdit(index, 'geographical_indication_no', m.geographical_indication_no);
  const giDate = getEdit(index, 'geographical_indication_date', m.geographical_indication_date);
  const imageUrl = getEdit(index, 'image_url', m.image_url);

  return (
    <div style={S.resultCard(selected)}>
      {/* Checkbox */}
      <div style={{ paddingTop: '2px' }}>
        <input
          type="checkbox"
          style={S.checkbox}
          checked={selected}
          onChange={onToggle}
        />
      </div>

      {/* Görsel */}
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} style={S.thumb} onError={(e) => { e.target.style.display = 'none'; }} />
      ) : (
        <div style={S.thumbPlaceholder}>🍽️</div>
      )}

      {/* Bilgiler */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!showEdit ? (
          <>
            <div style={S.resultName}>{name}</div>
            <div style={S.resultMeta}>
              {item.il && <span>📍 {item.il}</span>}
              {giType && <span style={S.badge('red')}>{giType}</span>}
              {giNo && <span>Tescil No: {giNo}</span>}
              {giDate && <span>{giDate}</span>}
              {!m.city_id && item.il && (
                <span style={{ color: '#facc15' }}>⚠ Şehir eşlenemedi</span>
              )}
            </div>
            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginTop: '4px', display: 'inline-block' }}
              >
                Kaynağa git ↗
              </a>
            )}
          </>
        ) : (
          <EditPanel
            index={index}
            name={name}
            giType={giType}
            giNo={giNo}
            giDate={giDate}
            imageUrl={imageUrl}
            cityId={cityId}
            cities={cities}
            setEdit={setEdit}
            S={S}
          />
        )}
      </div>

      {/* Düzenle butonu */}
      <button
        style={{ ...S.btnSecondary, padding: '6px 12px', fontSize: '12px', alignSelf: 'flex-start' }}
        onClick={() => setShowEdit((v) => !v)}
      >
        {showEdit ? 'Kapat' : 'Düzenle'}
      </button>
    </div>
  );
}

function EditPanel({ index, name, giType, giNo, giDate, imageUrl, cityId, cities, setEdit, S }) {
  const cityOptions = cities ? Object.entries(cities) : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
      <div>
        <label style={{ ...S.label, fontSize: '11px' }}>Ad</label>
        <input
          style={S.editField}
          value={name || ''}
          onChange={(e) => setEdit(index, 'name', e.target.value)}
        />
      </div>
      <div>
        <label style={{ ...S.label, fontSize: '11px' }}>Coğrafi İşaret Türü</label>
        <select
          style={{ ...S.editField, color: '#ffffff' }}
          value={giType || ''}
          onChange={(e) => setEdit(index, 'geographical_indication', e.target.value)}
        >
          <option value="">—</option>
          <option value="Menşe Adı">Menşe Adı</option>
          <option value="Mahreç İşareti">Mahreç İşareti</option>
          <option value="Geleneksel Ürün Adı">Geleneksel Ürün Adı</option>
        </select>
      </div>
      <div>
        <label style={{ ...S.label, fontSize: '11px' }}>Tescil No</label>
        <input
          style={S.editField}
          value={giNo || ''}
          onChange={(e) => setEdit(index, 'geographical_indication_no', e.target.value)}
        />
      </div>
      <div>
        <label style={{ ...S.label, fontSize: '11px' }}>Tescil Tarihi</label>
        <input
          style={S.editField}
          value={giDate || ''}
          onChange={(e) => setEdit(index, 'geographical_indication_date', e.target.value)}
        />
      </div>
      <div>
        <label style={{ ...S.label, fontSize: '11px' }}>Görsel URL</label>
        <input
          style={S.editField}
          value={imageUrl || ''}
          onChange={(e) => setEdit(index, 'image_url', e.target.value)}
        />
      </div>
      <div>
        <label style={{ ...S.label, fontSize: '11px' }}>Şehir</label>
        <select
          style={{ ...S.editField, color: '#ffffff' }}
          value={cityId || ''}
          onChange={(e) => setEdit(index, 'city_id', e.target.value || null)}
        >
          <option value="">— Eşlenmedi —</option>
          {cityOptions.map(([label, id]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}