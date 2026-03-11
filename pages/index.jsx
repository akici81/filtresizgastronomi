console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import Layout from '../components/layout/Layout';
import { useSiteSettings } from '../hooks/useSiteSettings';

export default function HomePage() {
  const router = useRouter();
  const { settings } = useSiteSettings();
  const [dishes, setDishes] = useState([]);
  const [cities, setCities] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ dishes: 0, cities: 0, restaurants: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [dishesRes, citiesRes, restaurantsRes, dishCount, cityCount, restCount] = await Promise.all([
      supabase.from('dishes').select('*, cities(name, slug)').eq('status', 'published').eq('is_featured', true).limit(8),
      supabase.from('cities').select('*').eq('is_active', true).eq('is_featured', true).limit(12),
      supabase.from('restaurants').select('*, cities(name, slug)').eq('status', 'published').eq('is_featured', true).limit(6),
      supabase.from('dishes').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('cities').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('restaurants').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]);

    setDishes(dishesRes.data || []);
    setCities(citiesRes.data || []);
    setRestaurants(restaurantsRes.data || []);
    setStats({
      dishes: dishCount.count || 0,
      cities: cityCount.count || 0,
      restaurants: restCount.count || 0,
    });
    setLoading(false);
  }

  return (
    <Layout transparentNav>
      {/* HERO */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48px',
      }}>
        {/* Background Effects */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(232,0,13,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 820 }}>
          <div style={{ 
            fontSize: 10, 
            letterSpacing: '0.35em', 
            color: 'var(--red)', 
            marginBottom: 24 
          }}>
            {settings.site_tagline || "TÜRKİYE'NİN GASTRONOMİ HAFIZASI"}
          </div>
          
          <h1 style={{
            margin: '0 0 24px',
            fontSize: 'clamp(52px, 9vw, 96px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            fontFamily: "'Georgia', serif",
            lineHeight: 0.95,
          }}>
            {settings.hero_title?.split(' ')[0] || 'Filtresiz'}<br />
            <span style={{ color: 'var(--red)' }}>
              {settings.hero_title?.split(' ')[1] || 'Gastronomi'}
            </span>
          </h1>

          <p style={{
            fontSize: 16,
            color: 'var(--dim)',
            marginBottom: 48,
            lineHeight: 1.75,
            maxWidth: 480,
            margin: '0 auto 48px',
          }}>
            {settings.hero_description || 'Yöresel lezzetleri keşfedin. Hikayeleri okuyun. En iyi restoranları bulun. Deneyimlerinizi paylaşın.'}
          </p>

          {/* Search Box */}
          <SearchBox />

          {/* Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 64,
            marginTop: 72,
          }}>
            {[
              [stats.dishes || '0', 'Yöresel Yemek'],
              [stats.cities || '0', 'İl'],
              [stats.restaurants || '0', 'Restoran'],
            ].map(([num, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 36, 
                  fontWeight: 900, 
                  color: 'var(--text)',
                  fontFamily: "'Georgia', serif",
                }}>
                  {num}
                </div>
                <div style={{ 
                  fontSize: 9, 
                  letterSpacing: '0.2em', 
                  color: 'var(--dim)', 
                  marginTop: 6 
                }}>
                  {label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          color: 'var(--muted)',
          fontSize: 9,
          letterSpacing: '0.2em',
        }}>
          <span>KAYDIRIN</span>
          <div style={{ 
            width: 1, 
            height: 40, 
            background: `linear-gradient(${'var(--red)'}, transparent)` 
          }} />
        </div>
      </section>

      {/* POPULAR DISHES */}
      <section style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader 
            tag="KEŞFET"
            title="Popüler Yemekler"
            linkText="Tüm Yemekler"
            linkHref="/dishes"
            router={router}
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 20,
          }}>
            {loading ? (
              [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
            ) : dishes.length > 0 ? (
              dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} onClick={() => router.push(`/dish/${dish.slug}`)} />
              ))
            ) : (
              <EmptyState message="Henüz yemek eklenmemiş" />
            )}
          </div>
        </div>
      </section>

      {/* CITIES */}
      <section style={{
        padding: '96px 48px',
        background: 'var(--section-bg)',
        borderTop: `1px solid ${'var(--border)'}`,
        borderBottom: `1px solid ${'var(--border)'}`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader 
            tag="81 İL"
            title="Şehre Göre Keşfet"
            linkText="Tüm Şehirler"
            linkHref="/cities"
            router={router}
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {loading ? (
              [...Array(6)].map((_, i) => <CardSkeleton key={i} height={160} />)
            ) : cities.length > 0 ? (
              cities.map((city) => (
                <CityCard key={city.id} city={city} onClick={() => router.push(`/city/${city.slug}`)} />
              ))
            ) : (
              <EmptyState message="Henüz şehir eklenmemiş" />
            )}
          </div>
        </div>
      </section>

      {/* RESTAURANTS */}
      <section style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionHeader 
            tag="TAVSİYE EDİLEN"
            title="Öne Çıkan Restoranlar"
            linkText="Tüm Restoranlar"
            linkHref="/restaurants"
            router={router}
          />
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}>
            {loading ? (
              [...Array(6)].map((_, i) => <CardSkeleton key={i} height={120} />)
            ) : restaurants.length > 0 ? (
              restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} onClick={() => router.push(`/restaurant/${restaurant.slug}`)} />
              ))
            ) : (
              <EmptyState message="Henüz restoran eklenmemiş" />
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '96px 48px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ 
            fontSize: 10, 
            color: 'var(--red)', 
            letterSpacing: '0.25em', 
            marginBottom: 16 
          }}>
            ✦ TOPLULUĞA KATIL
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 900,
            fontFamily: "'Georgia', serif",
            margin: '0 0 20px',
            lineHeight: 1.2,
          }}>
            Gastronomi hafızasını<br />birlikte yazıyoruz
          </h2>
          <p style={{
            fontSize: 16,
            color: 'var(--dim)',
            lineHeight: 1.75,
            marginBottom: 40,
          }}>
            Yöresel tarifleri ekleyin, restoranları değerlendirin,<br />
            gastronomi tutkunlarıyla tanışın.
          </p>
          <button
            onClick={() => router.push('/register')}
            style={{
              background: 'var(--red)',
              border: 'none',
              color: 'var(--text)',
              padding: '16px 40px',
              fontSize: 13,
              letterSpacing: '0.12em',
              cursor: 'pointer',
              borderRadius: 4,
              fontWeight: 800,
            }}
            onMouseEnter={(e) => e.target.style.background = '#c8000b'}
            onMouseLeave={(e) => e.target.style.background = 'var(--red)'}
          >
            ÜYE OL — ÜCRETSİZ
          </button>
        </div>
      </section>
    </Layout>
  );
}

// Search Box Component
function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{
      display: 'flex',
      justifyContent: 'center',
      maxWidth: 600,
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--block-bg)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        overflow: 'hidden',
        width: '100%',
      }}>
        <span style={{ padding: '0 16px', color: 'var(--dim)' }}>🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Yemek, şehir veya restoran ara..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            padding: '16px 0',
            color: 'var(--text)',
            fontSize: 15,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'var(--red)',
            border: 'none',
            color: 'var(--text)',
            padding: '16px 24px',
            fontSize: 12,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          ARA
        </button>
      </div>
    </form>
  );
}

// Section Header Component
function SectionHeader({ tag, title, linkText, linkHref, router }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 40,
    }}>
      <div>
        <div style={{ 
          fontSize: 10, 
          color: 'var(--red)', 
          letterSpacing: '0.25em', 
          marginBottom: 10 
        }}>
          ✦ {tag}
        </div>
        <h2 style={{ 
          margin: 0, 
          fontSize: 32, 
          fontWeight: 800,
          fontFamily: "'Georgia', serif",
        }}>
          {title}
        </h2>
      </div>
      <div
        onClick={() => router.push(linkHref)}
        style={{
          fontSize: 12,
          color: 'var(--dim)',
          cursor: 'pointer',
          letterSpacing: '0.06em',
        }}
        onMouseEnter={(e) => e.target.style.color = 'var(--red)'}
        onMouseLeave={(e) => e.target.style.color = 'var(--dim)'}
      >
        {linkText} →
      </div>
    </div>
  );
}

// Dish Card Component
function DishCard({ dish, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(232,0,13,0.3)' : 'var(--border)'}`,
        background: hover ? 'var(--card-hover)' : 'var(--card)',
        transition: 'all 0.25s',
      }}
    >
      <div style={{ height: 180, overflow: 'hidden', position: 'relative' }}>
        {dish.image_url ? (
          <img
            src={dish.image_url}
            alt={dish.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hover ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.4s',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'var(--subtle-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
          }}>
            🍽️
          </div>
        )}
        {dish.category && (
          <span style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'var(--red)',
            color: 'var(--text)',
            fontSize: 9,
            padding: '4px 10px',
            letterSpacing: '0.1em',
            borderRadius: 4,
          }}>
            {dish.category.toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ 
          fontSize: 15, 
          fontWeight: 700, 
          color: 'var(--text)',
          fontFamily: "'Georgia', serif",
          marginBottom: 6,
        }}>
          {dish.name}
        </div>
        {dish.cities?.name && (
          <div style={{ 
            fontSize: 11, 
            color: 'var(--red)', 
            letterSpacing: '0.08em' 
          }}>
            📍 {dish.cities.name}
          </div>
        )}
        {dish.short_description && (
          <div style={{
            fontSize: 12,
            color: 'var(--dim)',
            marginTop: 8,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {dish.short_description}
          </div>
        )}
      </div>
    </div>
  );
}

// City Card Component
function CityCard({ city, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        position: 'relative',
        height: 160,
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${hover ? 'rgba(232,0,13,0.3)' : 'var(--border)'}`,
        transition: 'all 0.25s',
      }}
    >
      {city.image_url ? (
        <img
          src={city.image_url}
          alt={city.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: hover ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.4s',
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(232,0,13,0.12), rgba(0,0,0,0.8))',
        }} />
      )}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: hover ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.5)',
        transition: 'background 0.3s',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--text)',
          fontFamily: "'Georgia', serif",
        }}>
          {city.name}
        </div>
        {city.region && (
          <div style={{
            fontSize: 10,
            color: 'var(--red)',
            letterSpacing: '0.1em',
            marginTop: 4,
          }}>
            {city.region.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}

// Restaurant Card Component
function RestaurantCard({ restaurant, onClick }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        gap: 16,
        padding: 16,
        borderRadius: 8,
        background: hover ? 'var(--card-hover)' : 'var(--card)',
        border: `1px solid ${hover ? 'rgba(232,0,13,0.25)' : 'var(--border)'}`,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{
        width: 84,
        height: 84,
        borderRadius: 6,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'var(--subtle-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}>
            🏪
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 4,
        }}>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text)',
            fontFamily: "'Georgia', serif",
          }}>
            {restaurant.name}
          </div>
          {restaurant.is_premium && (
            <span style={{
              fontSize: 8,
              padding: '2px 6px',
              border: '1px solid rgba(251,191,36,0.5)',
              color: '#fbbf24',
              borderRadius: 4,
              flexShrink: 0,
            }}>
              ÖNERİLEN
            </span>
          )}
        </div>
        {restaurant.cities?.name && (
          <div style={{ fontSize: 11, color: 'var(--red)', marginBottom: 4 }}>
            📍 {restaurant.cities.name}
          </div>
        )}
        {restaurant.short_description && (
          <div style={{
            fontSize: 12,
            color: 'var(--dim)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {restaurant.short_description}
          </div>
        )}
      </div>
    </div>
  );
}

// Card Skeleton
function CardSkeleton({ height = 280 }) {
  return (
    <div style={{
      height,
      background: 'var(--card)',
      border: `1px solid ${'var(--border)'}`,
      borderRadius: 8,
      animation: 'pulse 1.5s infinite',
    }} />
  );
}

// Empty State
function EmptyState({ message }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      textAlign: 'center',
      padding: 48,
      color: 'var(--dim)',
    }}>
      {message}
    </div>
  );
}