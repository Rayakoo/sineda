ALTER TABLE user_quiz_results ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;
ALTER TABLE user_courses ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER DEFAULT 0;
