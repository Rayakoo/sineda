-- =====================================================
-- SISWA INTERVENSI (custom auth: login via name + NIS)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS siswa_intervensi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nis TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE siswa_intervensi ENABLE ROW LEVEL SECURITY;

-- Allow public read for login validation (anon key can call)
CREATE POLICY "Public read siswa_intervensi" ON siswa_intervensi FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admin insert siswa_intervensi" ON siswa_intervensi FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM admin_profiles)
);
CREATE POLICY "Admin update siswa_intervensi" ON siswa_intervensi FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM admin_profiles)
);
CREATE POLICY "Admin delete siswa_intervensi" ON siswa_intervensi FOR DELETE USING (
  auth.uid() IN (SELECT id FROM admin_profiles)
);

-- RPC function to verify siswa password
CREATE OR REPLACE FUNCTION verify_siswa_password(p_name TEXT, p_nis TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash FROM siswa_intervensi WHERE name = p_name;
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN crypt(p_nis, stored_hash) = stored_hash;
END;
$$;

-- Seed data (password = NIS, hashed with bcrypt)
INSERT INTO siswa_intervensi (name, nis, password_hash) VALUES
  ('Ahmad Fauzi', '1234567890', crypt('1234567890', gen_salt('bf'))),
  ('Siti Nurhaliza', '1234567891', crypt('1234567891', gen_salt('bf'))),
  ('Budi Santoso', '1234567892', crypt('1234567892', gen_salt('bf'))),
  ('Dewi Lestari', '1234567893', crypt('1234567893', gen_salt('bf'))),
  ('Rudi Hartono', '1234567894', crypt('1234567894', gen_salt('bf')))
ON CONFLICT (nis) DO NOTHING;
