-- =====================================================
-- SINEDA — FULL SCHEMA DATABASE
-- Copy & paste seluruh file ini ke Supabase SQL Editor
-- =====================================================

-- Hapus fungsi & tabel lama (jika ada dari migrasi sebelumnya)
DROP FUNCTION IF EXISTS verify_siswa_password CASCADE;
DROP FUNCTION IF EXISTS is_admin CASCADE;
DROP FUNCTION IF EXISTS is_admin_profiles CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP TABLE IF EXISTS minigame_match_pair_items CASCADE;
DROP TABLE IF EXISTS minigame_match_pairs CASCADE;
DROP TABLE IF EXISTS minigame_fill_blank CASCADE;
DROP TABLE IF EXISTS minigame_drawing CASCADE;
DROP TABLE IF EXISTS minigame_true_false CASCADE;
DROP TABLE IF EXISTS minigame_find_word CASCADE;
DROP TABLE IF EXISTS minigame_tts CASCADE;
DROP TABLE IF EXISTS course_minigames CASCADE;
DROP TABLE IF EXISTS user_quiz_results CASCADE;
DROP TABLE IF EXISTS user_courses CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS course_materials CASCADE;
DROP TABLE IF EXISTS course_videos CASCADE;
DROP TABLE IF EXISTS siswa_intervensi CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS education_levels CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS admin_profiles CASCADE;

DROP TABLE IF EXISTS courses CASCADE;

-- 1. COURSES
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

-- 2. ADMIN PROFILES
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORIES (Guru / Siswa / Orang Tua)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- 5. EDUCATION LEVELS
CREATE TABLE IF NOT EXISTS education_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- 6. COURSE VIDEOS
CREATE TABLE IF NOT EXISTS course_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. COURSE MATERIALS
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. QUIZ QUESTIONS
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. USER COURSES (enrollment + progress)
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  current_urutan INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 11. USER QUIZ RESULTS
CREATE TABLE IF NOT EXISTS user_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. COURSE MINIGAMES
CREATE TABLE IF NOT EXISTS course_minigames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tts','find_the_word','true_or_false','drawing','fill_the_blank','match_pairs')),
  urutan INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. MINIGAME: TTS
CREATE TABLE IF NOT EXISTS minigame_tts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('across','down')),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. MINIGAME: Find Word
CREATE TABLE IF NOT EXISTS minigame_find_word (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  grid_width INTEGER NOT NULL DEFAULT 10,
  grid_height INTEGER NOT NULL DEFAULT 10,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. MINIGAME: True/False
CREATE TABLE IF NOT EXISTS minigame_true_false (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. MINIGAME: Drawing
CREATE TABLE IF NOT EXISTS minigame_drawing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  base_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. MINIGAME: Fill the Blank
CREATE TABLE IF NOT EXISTS minigame_fill_blank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  image_url TEXT,
  question TEXT NOT NULL,
  answer_count INTEGER NOT NULL DEFAULT 1,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. MINIGAME: Match Pairs
CREATE TABLE IF NOT EXISTS minigame_match_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  pair_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS minigame_match_pair_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_pairs_id UUID NOT NULL REFERENCES minigame_match_pairs(id) ON DELETE CASCADE,
  pair_code TEXT NOT NULL,
  image_url TEXT,
  card_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 19. PROFILES (linked to auth.users, auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 20. SISWA INTERVENSI (custom auth via name + kode password)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS siswa_intervensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kode_password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify siswa_intervensi password (RPC)
CREATE OR REPLACE FUNCTION verify_siswa_password(p_name TEXT, p_kode TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE stored_hash TEXT;
BEGIN
  SELECT kode_password_hash INTO stored_hash FROM siswa_intervensi WHERE name = p_name;
  IF stored_hash IS NULL THEN RETURN FALSE; END IF;
  RETURN crypt(p_kode, stored_hash) = stored_hash;
END;
$$;

-- Helper: is_admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;
-- Also check admin_profiles (legacy)
CREATE OR REPLACE FUNCTION public.is_admin_profiles()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_profiles WHERE id = auth.uid());
$$;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
DO $$ DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'courses','admin_profiles','categories','education_levels',
    'course_videos','course_materials','quizzes','quiz_questions',
    'user_courses','user_quiz_results','course_minigames',
    'minigame_tts','minigame_find_word','minigame_true_false',
    'minigame_drawing','minigame_fill_blank','minigame_match_pairs',
    'minigame_match_pair_items','profiles','siswa_intervensi'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- COURSES
CREATE POLICY "Public read published courses" ON courses FOR SELECT USING (is_published = true OR is_admin() OR is_admin_profiles());
CREATE POLICY "Admin all courses" ON courses FOR ALL USING (is_admin() OR is_admin_profiles());

-- ADMIN PROFILES
CREATE POLICY "Admin read own profile" ON admin_profiles FOR SELECT USING (auth.uid() = id);

-- CATEGORIES & EDUCATION LEVELS (public read)
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read education_levels" ON education_levels FOR SELECT USING (true);

-- COURSE VIDEOS / MATERIALS / QUIZZES / MINIGAMES (public read, admin write)
CREATE POLICY "Read course_videos" ON course_videos FOR SELECT USING (true);
CREATE POLICY "Admin write course_videos" ON course_videos FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read course_materials" ON course_materials FOR SELECT USING (true);
CREATE POLICY "Admin write course_materials" ON course_materials FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Admin write quizzes" ON quizzes FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read quiz_questions" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admin write quiz_questions" ON quiz_questions FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read course_minigames" ON course_minigames FOR SELECT USING (true);
CREATE POLICY "Admin write course_minigames" ON course_minigames FOR ALL USING (is_admin() OR is_admin_profiles());

-- MINIGAME SUB-TABLES
CREATE POLICY "Read minigame_tts" ON minigame_tts FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_tts" ON minigame_tts FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read minigame_find_word" ON minigame_find_word FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_find_word" ON minigame_find_word FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read minigame_true_false" ON minigame_true_false FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_true_false" ON minigame_true_false FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read minigame_drawing" ON minigame_drawing FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_drawing" ON minigame_drawing FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read minigame_fill_blank" ON minigame_fill_blank FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_fill_blank" ON minigame_fill_blank FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read minigame_match_pairs" ON minigame_match_pairs FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_match_pairs" ON minigame_match_pairs FOR ALL USING (is_admin() OR is_admin_profiles());
CREATE POLICY "Read minigame_match_pair_items" ON minigame_match_pair_items FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_match_pair_items" ON minigame_match_pair_items FOR ALL USING (is_admin() OR is_admin_profiles());

-- USER COURSES (user manages own, admin reads all)
CREATE POLICY "Users read own user_courses" ON user_courses FOR SELECT USING (auth.uid() = user_id OR is_admin() OR is_admin_profiles());
CREATE POLICY "Users insert own user_courses" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own user_courses" ON user_courses FOR UPDATE USING (auth.uid() = user_id);

-- USER QUIZ RESULTS
CREATE POLICY "Users read own quiz_results" ON user_quiz_results FOR SELECT USING (auth.uid() = user_id OR is_admin() OR is_admin_profiles());
CREATE POLICY "Users insert own quiz_results" ON user_quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own quiz_results" ON user_quiz_results FOR UPDATE USING (auth.uid() = user_id);

-- PROFILES
CREATE POLICY "Read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin() OR is_admin_profiles());
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (is_admin() OR is_admin_profiles());

-- SISWA INTERVENSI
CREATE POLICY "Public read siswa_intervensi" ON siswa_intervensi FOR SELECT USING (true);
CREATE POLICY "Admin insert siswa_intervensi" ON siswa_intervensi FOR INSERT WITH CHECK (is_admin_profiles());
CREATE POLICY "Admin update siswa_intervensi" ON siswa_intervensi FOR UPDATE USING (is_admin_profiles());
CREATE POLICY "Admin delete siswa_intervensi" ON siswa_intervensi FOR DELETE USING (is_admin_profiles());

-- =====================================================
-- SEED DATA
-- =====================================================

-- Courses
INSERT INTO courses (title, slug, description, category, level, lessons, duration, icon, color, is_published, sort_order)
VALUES
  ('Pengenalan Anti-Bullying', 'pengenalan-anti-bullying', 'Memahami apa itu bullying, jenis-jenisnya, dan cara menghadapinya di lingkungan sekolah.', 'siswa', 'Pemula', 6, '2 Jam', 'fa-shield-halved', 'bg-green-500', true, 1),
  ('Strategi Kelas Aman', 'strategi-kelas-aman', 'Teknik identifikasi dan penanganan kekerasan seksual di lingkungan sekolah.', 'guru', 'Lanjutan', 8, '4 Jam', 'fa-chalkboard-user', 'bg-blue-600', true, 2),
  ('Perlindungan dari Rumah', 'perlindungan-dari-rumah', 'Panduan bagi orang tua untuk mendeteksi perubahan perilaku anak dan pola asuh aman.', 'orangtua', 'Pemula', 5, '1.5 Jam', 'fa-house-chimney', 'bg-orange-600', true, 3),
  ('Game: Unsolved Case', 'unsolved-case', 'Misi investigasi interaktif mengungkap kasus sekolah. Kumpulkan XP dan raih sertifikat!', 'siswa', 'Semua Level', 10, '3 Jam', 'fa-gamepad', 'bg-purple-600', true, 4),
  ('Sinkronisasi Budaya Malang', 'sinkronisasi-budaya-malang', 'Integrasi nilai Topeng Malangan dalam edukasi anti-bullying dan kekerasan.', 'guru', 'Menengah', 4, '2 Jam', 'fa-mask', 'bg-red-600', true, 5),
  ('Flash Cards Edukasi', 'flash-cards-edukasi', 'Kartu interaktif: sentuhan boleh, sentuhan tidak boleh! Belajar dengan cara menyenangkan.', 'siswa', 'Pemula', 3, '30 Menit', 'fa-cards-blank', 'bg-teal-500', true, 6),
  ('Pola Asuh Protektif', 'pola-asuh-protektif', 'Membangun komunikasi terbuka dengan anak dan menciptakan lingkungan rumah yang aman.', 'orangtua', 'Menengah', 7, '3 Jam', 'fa-hand-holding-heart', 'bg-pink-600', true, 7),
  ('Sertifikasi Pendidik SINEDA', 'sertifikasi-pendidik-sineda', 'Program sertifikasi lengkap bagi pendidik. Selesaikan 3 misi untuk klaim sertifikat.', 'guru', 'Lanjutan', 12, '6 Jam', 'fa-certificate', 'bg-amber-600', true, 8)
ON CONFLICT (slug) DO NOTHING;

-- Categories
INSERT INTO categories (name, slug) VALUES
  ('Guru', 'guru'),
  ('Siswa', 'siswa'),
  ('Orang Tua', 'orangtua')
ON CONFLICT (slug) DO NOTHING;

-- Education Levels
INSERT INTO education_levels (name, slug) VALUES
  ('SD', 'sd'),
  ('SMP', 'smp'),
  ('SMA', 'sma')
ON CONFLICT (slug) DO NOTHING;

-- Siswa Intervensi (login: name + kode_password)
INSERT INTO siswa_intervensi (name, kode_password_hash) VALUES
  ('Ahmad Fauzi', crypt('sin123', gen_salt('bf'))),
  ('Siti Nurhaliza', crypt('sin456', gen_salt('bf'))),
  ('Budi Santoso', crypt('sin789', gen_salt('bf'))),
  ('Dewi Lestari', crypt('sin000', gen_salt('bf'))),
  ('Rudi Hartono', crypt('sin111', gen_salt('bf')));
