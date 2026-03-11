import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS } from '../../../lib/constants';

const REGIONS = ['Marmara', 'Ege', 'Akdeniz', 'İç Anadolu', 'Karadeniz', 'Doğu Anadolu', 'Güneydoğu Anadolu'];

const EMPTY_FORM = {
  name: '', slug: '', region: '', short_description: '',
  description: '', culinary_history: '', culinary_features: '',
  famous_dishes: '', local_ingredients: '', population: '',
  latitude: '', longitude: '', image_url: '', cover_image_url: '',
  is_active: true, is_featured: false,
  seo_title: '', seo_description: '',
  gi_status: false, gi_count: '', gi_source_url: '',
};

export default function CityForm() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isNew && id) fetchCity();
  }, [id]);

  async function fetchCity() {
    setLoading(true);
    const { data } = await supabase.from('cities').select('*').eq('id', id).single();
    if (data) {
      setForm({
        ...EMPTY_FORM,
        ...data,
        famous_dishes: Array.isArray(data.famous_dishes) ? data.famous_dishes.join(', ') : '',
        local_ingredients: Array.isArray(data.local_ingredients) ? data.local_ingredients.join(', ') : '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        population: data.population || '',
      });
    }
    setLoading(false);
  }

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'name' && (isNew || !form.slug)) {
      setForm(prev => ({
        ...prev,
        name: value,
        slug: value.toLowerCase()
          .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
          .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
          .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''),
      }));
    }
  }

  async function handleImageUpload(e, field) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    const ext = file.name.split('.').pop();
    const path = `cities/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      handleChange(field, data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave() {
    setError('');
    setSuccess('');
    if (!form.name) { setError('Şehir adı zorunludur.'); return; }
    if (!form.slug) { setError('Slug zorunludur.'); return; }
    setSaving(true);

    const payload = {
      ...form,
      population: form.population ? parseInt(form.population) : null,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
      famous_dishes: form.famous_dishes
        ? form.famous_dishes.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      local_ingredients: form.local_ingredients
        ? form.local_ingredients.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      gi_status: form.gi_status || false,
      gi_count: form.gi_count ? parseInt(form.gi_count) : null,
      gi_source_url: form.gi_source_url || null,
    };

    let result;
    if (isNew) {
      result = await supabase.from('cities').insert(payload).select().single();
    } else {
      result = await supabase.from('cities').update(payload).eq('id', id).select().single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess('Kaydedildi!');
      if (isNew) router.push(`/admin/cities/${result.data.id}`);
    }
    setSaving(false);
  }

  if (loading) return (
    <AdminLayout title="Şehir">
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.muted }}>Yükleniyor...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={isNew ? 'Yeni Şehir' : 'Şehri Düzenle'}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => router.push('/admin/cities')}
          style={{ background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 13, cursor: 'pointer' }}
        >
          ← Geri
        </button>
        <Btn onClick={handleSave} loading={saving}>Kaydet</Btn>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Temel Bilgiler">
            <Field label="Şehir Adı *">
              <input {...inp} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="İstanbul" />
            </Field>
            <Field label="Slug *">
              <input {...inp} value={form.slug} onChange={e => handleChange('slug', e.target.value)} placeholder="istanbul" />
            </Field>
            <Field label="Bölge">
              <select {...inp} value={form.region} onChange={e => handleChange('region', e.target.value)}>
                <option value="">Bölge Seç</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Kısa Açıklama">
              <textarea {...inp} rows={2} value={form.short_description} onChange={e => handleChange('short_description', e.target.value)} placeholder="Tek cümlelik açıklama..." />
            </Field>
            <Field label="Açıklama">
              <textarea {...inp} rows={4} value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Şehir hakkında detaylı bilgi..." />
            </Field>
          </Card>

          <Card title="Gastronomi Bilgileri">
            <Field label="Mutfak Tarihi">
              <textarea {...inp} rows={4} value={form.culinary_history} onChange={e => handleChange('culinary_history', e.target.value)} placeholder="Şehrin mutfak tarihi..." />
            </Field>
            <Field label="Mutfak Özellikleri">
              <textarea {...inp} rows={4} value={form.culinary_features} onChange={e => handleChange('culinary_features', e.target.value)} placeholder="Mutfağın ayırt edici özellikleri..." />
            </Field>
            <Field label="Meşhur Yemekler (virgülle ayır)">
              <input {...inp} value={form.famous_dishes} onChange={e => handleChange('famous_dishes', e.target.value)} placeholder="Adana Kebap, Şalgam, Çiğ Köfte" />
            </Field>
            <Field label="Yöresel Malzemeler (virgülle ayır)">
              <input {...inp} value={form.local_ingredients} onChange={e => handleChange('local_ingredients', e.target.value)} placeholder="Antep fıstığı, biber salçası" />
            </Field>
          </Card>

          <Card title="SEO">
            <Field label="SEO Başlık">
              <input {...inp} value={form.seo_title} onChange={e => handleChange('seo_title', e.target.value)} placeholder="İstanbul Mutfağı | Filtresiz Gastronomi" />
            </Field>
            <Field label="SEO Açıklama">
              <textarea {...inp} rows={2} value={form.seo_description} onChange={e => handleChange('seo_description', e.target.value)} placeholder="Meta açıklama (max 160 karakter)" />
            </Field>
          </Card>
          {/* Coğrafi İşaret */}
          <Card title="🏷 Coğrafi İşaret">
            <div style={{ marginBottom: 16, padding: '12px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.gi_status || false}
                  onChange={e => handleChange('gi_status', e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Coğrafi İşaretli Ürün Şehri</div>
                  <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Bu şehre ait tescilli coğrafi işaret ürünleri var</div>
                </div>
              </label>
            </div>
            {form.gi_status && (
              <>
                <Field label="COĞRAFİ İŞARET ÜRÜN SAYISI">
                  <input {...inp} type="number" value={form.gi_count || ''} onChange={e => handleChange('gi_count', e.target.value)} placeholder="Örn: 12" />
                </Field>
                <Field label="KAYNAK URL (TürkPatent / Kültür Portalı)">
                  <input {...inp} value={form.gi_source_url || ''} onChange={e => handleChange('gi_source_url', e.target.value)} placeholder="https://ci.turkpatent.gov.tr/..." />
                </Field>
              </>
            )}
          </Card>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card title="Durum">
            <Toggle label="Aktif" checked={form.is_active} onChange={v => handleChange('is_active', v)} />
            <Toggle label="Öne Çıkan" checked={form.is_featured} onChange={v => handleChange('is_featured', v)} />
          </Card>

          <Card title="Kapak Görseli">
            {form.image_url && (
              <img src={form.image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginBottom: 12 }} />
            )}
            <Field label="Görsel URL">
              <input {...inp} value={form.image_url} onChange={e => handleChange('image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <label style={{
              display: 'block', padding: 10,
              border: `1px dashed ${COLORS.border}`,
              borderRadius: 6, textAlign: 'center',
              cursor: 'pointer', fontSize: 12, color: COLORS.dim,
            }}>
              {uploading === 'image_url' ? 'Yükleniyor...' : '📁 Dosya Seç'}
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'image_url')} style={{ display: 'none' }} />
            </label>
          </Card>

          <Card title="Cover Görseli">
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 6, marginBottom: 12 }} />
            )}
            <Field label="Cover URL">
              <input {...inp} value={form.cover_image_url} onChange={e => handleChange('cover_image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <label style={{
              display: 'block', padding: 10,
              border: `1px dashed ${COLORS.border}`,
              borderRadius: 6, textAlign: 'center',
              cursor: 'pointer', fontSize: 12, color: COLORS.dim,
            }}>
              {uploading === 'cover_image_url' ? 'Yükleniyor...' : '📁 Dosya Seç'}
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'cover_image_url')} style={{ display: 'none' }} />
            </label>
          </Card>

          <Card title="Konum">
            <Field label="Nüfus">
              <input {...inp} type="number" value={form.population} onChange={e => handleChange('population', e.target.value)} placeholder="15000000" />
            </Field>
            <Field label="Enlem">
              <input {...inp} type="number" step="any" value={form.latitude} onChange={e => handleChange('latitude', e.target.value)} placeholder="41.0082" />
            </Field>
            <Field label="Boylam">
              <input {...inp} type="number" step="any" value={form.longitude} onChange={e => handleChange('longitude', e.target.value)} placeholder="28.9784" />
            </Field>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

const inp = {
  style: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: '10px 12px',
    color: COLORS.white,
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
  },
};

function Card({ title, children }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: COLORS.dim }}>
        {title.toUpperCase()}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, letterSpacing: '0.08em', marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: COLORS.dim }}>{label}</span>
      <div onClick={() => onChange(!checked)} style={{ width: 40, height: 22, borderRadius: 11, background: checked ? COLORS.red : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: COLORS.white, transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

function Btn({ children, onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ background: COLORS.red, border: 'none', color: COLORS.white, padding: '10px 24px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
      {loading ? '...' : children}
    </button>
  );
}

function Alert({ type, children }) {
  const color = type === 'error' ? '#ef4444' : '#10b981';
  return (
    <div style={{ padding: '12px 16px', background: `${color}15`, border: `1px solid ${color}40`, borderRadius: 6, color, fontSize: 13, marginBottom: 20 }}>
      {children}
    </div>
  );
}