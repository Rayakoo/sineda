-- =====================================================
-- SINEDA Complete Course Flow Schema
-- =====================================================

-- 1. CATEGORIES (untuk filter peran: Guru, Siswa, Orang Tua)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- 2. EDUCATION LEVELS
CREATE TABLE IF NOT EXISTS education_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);

-- 3. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  education_level_id UUID NOT NULL REFERENCES education_levels(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  jumlah_isi INTEGER NOT NULL DEFAULT 0,
  course_type TEXT NOT NULL DEFAULT 'self_paced' CHECK (course_type IN ('self_paced','interactive','unsolved_case')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. COURSE VIDEOS
CREATE TABLE IF NOT EXISTS course_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. COURSE MATERIALS (Modul)
CREATE TABLE IF NOT EXISTS course_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  urutan INTEGER NOT NULL DEFAULT 0,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. QUIZZES
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  urutan INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. QUIZ QUESTIONS
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

-- 8. USER COURSES (enrollment + progress)
CREATE TABLE IF NOT EXISTS user_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  current_urutan INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- 9. USER QUIZ RESULTS
CREATE TABLE IF NOT EXISTS user_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. COURSE MINIGAMES
CREATE TABLE IF NOT EXISTS course_minigames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('tts','find_the_word','true_or_false','drawing','fill_the_blank','match_pairs')),
  urutan INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. MINIGAME: TTS (Crossword)
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

-- 12. MINIGAME: Find Word
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

-- 13. MINIGAME: True/False
CREATE TABLE IF NOT EXISTS minigame_true_false (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. MINIGAME: Drawing
CREATE TABLE IF NOT EXISTS minigame_drawing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minigame_id UUID NOT NULL REFERENCES course_minigames(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  base_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. MINIGAME: Fill the Blank
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

-- 16. MINIGAME: Match Pairs
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

-- 17. PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
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

-- =====================================================
-- SEED DATA
-- =====================================================
INSERT INTO categories (name, slug) VALUES
  ('Guru', 'guru'),
  ('Siswa', 'siswa'),
  ('Orang Tua', 'orangtua')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO education_levels (name, slug) VALUES
  ('SD', 'sd'),
  ('SMP', 'smp'),
  ('SMA', 'sma')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- RLS POLICIES
-- =====================================================
-- Helper: is_admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Enable RLS on all tables
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['categories','education_levels','courses','course_videos','course_materials','quizzes','quiz_questions','user_courses','user_quiz_results','course_minigames','minigame_tts','minigame_find_word','minigame_true_false','minigame_drawing','minigame_fill_blank','minigame_match_pairs','minigame_match_pair_items','profiles'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- Public read for reference tables
CREATE POLICY "Public read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public read education_levels" ON education_levels FOR SELECT USING (true);
CREATE POLICY "Public read published courses" ON courses FOR SELECT USING (is_published = true OR is_admin());
CREATE POLICY "Admin write courses" ON courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin update courses" ON courses FOR UPDATE USING (is_admin());
CREATE POLICY "Admin delete courses" ON courses FOR DELETE USING (is_admin());

-- Course sections: anyone can read published course content, admin can write
CREATE POLICY "Read course_videos" ON course_videos FOR SELECT USING (true);
CREATE POLICY "Admin write course_videos" ON course_videos FOR ALL USING (is_admin());
CREATE POLICY "Read course_materials" ON course_materials FOR SELECT USING (true);
CREATE POLICY "Admin write course_materials" ON course_materials FOR ALL USING (is_admin());
CREATE POLICY "Read quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Admin write quizzes" ON quizzes FOR ALL USING (is_admin());
CREATE POLICY "Read quiz_questions" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Admin write quiz_questions" ON quiz_questions FOR ALL USING (is_admin());
CREATE POLICY "Read course_minigames" ON course_minigames FOR SELECT USING (true);
CREATE POLICY "Admin write course_minigames" ON course_minigames FOR ALL USING (is_admin());
CREATE POLICY "Read minigame_tts" ON minigame_tts FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_tts" ON minigame_tts FOR ALL USING (is_admin());
CREATE POLICY "Read minigame_find_word" ON minigame_find_word FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_find_word" ON minigame_find_word FOR ALL USING (is_admin());
CREATE POLICY "Read minigame_true_false" ON minigame_true_false FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_true_false" ON minigame_true_false FOR ALL USING (is_admin());
CREATE POLICY "Read minigame_drawing" ON minigame_drawing FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_drawing" ON minigame_drawing FOR ALL USING (is_admin());
CREATE POLICY "Read minigame_fill_blank" ON minigame_fill_blank FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_fill_blank" ON minigame_fill_blank FOR ALL USING (is_admin());
CREATE POLICY "Read minigame_match_pairs" ON minigame_match_pairs FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_match_pairs" ON minigame_match_pairs FOR ALL USING (is_admin());
CREATE POLICY "Read minigame_match_pair_items" ON minigame_match_pair_items FOR SELECT USING (true);
CREATE POLICY "Admin write minigame_match_pair_items" ON minigame_match_pair_items FOR ALL USING (is_admin());

-- User-specific tables: users manage own data
CREATE POLICY "Users read own user_courses" ON user_courses FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users insert own user_courses" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own user_courses" ON user_courses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users read own quiz_results" ON user_quiz_results FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Users insert own quiz_results" ON user_quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own quiz_results" ON user_quiz_results FOR UPDATE USING (auth.uid() = user_id);

-- Profiles: users read own, admin read all
CREATE POLICY "Read own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Admin update profiles" ON profiles FOR UPDATE USING (is_admin());
