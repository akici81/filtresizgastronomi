import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/constants';

export default function AdminHomepage() {
  const [sections, setSections] = useState([]);
  const [slider, setSlider] = useState([]);
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editingSlide, setEditingSlide] = useState(null);
  const [slideForm, setSlideForm] = useState({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [sectionsRes, sliderRes] = await Promise.all([
      supabase.from('homepage_sections').select('*').order('sort_order'),
      supabase.from('homepage_slider').select('*').order('sort_order'),
    ]);
    setSections(sectionsRes.data || []);
    setSlider(sliderRes.data || []);
    setLoading(false);
  }

  // ── SECTIONS ──────────────────────────────────────

  async function toggleSection(section) {
    await supabase.from('homepage_sections').update({ is_active: !section.is_active }).eq('id', section.id);
    setSections(sections.map(s => s.id === section.id ? { ...s, is_active: !s.is_active } : s));
  }

  async function moveSection(id, direction) {
    const idx = sections.findIndex(s => s.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;

    const newSections = [...sections];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newSections[idx], newSections[swapIdx]] = [newSections[swapIdx], newSections[idx]];

    const updates = newSections.map((s, i) => ({ ...s, sort_order: i + 1 }));
    setSections(updates);

    await Promise.all(
      updates.map(s => supabase.from('homepage_sections').update({ sort_order: s.sort_order }).eq('id', s.id))
    );
  }

  async function updateSectionTitle(id, field, value) {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  async function saveSections() {
    setSaving(true);
    setError('');
    setSuccess('');
    await Promise.all(
      sections.map(s =>
        supabase.from('homepage_sections').update({
          title: s.title,
          subtitle: s.subtitle,
          content_limit: s.content_limit,
          is_active: s.is_active,
          sort_order: s.sort_order,
        }).eq('id', s.id)
      )
    );
    setSuccess('Sections kaydedildi!');
    setTimeout(() => setSuccess(''), 3000);
    setSaving(false);
  }

  // ── SLIDER ──────────────────────────────────────

  function openSlideForm(slide = null) {
    if (slide) {
      setSlideForm({ ...slide });
      setEditingSlide(slide.id);
    } else {
      setSlideForm({
        title: '', subtitle: '', description: '',
        image_url: '', mobile_image_url: '',
        button_text: '', button_link: '',
        text_position: 'center', sort_order: slider.length + 1,
        is_active: true,
      });
      setEditingSlide('new');
    }
  }

  async function handleImageUpload(e, field) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    const ext = file.name.split('.').pop();
    const path = `slider/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      setSlideForm(prev => ({ ...prev, [field]: data.publicUrl }));
    }
    setUploading(false);
  }

  async function saveSlide() {
    if (!slideForm.image_url) { setError('Görsel zorunludur.'); return; }
    setSaving(true);
    setError('');

    let result;
    if (editingSlide === 'new') {
      result = await supabase.from('homepage_slider').insert(slideForm).select().single();
    } else {
      result = await supabase.from('homepage_slider').update(slideForm).eq('id', editingSlide).select().single();
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess('Slide kaydedildi!');
      setTimeout(() => setSuccess(''), 3000);
      setEditingSlide(null);
      fetchData();
    }
    setSaving(false);
  }

  async function deleteSlide(id) {
    if (!confirm('Bu slide\'ı silmek istediğinize emin misiniz?')) return;
    await supabase.from('homepage_slider').delete().eq('id', id);
    setSlider(slider.filter(s => s.id !== id));
  }

  async function toggleSlide(slide) {
    await supabase.from('homepage_slider').update({ is_active: !slide.is_active }).eq('id', slide.id);
    setSlider(slider.map(s => s.id === slide.id ? { ...s, is_active: !s.is_active } : s));
  }

  if (loading) return (
    <AdminLayout title="Ana Sayfa Yönetimi">
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.muted }}>Yükleniyor...</div>
    </AdminLayout>
  );

  return (
    <AdminLayout title="Ana Sayfa Yönetimi">
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 0 }}>
        {[
          { key: 'sections', label: 'Bölümler' },
          { key: 'slider', label: 'Slider' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: 'transparent', border: 'none',
              color: activeTab === tab.key ? COLORS.white : COLORS.dim,
              padding: '10px 20px', fontSize: 13, cursor: 'pointer',
              borderBottom: activeTab === tab.key ? `2px solid ${COLORS.red}` : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTIONS TAB */}
      {activeTab === 'sections' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Btn onClick={saveSections} loading={saving}>Kaydet</Btn>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((section, idx) => (
              <div
                key={section.id}
                style={{
                  background: COLORS.card,
                  border: `1px solid ${section.is_active ? COLORS.border : 'rgba(255,255,255,0.03)'}`,
                  borderRadius: 8, padding: 20,
                  opacity: section.is_active ? 1 : 0.5,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Order Buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={idx === 0}
                      style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.dim, width: 24, height: 24, borderRadius: 4, cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 10, opacity: idx === 0 ? 0.3 : 1 }}
                    >▲</button>
                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={idx === sections.length - 1}
                      style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.dim, width: 24, height: 24, borderRadius: 4, cursor: idx === sections.length - 1 ? 'not-allowed' : 'pointer', fontSize: 10, opacity: idx === sections.length - 1 ? 0.3 : 1 }}
                    >▼</button>
                  </div>

                  {/* Section Type Badge */}
                  <div style={{
                    fontSize: 10, padding: '4px 10px', borderRadius: 4,
                    background: 'rgba(232,0,13,0.1)', color: COLORS.red,
                    letterSpacing: '0.08em', whiteSpace: 'nowrap',
                  }}>
                    {section.section_type.toUpperCase()}
                  </div>

                  {/* Title & Subtitle */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <input
                      value={section.title || ''}
                      onChange={e => updateSectionTitle(section.id, 'title', e.target.value)}
                      placeholder="Bölüm başlığı..."
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 6, padding: '8px 12px',
                        color: COLORS.white, fontSize: 13, outline: 'none',
                      }}
                    />
                    <input
                      value={section.subtitle || ''}
                      onChange={e => updateSectionTitle(section.id, 'subtitle', e.target.value)}
                      placeholder="Alt başlık..."
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 6, padding: '8px 12px',
                        color: COLORS.white, fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>

                  {/* Limit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: COLORS.muted, whiteSpace: 'nowrap' }}>Limit:</span>
                    <input
                      type="number"
                      value={section.content_limit || 6}
                      onChange={e => updateSectionTitle(section.id, 'content_limit', parseInt(e.target.value))}
                      style={{
                        width: 60, background: 'rgba(255,255,255,0.04)',
                        border: `1px solid ${COLORS.border}`, borderRadius: 6,
                        padding: '8px 10px', color: COLORS.white, fontSize: 13, outline: 'none',
                      }}
                    />
                  </div>

                  {/* Toggle */}
                  <div onClick={() => toggleSection(section)} style={{ cursor: 'pointer' }}>
                    <div style={{ width: 40, height: 22, borderRadius: 11, background: section.is_active ? COLORS.red : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}>
                      <div style={{ position: 'absolute', top: 3, left: section.is_active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: COLORS.white, transition: 'left 0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLIDER TAB */}
      {activeTab === 'slider' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <Btn onClick={() => openSlideForm()}>+ Yeni Slide</Btn>
          </div>

          {/* Slide List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {slider.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: COLORS.muted, fontSize: 13, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
                Henüz slide eklenmemiş
              </div>
            ) : (
              slider.map(slide => (
                <div
                  key={slide.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: COLORS.card, border: `1px solid ${COLORS.border}`,
                    borderRadius: 8, padding: 16,
                    opacity: slide.is_active ? 1 : 0.5,
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 120, height: 68, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
                    {slide.image_url ? (
                      <img src={slide.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.muted, fontSize: 12 }}>
                        Görsel Yok
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {slide.title || 'Başlıksız Slide'}
                    </div>
                    {slide.subtitle && (
                      <div style={{ fontSize: 12, color: COLORS.dim }}>{slide.subtitle}</div>
                    )}
                    {slide.button_text && (
                      <div style={{ fontSize: 11, color: COLORS.red, marginTop: 4 }}>
                        Buton: {slide.button_text} → {slide.button_link}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div onClick={() => toggleSlide(slide)} style={{ cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 20, borderRadius: 10, background: slide.is_active ? COLORS.red : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 2, left: slide.is_active ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: COLORS.white, transition: 'left 0.2s' }} />
                      </div>
                    </div>
                    <ActionBtn onClick={() => openSlideForm(slide)} color={COLORS.dim} title="Düzenle">✎</ActionBtn>
                    <ActionBtn onClick={() => deleteSlide(slide.id)} color="#ef4444" title="Sil">✕</ActionBtn>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Slide Form Modal */}
          {editingSlide && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
              zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}>
              <div style={{
                background: '#141414', border: `1px solid ${COLORS.border}`,
                borderRadius: 12, width: '100%', maxWidth: 640,
                maxHeight: '90vh', overflowY: 'auto',
              }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>
                    {editingSlide === 'new' ? 'Yeni Slide' : 'Slide Düzenle'}
                  </span>
                  <button onClick={() => setEditingSlide(null)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ padding: 24 }}>
                  {/* Image Preview */}
                  {slideForm.image_url && (
                    <img src={slideForm.image_url} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
                  )}

                  <Field label="Görsel URL *">
                    <input {...inp} value={slideForm.image_url || ''} onChange={e => setSlideForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://..." />
                  </Field>
                  <label style={{ display: 'block', padding: 10, border: `1px dashed ${COLORS.border}`, borderRadius: 6, textAlign: 'center', cursor: 'pointer', fontSize: 12, color: COLORS.dim, marginBottom: 16 }}>
                    {uploading === 'image_url' ? 'Yükleniyor...' : '📁 Görsel Yükle'}
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'image_url')} style={{ display: 'none' }} />
                  </label>

                  <Field label="Başlık">
                    <input {...inp} value={slideForm.title || ''} onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))} placeholder="Slide başlığı..." />
                  </Field>
                  <Field label="Alt Başlık">
                    <input {...inp} value={slideForm.subtitle || ''} onChange={e => setSlideForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Alt başlık..." />
                  </Field>
                  <Field label="Açıklama">
                    <textarea {...inp} rows={2} value={slideForm.description || ''} onChange={e => setSlideForm(p => ({ ...p, description: e.target.value }))} placeholder="Kısa açıklama..." />
                  </Field>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Buton Metni">
                      <input {...inp} value={slideForm.button_text || ''} onChange={e => setSlideForm(p => ({ ...p, button_text: e.target.value }))} placeholder="Keşfet" />
                    </Field>
                    <Field label="Buton Linki">
                      <input {...inp} value={slideForm.button_link || ''} onChange={e => setSlideForm(p => ({ ...p, button_link: e.target.value }))} placeholder="/dishes" />
                    </Field>
                  </div>

                  <Field label="Metin Pozisyonu">
                    <select {...inp} value={slideForm.text_position || 'center'} onChange={e => setSlideForm(p => ({ ...p, text_position: e.target.value }))}>
                      <option value="left">Sol</option>
                      <option value="center">Orta</option>
                      <option value="right">Sağ</option>
                    </select>
                  </Field>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: COLORS.dim }}>Aktif</span>
                      <div onClick={() => setSlideForm(p => ({ ...p, is_active: !p.is_active }))} style={{ width: 40, height: 22, borderRadius: 11, background: slideForm.is_active ? COLORS.red : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                        <div style={{ position: 'absolute', top: 3, left: slideForm.is_active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: COLORS.white, transition: 'left 0.2s' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setEditingSlide(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: COLORS.white, padding: '10px 20px', fontSize: 12, fontWeight: 700, borderRadius: 6, cursor: 'pointer' }}>
                        İptal
                      </button>
                      <Btn onClick={saveSlide} loading={saving}>Kaydet</Btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

const inp = {
  style: {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.border}`, borderRadius: 6,
    padding: '10px 12px', color: COLORS.white,
    fontSize: 13, outline: 'none', resize: 'vertical',
  },
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, letterSpacing: '0.08em', marginBottom: 6 }}>{label.toUpperCase()}</label>}
      {children}
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

function ActionBtn({ children, onClick, color, title }) {
  return (
    <button onClick={onClick} title={title} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color, width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = COLORS.border}
    >
      {children}
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