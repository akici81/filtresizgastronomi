-- =============================================
-- FİLTRESİZ GASTRONOMİ — SUPABASE KURULUM SQL
-- Supabase Dashboard > SQL Editor'a yapıştır
-- =============================================

-- 1. KULLANICILAR (admin/editör rolleri)
create table kullanicilar (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  ad text,
  rol text check (rol in ('admin', 'editor', 'uye')) default 'uye',
  fotograf_url text,
  olusturma_tarihi timestamp with time zone default now()
);

-- 2. ŞEHİRLER
create table sehirler (
  id serial primary key,
  slug text unique not null,
  ad text not null,
  aciklama text,
  tarihce text,
  fotograf_url text,
  kapat_etiketi text,
  aktif boolean default true,
  olusturan uuid references kullanicilar(id),
  olusturma_tarihi timestamp with time zone default now(),
  guncelleme_tarihi timestamp with time zone default now()
);

-- 3. YEMEKLER
create table yemekler (
  id serial primary key,
  slug text unique not null,
  ad text not null,
  sehir_id integer references sehirler(id) on delete set null,
  tag text,
  aciklama text,
  tarihce text,
  malzemeler text,
  yapilis text,
  fotograf_url text,
  aktif boolean default true,
  olusturan uuid references kullanicilar(id),
  olusturma_tarihi timestamp with time zone default now(),
  guncelleme_tarihi timestamp with time zone default now()
);

-- 4. RESTORANLAR
create table restoranlar (
  id serial primary key,
  ad text not null,
  slug text unique not null,
  sehir_id integer references sehirler(id) on delete set null,
  adres text,
  telefon text,
  website text,
  aciklama text,
  fotograf_url text,
  premium boolean default false,
  premium_bitis_tarihi timestamp with time zone,
  aktif boolean default true,
  olusturan uuid references kullanicilar(id),
  olusturma_tarihi timestamp with time zone default now(),
  guncelleme_tarihi timestamp with time zone default now()
);

-- 5. ŞEFLER
create table sefler (
  id serial primary key,
  ad text not null,
  slug text unique not null,
  sehir_id integer references sehirler(id) on delete set null,
  unvan text,
  bio text,
  fotograf_url text,
  instagram text,
  aktif boolean default true,
  olusturan uuid references kullanicilar(id),
  olusturma_tarihi timestamp with time zone default now()
);

-- 6. GALERİ (şehir/yemek fotoğrafları)
create table galeri (
  id serial primary key,
  fotograf_url text not null,
  baslik text,
  sehir_id integer references sehirler(id) on delete cascade,
  yemek_id integer references yemekler(id) on delete cascade,
  restoran_id integer references restoranlar(id) on delete cascade,
  yukleyen uuid references kullanicilar(id),
  olusturma_tarihi timestamp with time zone default now()
);

-- 7. YORUMLAR / DEĞERLENDİRMELER
create table degerlendirmeler (
  id serial primary key,
  kullanici_id uuid references kullanicilar(id) on delete cascade,
  restoran_id integer references restoranlar(id) on delete cascade,
  yemek_id integer references yemekler(id) on delete cascade,
  puan integer check (puan between 1 and 5),
  yorum text,
  olusturma_tarihi timestamp with time zone default now()
);

-- =============================================
-- ÖRNEK VERİ — Gaziantep
-- =============================================
insert into sehirler (slug, ad, aciklama, tarihce, kapat_etiketi) values
('gaziantep', 'Gaziantep', 'Türkiye''nin gastronomi başkenti. UNESCO Yaratıcı Şehirler ağı üyesi.', 'Gaziantep mutfağı, binlerce yıllık Mezopotamya ve Anadolu mutfak kültürünün mirasçısıdır. Baklava, lahmacun ve beyran gibi ikonlaşmış lezzetlerin anavatanıdır.', 'UNESCO Gastronomi Şehri'),
('erzurum', 'Erzurum', 'Doğu Anadolu''nun eşsiz mutfak kültürü.', 'Erzurum mutfağı, sert kış koşullarına adapte olmuş besleyici ve doyurucu yemekleriyle öne çıkar. Cağ kebabı dünyaya buradan yayılmıştır.', 'Cağ Kebabının Anavatanı'),
('hatay', 'Hatay', 'Akdeniz, Arap ve Anadolu mutfaklarının buluşma noktası.', 'Hatay mutfağı, tarih boyunca pek çok medeniyetin izlerini taşır. Künefe, humus ve zeytinyağlı mezeler bu coğrafyanın armağanıdır.', 'Lezzetlerin Kavşağı');

insert into yemekler (slug, ad, sehir_id, tag, aciklama) values
('cag-kebabi', 'Cağ Kebabı', 2, 'Et', 'Yatay şişte döndürülen, dilim dilim kesilen Erzurum''un simge kebabı.'),
('yuvalama', 'Yuvalama', 2, 'Çorba', 'Küçük hamur toplarıyla yapılan, yoğurtlu geleneksel Erzurum çorbası.'),
('beyran', 'Beyran', 1, 'Çorba', 'Kuzu eti ve pirinçle yapılan, sabahın erken saatlerinde içilen Gaziantep çorbası.'),
('baklava', 'Baklava', 1, 'Tatlı', 'İnce yufka, fıstık ve şerbetten oluşan dünyanın en ünlü tatlısı.'),
('kunefe', 'Künefe', 3, 'Tatlı', 'Tel kadayıf ve peynirden yapılan, sıcak servis edilen Hatay tatlısı.');

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Herkes okuyabilir
alter table sehirler enable row level security;
alter table yemekler enable row level security;
alter table restoranlar enable row level security;
alter table sefler enable row level security;
alter table galeri enable row level security;
alter table degerlendirmeler enable row level security;
alter table kullanicilar enable row level security;

-- Okuma: herkes
create policy "Herkes okuyabilir" on sehirler for select using (true);
create policy "Herkes okuyabilir" on yemekler for select using (true);
create policy "Herkes okuyabilir" on restoranlar for select using (true);
create policy "Herkes okuyabilir" on sefler for select using (true);
create policy "Herkes okuyabilir" on galeri for select using (true);
create policy "Herkes okuyabilir" on degerlendirmeler for select using (true);

-- Yazma: sadece admin ve editör
create policy "Admin/Editor yazabilir" on sehirler for insert
  with check (auth.uid() in (select id from kullanicilar where rol in ('admin','editor')));
create policy "Admin/Editor yazabilir" on yemekler for insert
  with check (auth.uid() in (select id from kullanicilar where rol in ('admin','editor')));
create policy "Admin/Editor yazabilir" on restoranlar for insert
  with check (auth.uid() in (select id from kullanicilar where rol in ('admin','editor')));
create policy "Admin/Editor yazabilir" on sefler for insert
  with check (auth.uid() in (select id from kullanicilar where rol in ('admin','editor')));

-- Güncelleme: sadece admin
create policy "Sadece admin guncelleyebilir" on sehirler for update
  using (auth.uid() in (select id from kullanicilar where rol = 'admin'));
create policy "Sadece admin guncelleyebilir" on yemekler for update
  using (auth.uid() in (select id from kullanicilar where rol = 'admin'));

-- Kullanıcı kendi profilini okuyabilir
create policy "Kendi profilini okuyabilir" on kullanicilar for select
  using (auth.uid() = id);
create policy "Kendi profilini güncelleyebilir" on kullanicilar for update
  using (auth.uid() = id);

-- Yeni kullanıcı kaydında otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.kullanicilar (id, email, ad)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
