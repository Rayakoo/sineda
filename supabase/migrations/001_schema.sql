-- =====================================================
-- SINEDA Database Schema for Supabase
-- =====================================================

-- 1. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('siswa', 'guru', 'orangtua')),
  level TEXT DEFAULT 'Pemula' CHECK (level IN ('Pemula', 'Menengah', 'Lanjutan', 'Semua Level')),
  lessons INTEGER DEFAULT 0,
  duration TEXT DEFAULT '',
  image TEXT DEFAULT '',
  color TEXT DEFAULT 'bg-blue-600',
  icon TEXT DEFAULT 'fa-book',
  is_published BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SESSIONS TABLE (konten halaman per sesi)
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  hero_title TEXT DEFAULT '',
  hero_description TEXT DEFAULT '',
  modules JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ADMIN PROFILES (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO sessions (key, title, subtitle, hero_title, hero_description, modules)
VALUES
  ('home', 'Beranda', 'Selamat Datang di SINEDA 2026',
   'Mewujudkan Sekolah Tanpa Kekerasan Seksual & Bullying',
   'Culturally Responsive MOOC berbasis Self-paced Learning untuk SMP Negeri 2 Singosari dan Sekolah Menengah Nasional.',
   '[{"title":"Portal Guru","desc":"Workshop & Sertifikasi Strategi Penanganan Kekerasan.","icon":"chalkboard-teacher","color":"blue"},{"title":"Portal Siswa","desc":"Mainkan Games & Selesaikan Misi Pahlawan Sekolah.","icon":"user-graduate","color":"green"},{"title":"Portal Orang Tua","desc":"Edukasi & Panduan Perlindungan Anak di Rumah.","icon":"users","color":"orange"}]'),
  ('guru', 'Workshop Guru Profesional', '"Selesaikan 3 Misi Pelatihan untuk Klaim Sertifikat Pendidik SINEDA"', '', '',
   '[{"title":"Modul: Strategi Kelas Aman","desc":"Materi teknis identifikasi kekerasan seksual di lingkungan sekolah.","icon":"book-open","color":"bg-blue-600","type":"modul"},{"title":"Workshop: Sinkronisasi Budaya Malang","desc":"Integrasi nilai Topeng Malangan dalam edukasi anti-bullying.","icon":"users","color":"bg-blue-800","type":"workshop","badge":"LIVE WORKSHOP"},{"title":"Sertifikat Guru","desc":"Misi belum lengkap (0/3)","icon":"award","color":"bg-blue-200","type":"sertifikat"}]'),
  ('siswa', 'Zona Misi Siswa', '', '', '',
   '[{"title":"Modul: Kenali Batasan","desc":"Belajar menjaga diri dengan cara seru.","icon":"graduation-cap","color":"green"},{"title":"Flash Cards Edukasi","desc":"\"Sentuhan boleh, sentuhan tidak boleh!\"","icon":"images","color":"green"},{"title":"Sertifikat Pahlawan Belum Tersedia","desc":"","icon":"certificate","color":"gray","disabled":true}]'),
  ('orangtua', 'Portal Wali Murid', '', '', '',
   '[{"title":"Modul: Perlindungan dari Rumah","desc":"Cara mendeteksi perubahan perilaku anak dan pola asuh yang aman.","icon":"home","color":"orange"},{"title":"Sertifikat Orang Tua Tangguh","desc":"Diberikan setelah menyelesaikan modul pendampingan.","icon":"award","color":"orange"}]')
ON CONFLICT (key) DO NOTHING;

INSERT INTO courses (title, slug, description, category, level, lessons, duration, icon, color, is_published, sort_order)
VALUES
  ('Pengenalan Anti-Bullying', 'pengenalan-anti-bullying', 'Memahami apa itu bullying, jenis-jenisnya, dan cara menghadapinya di lingkungan sekolah.', 'siswa', 'Pemula', 6, '2 Jam', 'fa-shield-halved', 'bg-green-500', true, 1),
  ('Strategi Kelas Aman', 'strategi-kelas-aman', 'Teknik identifikasi dan penanganan kekerasan seksual di lingkungan sekolah.', 'guru', 'Lanjutan', 8, '4 Jam', 'fa-chalkboard-user', 'bg-blue-600', true, 2),
  ('Perlindungan dari Rumah', 'perlindungan-dari-rumah', 'Panduan bagi orang tua untuk mendeteksi perubahan perilaku anak dan pola asuh aman.', 'orangtua', 'Pemula', 5, '1.5 Jam', 'fa-house-chimney', 'bg-orange-600', true, 3),
  ('Game: Unsolved Case', 'unsolved-case', 'Misi investigasi interaktif mengungkap kasus sekolah. Kumpulkan XP dan raih sertifikat!', 'siswa', 'Semua Level', 10, '3 Jam', 'fa-gamepad', 'bg-purple-600', true, 4),
  ('Sinkronisasi Budaya Malang', 'sinkronisasi-budaya-malang', 'Integrasi nilai Topeng Malangan dalam edukasi anti-bullying dan kekerasan.', 'guru', 'Menengah', 4, '2 Jam', 'fa-mask', 'bg-red-600', true, 5),
  ('Flash Cards Edukasi', 'flash-cards-edukasi', 'Kartu interaktif: sentuhan boleh, sentuhan tidak boleh! Belajar dengan cara menyenangkan.', 'siswa', 'Pemula', 3, '30 Menit', 'fa-cards-blank', 'bg-teal-500', true, 6),
  ('Pola Asuh Protektif', 'pola-asuh-protektif', 'Membangun komunikasi terbuka dengan anak dan menciptakan lingkungan rumah yang aman.', 'orangtua', 'Menengah', 7, '3 Jam', 'fa-hand-holding-heart', 'bg-pink-600', true, 7),
  ('Sertifikasi Pendidik SINEDA', 'sertifikasi-pendidik-sibima', 'Program sertifikasi lengkap bagi pendidik. Selesaikan 3 misi untuk klaim sertifikat.', 'guru', 'Lanjutan', 12, '6 Jam', 'fa-certificate', 'bg-amber-600', true, 8)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access for published courses & active sessions
CREATE POLICY "Public read courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Public read sessions" ON sessions FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin all courses" ON courses FOR ALL USING (
  auth.uid() IN (SELECT id FROM admin_profiles)
);
CREATE POLICY "Admin all sessions" ON sessions FOR ALL USING (
  auth.uid() IN (SELECT id FROM admin_profiles)
);
CREATE POLICY "Admin read own profile" ON admin_profiles FOR SELECT USING (
  auth.uid() = id
);
