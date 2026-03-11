import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, DIFFICULTY_LEVELS } from '../../lib/constants';

export default function DishDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const { user } = useAuth();
  const [dish, setDish] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [isFavorited, setIsFavorited] = useState(false);
  const [favId, setFavId] = useState(null);

  useEffect(() => { if (slug) fetchDish(); }, [slug]);
  useEffect(() => { if (dish && user) checkFavorite(); }, [dish, user]);

  async function fetchDish() {
    setLoading(true);
    const { data } = await supabase
      .from('dishes')
      .select('*, cities(id, name, slug)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();
    setDish(data);
    if (data) {
      // reviews tablosunda dish_id kolonu var
      const { data: r } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, username, avatar_url)')
        .eq('dish_id', data.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      setReviews(r || []);
    }
    setLoading(false);
  }

  async function checkFavorite() {
    // favorites tablosunda dish_id kolonu var
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('dish_id', dish.id)
      .maybeSingle();
    setIsFavorited(!!data);
    setFavId(data?.id || null);
  }

  async function toggleFavorite() {
    if (!user) { router.push('/login'); return; }
    if (isFavorited && favId) {
      await supabase.from('favorites').delete().eq('id', favId);
      setIsFavorited(false);
      setFavId(null);
    } else {
      const { data } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, dish_id: dish.id })
        .select('id')
        .single();
      setIsFavorited(true);
      setFavId(data?.id || null);
    }
  }

  async function submitReview() {
    if (!user) { router.push('/login'); return; }
    if (!reviewForm.comment.trim()) { setReviewMsg({ type: 'error', text: 'Yorum yazınız.' }); return; }
    setSubmitting(true);
    // reviews tablosunda dish_id kolonu var
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      dish_id: dish.id,
      rating: reviewForm.rating,
      content: reviewForm.comment,
      is_approved: true,
    });
    if (error) {
      setReviewMsg({ type: 'error', text: error.message });
    } else {
      setReviewMsg({ type: 'success', text: 'Yorumunuz eklendi!' });
      setReviewForm({ rating: 5, comment: '' });
      fetchDish();
    }
    setSubmitting(false);
  }

  if (loading) return <Layout><div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--muted)' }}>Yükleniyor...</div></Layout>;
  if (!dish) return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '120px 24px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽</div>
        <h2>Yemek bulunamadı</h2>
        <button onClick={() => router.push('/dishes')} style={{ marginTop: 16, background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer' }}>Tüm Yemekler</button>
      </div>
    </Layout>
  );

  const ingredients = Array.isArray(dish.ingredients) ? dish.ingredients : [];
  const gallery = Array.isArray(dish.gallery) ? dish.gallery : [];

  return (
    <Layout>
      <Head>
        <title>{dish.seo_title || `${dish.name} | Filtresiz Gastronomi`}</title>
        <meta name="description" content={dish.seo_description || dish.short_description || ''} />
      </Head>

      {/* Hero */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
        {dish.image_url
          ? <img src={dish.image_url} alt={dish.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: 'var(--hero-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>🍽</div>}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 40px 40px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {dish.category && (
              <div style={{ display: 'inline-block', background: 'var(--red)', padding: '4px 12px', borderRadius: 20, fontSize: 12, marginBottom: 12 }}>
                {dish.category}
              </div>
            )}
            <h1 style={{ fontSize: 48, fontWeight: 900, margin: '0 0 12px', letterSpacing: '-0.02em' }}>{dish.name}</h1>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              {dish.cities?.name && (
                <span onClick={() => router.push(`/city/${dish.cities.slug}`)} style={{ fontSize: 14, color: 'var(--dim)', cursor: 'pointer' }}>
                  📍 {dish.cities.name}
                </span>
              )}
              {dish.rating_avg > 0 && (
                <span style={{ fontSize: 14, color: '#f59e0b' }}>
                  ★ {Number(dish.rating_avg).toFixed(1)} ({dish.rating_count} değerlendirme)
                </span>
              )}
              {dish.difficulty && (
                <span style={{ fontSize: 14, color: 'var(--dim)' }}>
                  {DIFFICULTY_LEVELS[dish.difficulty] || dish.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={toggleFavorite}
          style={{ position: 'absolute', top: 24, right: 24, background: isFavorited ? 'var(--red)' : 'rgba(0,0,0,0.6)', border: `1px solid ${isFavorited ? 'var(--red)' : 'rgba(255,255,255,0.2)'}`, backdropFilter: 'blur(8px)', color: 'var(--text)', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
        >
          {isFavorited ? '♥' : '♡'}
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 48 }}>
          {/* Sol */}
          <div>
            {dish.short_description && (
              <p style={{ fontSize: 18, color: 'var(--dim)', lineHeight: 1.7, marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                {dish.short_description}
              </p>
            )}

            {dish.description && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Hakkında</h2>
                <div style={{ fontSize: 15, color: 'var(--dim)', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: dish.description }} />
              </div>
            )}

            {dish.story && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Hikayesi</h2>
                <div style={{ fontSize: 15, color: 'var(--dim)', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: dish.story }} />
              </div>
            )}

            {dish.recipe && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Tarif</h2>
                <div style={{ fontSize: 15, color: 'var(--dim)', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: dish.recipe }} />
              </div>
            )}

            {gallery.length > 0 && (
              <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${'var(--border)'}` }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Galeri</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {gallery.map((img, i) => (
                    <img key={i} src={img} alt={`${dish.name} ${i + 1}`} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </div>
              </div>
            )}

            {/* Yorumlar */}
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                Değerlendirmeler {reviews.length > 0 && <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 16 }}>({reviews.length})</span>}
              </h2>
              {user ? (
                <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 32 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Değerlendirme Yaz</h3>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                        style={{ fontSize: 28, cursor: 'pointer', color: star <= reviewForm.rating ? '#f59e0b' : 'var(--border)', transition: 'color 0.15s' }}>★</span>
                    ))}
                  </div>
                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                    placeholder="Bu yemek hakkında düşüncelerinizi paylaşın..."
                    rows={4}
                    style={{ width: '100%', background: 'var(--subtle-bg)', border: `1px solid ${'var(--border)'}`, borderRadius: 8, padding: '12px 16px', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  {reviewMsg.text && (
                    <div style={{ color: reviewMsg.type === 'error' ? '#ef4444' : '#10b981', fontSize: 13, marginTop: 8 }}>{reviewMsg.text}</div>
                  )}
                  <button onClick={submitReview} disabled={submitting}
                    style={{ marginTop: 12, background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Gönderiliyor...' : 'Gönder'}
                  </button>
                </div>
              ) : (
                <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 32, textAlign: 'center' }}>
                  <p style={{ color: 'var(--dim)', marginBottom: 16 }}>Değerlendirme yapmak için giriş yapın</p>
                  <button onClick={() => router.push('/login')} style={{ background: 'var(--red)', border: 'none', color: 'var(--text)', padding: '10px 24px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>Giriş Yap</button>
                </div>
              )}
              {reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Henüz değerlendirme yok. İlk sen değerlendir!</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {reviews.map(review => (
                    <div key={review.id} style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                            {(review.profiles?.full_name || review.profiles?.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{review.profiles?.full_name || review.profiles?.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(review.created_at).toLocaleDateString('tr-TR')}</div>
                          </div>
                        </div>
                        <div style={{ color: '#f59e0b' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      </div>
                      <p style={{ margin: 0, fontSize: 14, color: 'var(--dim)', lineHeight: 1.6 }}>{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sağ Sidebar */}
          <div>
            <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24, marginBottom: 24, position: 'sticky', top: 80 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Bilgiler</h3>
              {[
                dish.cities?.name && { label: 'Şehir', value: dish.cities.name },
                dish.difficulty && { label: 'Zorluk', value: DIFFICULTY_LEVELS[dish.difficulty] || dish.difficulty },
                dish.prep_time && { label: 'Hazırlık', value: `${dish.prep_time} dk` },
                dish.cook_time && { label: 'Pişirme', value: `${dish.cook_time} dk` },
                dish.servings && { label: 'Porsiyon', value: `${dish.servings} kişilik` },
                dish.calories && { label: 'Kalori', value: `${dish.calories} kcal` },
                dish.season && { label: 'Mevsim', value: dish.season },
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${'var(--border)'}` }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                {dish.is_vegetarian && <span style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 20 }}>🌿 Vejetaryen</span>}
                {dish.is_vegan && <span style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 20 }}>🌱 Vegan</span>}
                {dish.is_gluten_free && <span style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', borderRadius: 20 }}>🌾 Glutensiz</span>}
                {dish.gi_status && (() => {
                  const muhurUrl =
                    dish.gi_tur === 'Menşe Adı'
                      ? 'https://ci.turkpatent.gov.tr/uploads/images/mense_adi.png'
                      : dish.gi_tur === 'Geleneksel Ürün Adı'
                      ? 'https://ci.turkpatent.gov.tr/uploads/images/geleneksel_urun.png'
                      : 'https://ci.turkpatent.gov.tr/uploads/images/mahrec_isareti.png';
                  const muhurRenk =
                    dish.gi_tur === 'Menşe Adı' ? '#3b82f6' :
                    dish.gi_tur === 'Geleneksel Ürün Adı' ? '#10b981' : '#f59e0b';
                  const muhurBg =
                    dish.gi_tur === 'Menşe Adı' ? 'rgba(59,130,246,0.08)' :
                    dish.gi_tur === 'Geleneksel Ürün Adı' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
                  return (
                    <a
                      href={dish.gi_source_url || 'https://ci.turkpatent.gov.tr/veri-tabani'}
                      target="_blank" rel="noopener noreferrer"
                      style={{ textDecoration: 'none', display: 'block', marginTop: 16 }}
                    >
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        background: muhurBg,
                        border: `1px solid ${muhurRenk}40`,
                        borderRadius: 12, padding: '12px 16px',
                        transition: 'all 0.2s',
                      }}>
                        <img src={muhurUrl} alt={dish.gi_tur}
                          style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: muhurRenk, marginBottom: 3 }}>
                            {dish.gi_tur || 'Coğrafi İşaret'} Tescilli
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 500 }}>
                            {dish.name}
                          </div>
                          {dish.gi_number && (
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              Tescil No: {dish.gi_number} · Türkpatent ↗
                            </div>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })()}
              </div>
            </div>

            {ingredients.length > 0 && (
              <div style={{ background: 'var(--card)', border: `1px solid ${'var(--border)'}`, borderRadius: 12, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Malzemeler</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {ingredients.map((ing, i) => (
                    <li key={i} style={{ padding: '8px 0', borderBottom: `1px solid ${'var(--border)'}`, fontSize: 13, color: 'var(--dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--red)', fontSize: 8 }}>●</span>
                      {typeof ing === 'object' ? `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim() : ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}