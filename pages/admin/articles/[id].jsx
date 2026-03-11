import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import { supabase } from '../../../lib/supabase';
import { COLORS, ARTICLE_CATEGORIES } from '../../../lib/constants';

const EMPTY_FORM = {
  title: '', slug: '', excerpt: '', content: '',
  category: 'story', tags: '',
  city_id: '', dish_id: '', restaurant_id: '', chef_id: '',
  cover_image_url: '', og_image_url: '', read_time: '',
  status: 'draft', is_featured: false, is_editors_pick: false,
  seo_title: '', seo_description: '',
};

export default function ArticleForm() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [form, setForm] = useState(EMPTY_FORM);
  const [gallery, setGallery] = useState([]);
  const [cities, setCities] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchRelated();
    if (!isNew && id) fetchArticle();
  }, [id]);

  async function fetchRelated() {
    const [c, d, r, ch] = await Promise.all([
      supabase.from('cities').select('id, name').eq('is_active', true).order('name'),
      supabase.from('dishes').select('id, name').eq('status', 'published').order('name'),
      supabase.from('restaurants').select('id, name').eq('status', 'published').order('name'),
      supabase.from('chefs').select('id, name').eq('status', 'published').order('name'),
    ]);
    setCities(c.data || []);
    setDishes(d.data || []);
    setRestaurants(r.data || []);
    setChefs(ch.data || []);
  }

  async function fetchArticle() {
    setLoading(true);
    const { data } = await supabase.from('articles').select('*').eq('id', id).single();
    if (data) {
      setForm({
        ...EMPTY_FORM, ...data,
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        city_id: data.city_id || '',
        dish_id: data.dish_id || '',
        restaurant_id: data.restaurant_id || '',
        chef_id: data.chef_id || '',
        read_time: data.read_time || '',
      });
      if (Array.isArray(data.gallery) && data.gallery.length > 0) setGallery(data.gallery);
    }
    setLoading(false);
  }

  function handleChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'title' && (isNew || !form.slug)) {
      setForm(prev => ({
        ...prev, title: value,
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
    const path = `articles/${Date.now()}_${field}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      handleChange(field, data.publicUrl);
    }
    setUploading(false);
  }

  async function handleGalleryUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading('gallery');
    const urls = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `articles/gallery/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('images').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setGallery(prev => [...prev, ...urls]);
    setUploading(false);
  }

  function removeGalleryImage(i) {
    setGallery(prev => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave(status) {
    setError(''); setSuccess('');
    if (!form.title) { setError('Makale başlığı zorunludur.'); return; }
    if (!form.slug) { setError('Slug zorunludur.'); return; }
    setSaving(true);

    const payload = {
      ...form,
      status: status || form.status,
      city_id: form.city_id || null,
      dish_id: form.dish_id || null,
      restaurant_id: form.restaurant_id || null,
      chef_id: form.chef_id || null,
      read_time: form.read_time ? parseInt(form.read_time) : null,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      gallery,
      published_at: status === 'published' ? new Date().toISOString() : (form.published_at || null),
    };

    let result;
    if (isNew) {
      result = await supabase.from('articles').insert(payload).select().single();
    } else {
      result = await supabase.from('articles').update(payload).eq('id', id).select().single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess('Kaydedildi!');
      if (isNew) router.push(`/admin/articles/${result.data.id}`);
    }
    setSaving(false);
  }

  if (loading) return (
    <AdminLayout title="Makale">
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Yükleniyor...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={isNew ? 'Yeni Makale' : 'Makaleyi Düzenle'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <button onClick={() => router.push('/admin/articles')}
          style={{ background: 'transparent', border: 'none', color: 'var(--dim)', fontSize: 13, cursor: 'pointer' }}>
          ← Geri
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn onClick={() => handleSave('draft')} loading={saving} variant="secondary">Taslak Kaydet</Btn>
          <Btn onClick={() => handleSave('published')} loading={saving}>Yayınla</Btn>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* Sol Kolon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Card title="Makale Bilgileri">
            <Field label="Başlık *">
              <input style={inp} value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Makale başlığı..." />
            </Field>
            <Field label="Slug *">
              <input style={inp} value={form.slug} onChange={e => handleChange('slug', e.target.value)} placeholder="makale-basligi" />
            </Field>
            <Field label="Özet">
              <textarea style={inp} rows={3} value={form.excerpt} onChange={e => handleChange('excerpt', e.target.value)} placeholder="Makale özeti, liste görünümünde gösterilir..." />
            </Field>
          </Card>

          <Card title="İçerik">
            <Field label="Makale İçeriği">
              <textarea
                style={{ ...inp, fontFamily: 'monospace', lineHeight: 1.6 }}
                rows={22}
                value={form.content}
                onChange={e => handleChange('content', e.target.value)}
                placeholder="Makale içeriğini buraya yazın... HTML desteklenir."
              />
            </Field>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: -8 }}>
              Desteklenen etiketler: &lt;p&gt;, &lt;h2&gt;, &lt;h3&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;blockquote&gt;, &lt;img&gt;
            </div>
          </Card>

          {/* Galeri */}
          <Card title="Galeri">
            {gallery.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
                {gallery.map((url, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={url} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6 }} />
                    <button onClick={() => removeGalleryImage(i)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ display: 'block', padding: '12px', border: `1px dashed ${'var(--border)'}`, borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--dim)' }}>
              {uploading === 'gallery' ? 'Yükleniyor...' : '📁 Galeri Görseli Ekle (çoklu seçim)'}
              <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} style={{ display: 'none' }} />
            </label>
          </Card>

          {/* SEO */}
          <Card title="SEO">
            <Field label="SEO Başlık">
              <input style={inp} value={form.seo_title} onChange={e => handleChange('seo_title', e.target.value)} placeholder="Makale Başlığı | Filtresiz Gastronomi" />
            </Field>
            <Field label="SEO Açıklama">
              <textarea style={inp} rows={2} value={form.seo_description} onChange={e => handleChange('seo_description', e.target.value)} placeholder="Meta açıklama (max 160 karakter)" />
            </Field>
            <Field label="OG Görsel URL">
              <input style={inp} value={form.og_image_url} onChange={e => handleChange('og_image_url', e.target.value)} placeholder="Sosyal medya paylaşım görseli..." />
            </Field>
            <UploadBtn uploading={uploading === 'og_image_url'} onChange={e => handleImageUpload(e, 'og_image_url')} label="📁 OG Görsel Yükle" />
          </Card>
        </div>

        {/* Sağ Kolon */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Card title="Durum">
            <Field label="Yayın Durumu">
              <select style={inp} value={form.status} onChange={e => handleChange('status', e.target.value)}>
                <option value="draft">Taslak</option>
                <option value="pending">İnceleme Bekliyor</option>
                <option value="published">Yayında</option>
                <option value="archived">Arşiv</option>
              </select>
            </Field>
            <Toggle label="Öne Çıkan" checked={form.is_featured} onChange={v => handleChange('is_featured', v)} />
            <Toggle label="Editör Seçimi" checked={form.is_editors_pick} onChange={v => handleChange('is_editors_pick', v)} />
          </Card>

          {/* Kapak Görseli */}
          <Card title="Kapak Görseli">
            {form.cover_image_url && (
              <img src={form.cover_image_url} alt="" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />
            )}
            <Field label="Görsel URL">
              <input style={inp} value={form.cover_image_url} onChange={e => handleChange('cover_image_url', e.target.value)} placeholder="https://..." />
            </Field>
            <UploadBtn uploading={uploading === 'cover_image_url'} onChange={e => handleImageUpload(e, 'cover_image_url')} />
          </Card>

          {/* Kategori & Etiketler */}
          <Card title="Kategori & Etiketler">
            <Field label="Kategori">
              <select style={inp} value={form.category} onChange={e => handleChange('category', e.target.value)}>
                {Object.entries(ARTICLE_CATEGORIES).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Etiketler (virgülle ayır)">
              <input style={inp} value={form.tags} onChange={e => handleChange('tags', e.target.value)} placeholder="gastronomi, istanbul, kebap" />
            </Field>
            <Field label="Okuma Süresi (dk)">
              <input style={inp} type="number" value={form.read_time} onChange={e => handleChange('read_time', e.target.value)} placeholder="5" />
            </Field>
          </Card>

          {/* İlişkili İçerik */}
          <Card title="İlişkili İçerik">
            <Field label="Şehir">
              <select style={inp} value={form.city_id} onChange={e => handleChange('city_id', e.target.value)}>
                <option value="">Seç</option>
                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Yemek">
              <select style={inp} value={form.dish_id} onChange={e => handleChange('dish_id', e.target.value)}>
                <option value="">Seç</option>
                {dishes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Restoran">
              <select style={inp} value={form.restaurant_id} onChange={e => handleChange('restaurant_id', e.target.value)}>
                <option value="">Seç</option>
                {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="Şef">
              <select style={inp} value={form.chef_id} onChange={e => handleChange('chef_id', e.target.value)}>
                <option value="">Seç</option>
                {chefs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

const inp = {
  width: '100%', background: 'var(--subtle-bg)',
  border: `1px solid ${'var(--border)'}`, borderRadius: 6,
  padding: '10px 12px', color: 'var(--text)', fontSize: 13,
  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
};

function UploadBtn({ uploading, onChange, label = '📁 Dosya Seç' }) {
  return (
    <label style={{ display: 'block', padding: '8px', border: `1px dashed ${'var(--border)'}`, borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>
      {uploading ? 'Yükleniyor...' : label}
      <input type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </label>
  );
}

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
      <div onClick={() => onChange(!checked)}
        style={{ width: 40, height: 22, borderRadius: 11, background: checked ? 'var(--red)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--text)', transition: 'left 0.2s' }} />
      </div>
    </div>
  );
}

function Btn({ children, onClick, loading, variant = 'primary' }) {
  return (
    <button onClick={onClick} disabled={loading}
      style={{ background: variant === 'primary' ? 'var(--red)' : 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text)', padding: '10px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
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