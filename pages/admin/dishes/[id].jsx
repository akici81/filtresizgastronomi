import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS, DISH_CATEGORIES, DIFFICULTY_LEVELS } from '../../../lib/constants';

const EMPTY_FORM = {
  name: '', slug: '', category: '', short_description: '',
  description: '', story: '', city_id: '', status: 'draft',
  is_featured: false, is_vegetarian: false, is_vegan: false,
  is_gluten_free: false, difficulty: 'medium', prep_time: '',
  cook_time: '', servings: '', calories: '', season: '',
  image_url: '', video_url: '', recipe: '', tags: '',
  seo_title: '', seo_description: '',
  gi_status: false, gi_number: '', gi_source_url: '',
};

export default function DishForm() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCities();
    if (!isNew && id) fetchDish();
  }, [id]);

  async function fetchCities() {
    const { data } = await supabase.from('cities').select('id, name').eq('is_active', true).order('name');
    setCities(data || []);
  }

  async function fetchDish() {
    setLoading(true);
    const { data } = await supabase.from('dishes').select('*').eq('id', id).single();
    if (data) {
      setForm({
        ...EMPTY_FORM,
        ...data,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        city_id: data.city_id || '',
      });
    }
    setLoading(false);
  }

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    // Auto slug
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

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `dishes/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      handleChange('image_url', data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave(status) {
    setError('');
    setSuccess('');
    if (!form.name) { setError('Yemek adı zorunludur.'); return; }
    if (!form.slug) { setError('Slug zorunludur.'); return; }
    setSaving(true);

    const payload = {
      ...form,
      status: status || form.status,
      city_id: form.city_id || null,
      prep_time: form.prep_time ? parseInt(form.prep_time) : null,
      cook_time: form.cook_time ? parseInt(form.cook_time) : null,
      servings: form.servings ? parseInt(form.servings) : null,
      calories: form.calories ? parseInt(form.calories) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      published_at: status === 'published' ? new Date().toISOString() : null,
      gi_status: form.gi_status || false,
      gi_number: form.gi_number || null,
      gi_source_url: form.gi_source_url || null,
    };

    let result;
    if (isNew) {
      result = await supabase.from('dishes').insert(payload).select().single();
    } else {
      result = await supabase.from('dishes').update(payload).eq('id', id).select().single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess('Kaydedildi!');
      if (isNew) router.push(`/admin/dishes/${result.data.id}`);
    }
    setSaving(false);
  }

  if (loading) return (
    <AdminLayout title="Yemek">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={isNew ? 'Yeni Yemek' : 'Yemeği Düzenle'}>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => router.push('/admin/dishes')}
          style={{ background: 'transparent', border: 'none', color: 'var(--dim)', fontSize: 13, cursor: 'pointer' }}
        >
          ← Geri
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => handleSave('draft')} loading={saving} variant="secondary">
            Taslak Kaydet
          </Btn>
          <Btn onClick={() => handleSave('published')} loading={saving}>
            Yayınla
          </Btn>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Basic Info */}
          <Card title="Temel Bilgiler">
            <Field label="Yemek Adı *">
              <input {...inputProps} value={form.name} onChange={e => handleChange('name', e.target.value)} placeholder="Adana Kebap" />
            </Field>
            <Field label="Slug *">
              <input {...inputProps} value={form.slug} onChange={e => handleChange('slug', e.target.value)} placeholder="adana-kebap" />
            </Field>
            <Field label="Kısa Açıklama">
              <textarea {...inputProps} rows={2} value={form.short_description} onChange={e => handleChange('short_description', e.target.value)} placeholder="Tek cümlelik açıklama..." />
            </Field>
            <Field label="Açıklama">
              <textarea {...inputProps} rows={4} value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Yemeği anlatan paragraf..." />
            </Field>
            <Field label="Hikaye">
              <textarea {...inputProps} rows={4} value={form.story} onChange={e => handleChange('story', e.target.value)} placeholder="Yemeğin hikayesi, tarihi..." />
            </Field>
          </Card>

          {/* Recipe */}
          <Card title="Tarif">
            <Field label="Tarif">
              <textarea {...inputProps} rows={6} value={form.recipe} onChange={e => handleChange('recipe', e.target.value)} placeholder="Hazırlanış tarifi..." />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <Field label="Hazırlık (dk)">
                <input {...inputProps} type="number" value={form.prep_time} onChange={e => handleChange('prep_time', e.target.value)} placeholder="30" />
              </Field>
              <Field label="Pişirme (dk)">
                <input {...inputProps} type="number" value={form.cook_time} onChange={e => handleChange('cook_time', e.target.value)} placeholder="60" />
              </Field>
              <Field label="Porsiyon">
                <input {...inputProps} type="number" value={form.servings} onChange={e => handleChange('servings', e.target.value)} placeholder="4" />
              </Field>
              <Field label="Kalori">
                <input {...inputProps} type="number" value={form.calories} onChange={e => handleChange('calories', e.target.value)} placeholder="350" />
              </Field>
            </div>
          </Card>

          {/* SEO */}
          <Card title="SEO">
            <Field label="SEO Başlık">
              <input {...inputProps} value={form.seo_title} onChange={e => handleChange('seo_title', e.target.value)} placeholder="Arama motorları için başlık" />
            </Field>
            <Field label="SEO Açıklama">
              <textarea {...inputProps} rows={2} value={form.seo_description} onChange={e => handleChange('seo_description', e.target.value)} placeholder="Meta açıklama (max 160 karakter)" />
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
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Tescilli Coğrafi İşaret</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>TürkPatent tarafından tescillenmiş ürün</div>
                </div>
              </label>
            </div>
            {form.gi_status && (
              <>
                <Field label="TESCİL NUMARASI">
                  <input {...inputProps} value={form.gi_number || ''} onChange={e => handleChange('gi_number', e.target.value)} placeholder="Örn: 123" />
                </Field>
                <Field label="KAYNAK URL (TürkPatent)">
                  <input {...inputProps} value={form.gi_source_url || ''} onChange={e => handleChange('gi_source_url', e.target.value)} placeholder="https://ci.turkpatent.gov.tr/..." />
                </Field>
              </>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status */}
          <Card title="Durum">
            <Field label="Yayın Durumu">
              <select {...inputProps} value={form.status} onChange={e => handleChange('status', e.target.value)}>
                <option value="draft">Taslak</option>
                <option value="pending">İnceleme Bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select>
            </Field>
            <Toggle label="Öne Çıkan" checked={form.is_featured} onChange={v => handleChange('is_featured', v)} />
          </Card>

          {/* Image */}
          <Card title="Görsel">
            {form.image_url && (
              <img src={form.image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, marginBottom: 12 }} />
            )}
            <Field label="Görsel URL">
              <input {...inputProps} value={form.image_url} onChange={e => handleChange('image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <div style={{ textAlign: 'center', margin: '8px 0', color: 'var(--muted)', fontSize: 12 }}>veya</div>
            <label style={{
              display: 'block',
              padding: '10px',
              border: `1px dashed ${'var(--border)'}`,
              borderRadius: 6,
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--dim)',
            }}>
              {uploading ? 'Yükleniyor...' : '📁 Dosya Seç'}
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
            <Field label="Video URL" style={{ marginTop: 12 }}>
              <input {...inputProps} value={form.video_url} onChange={e => handleChange('video_url', e.target.value)} placeholder="YouTube veya Vimeo URL" />
            </Field>
          </Card>

          {/* Details */}
          <Card title="Detaylar">
            <Field label="Şehir">
              <select {...inputProps} value={form.city_id} onChange={e => handleChange('city_id', e.target.value)}>
                <option value="">Şehir Seç</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Kategori">
              <select {...inputProps} value={form.category} onChange={e => handleChange('category', e.target.value)}>
                <option value="">Kategori Seç</option>
                {DISH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Zorluk">
              <select {...inputProps} value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
                {Object.entries(DIFFICULTY_LEVELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Mevsim">
              <select {...inputProps} value={form.season} onChange={e => handleChange('season', e.target.value)}>
                <option value="">Seç</option>
                <option value="İlkbahar">İlkbahar</option>
                <option value="Yaz">Yaz</option>
                <option value="Sonbahar">Sonbahar</option>
                <option value="Kış">Kış</option>
                <option value="Tüm Yıl">Tüm Yıl</option>
              </select>
            </Field>
            <Field label="Etiketler (virgülle ayır)">
              <input {...inputProps} value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="kebap, ızgara, et" />
            </Field>
          </Card>

          {/* Properties */}
          <Card title="Özellikler">
            <Toggle label="Vejetaryen" checked={form.is_vegetarian} onChange={v => handleChange('is_vegetarian', v)} />
            <Toggle label="Vegan" checked={form.is_vegan} onChange={v => handleChange('is_vegan', v)} />
            <Toggle label="Glutensiz" checked={form.is_gluten_free} onChange={v => handleChange('is_gluten_free', v)} />
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

// Shared input style
const inputProps = {
  style: {
    width: '100%',
    background: 'var(--subtle-bg)',
    border: `1px solid ${'var(--border)'}`,
    borderRadius: 6,
    padding: '10px 12px',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
  },
};

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${'var(--border)'}`, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--dim)' }}>
        {title.toUpperCase()}
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 13, color: 'var(--dim)' }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? 'var(--red)' : 'rgba(255,255,255,0.1)',
          cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3,
          left: checked ? 21 : 3,
          width: 16, height: 16,
          borderRadius: '50%', background: 'var(--text)',
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  );
}

function Btn({ children, onClick, loading, variant = 'primary' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        background: variant === 'primary' ? 'var(--red)' : 'rgba(255,255,255,0.08)',
        border: 'none',
        color: 'var(--text)',
        padding: '10px 20px',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        borderRadius: 6,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}

function Alert({ type, children }) {
  const color = type === 'error' ? '#ef4444' : '#10b981';
  return (
    <div style={{
      padding: '12px 16px',
      background: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: 6,
      color,
      fontSize: 13,
      marginBottom: 20,
    }}>
      {children}
    </div>
  );
}