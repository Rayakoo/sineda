-- =====================================================
-- SINEDA — Unsolved Case Feature
-- Run this after 001_schema.sql, 002_course_flow.sql, 003_siswa_intervensi.sql
-- =====================================================

-- 1. UNSOLVED CASES (main case, linked to courses)
CREATE TABLE IF NOT EXISTS unsolved_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id BIGINT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  peraturan JSONB NOT NULL DEFAULT '[]'::jsonb,
  instruksi JSONB NOT NULL DEFAULT '[]'::jsonb,
  jawaban JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id)
);

-- 2. USER DETECTIVES (public players, no auth required)
CREATE TABLE IF NOT EXISTS user_detectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unsolved_case_id UUID NOT NULL REFERENCES unsolved_cases(id) ON DELETE CASCADE,
  detective_name TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. UNSOLVED CASE HINTS
CREATE TABLE IF NOT EXISTS unsolved_case_hints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unsolved_case_id UUID NOT NULL REFERENCES unsolved_cases(id) ON DELETE CASCADE,
  urutan INTEGER NOT NULL DEFAULT 0,
  tipe TEXT NOT NULL CHECK (tipe IN ('chat', 'karakter', 'buku', 'kartu', 'lainnya')),
  konten JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE unsolved_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_detectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE unsolved_case_hints ENABLE ROW LEVEL SECURITY;

-- Unsolved cases: public read published, admin all
CREATE POLICY "Public read unsolved_cases" ON unsolved_cases FOR SELECT USING (true);
CREATE POLICY "Admin write unsolved_cases" ON unsolved_cases FOR ALL USING (is_admin() OR is_admin_profiles());

-- User detectives: public insert (no auth), public read, admin manage
CREATE POLICY "Public insert user_detectives" ON user_detectives FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read user_detectives" ON user_detectives FOR SELECT USING (true);
CREATE POLICY "Admin manage user_detectives" ON user_detectives FOR ALL USING (is_admin() OR is_admin_profiles());

-- Unsolved case hints: public read, admin write
CREATE POLICY "Public read unsolved_case_hints" ON unsolved_case_hints FOR SELECT USING (true);
CREATE POLICY "Admin write unsolved_case_hints" ON unsolved_case_hints FOR ALL USING (is_admin() OR is_admin_profiles());
