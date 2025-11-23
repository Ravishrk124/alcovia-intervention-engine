-- Alcovia Intervention Engine - Database Schema
-- Run this in Supabase SQL Editor

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- active, needs_intervention, remedial
  created_at TIMESTAMP DEFAULT NOW()
);

-- Daily logs table (tracks student check-ins)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  quiz_score INTEGER NOT NULL CHECK (quiz_score >= 0 AND quiz_score <= 10),
  focus_minutes INTEGER NOT NULL CHECK (focus_minutes >= 0),
  success BOOLEAN NOT NULL,
  tab_switched BOOLEAN DEFAULT FALSE,
  logged_at TIMESTAMP DEFAULT NOW()
);

-- Interventions table (tracks mentor interventions)
CREATE TABLE IF NOT EXISTS interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  quiz_score INTEGER,
  focus_minutes INTEGER,
  assigned_task TEXT,
  assigned_by VARCHAR(255),
  assigned_at TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_student ON daily_logs(student_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_student ON interventions(student_id, completed);

-- Insert demo student (Ravish Kumar)
INSERT INTO students (name, email, status) 
VALUES ('Ravish Kumar', 'ravishrk0407@gmail.com', 'active')
ON CONFLICT (email) DO NOTHING;

-- Function to auto-unlock stale interventions (fail-safe mechanism)
CREATE OR REPLACE FUNCTION auto_unlock_stale_interventions()
RETURNS void AS $$
BEGIN
  -- Update students stuck in needs_intervention for > 12 hours
  UPDATE students s
  SET status = 'remedial'
  FROM interventions i
  WHERE s.id = i.student_id
    AND s.status = 'needs_intervention'
    AND i.assigned_task IS NULL
    AND i.created_at < NOW() - INTERVAL '12 hours';
    
  -- Auto-assign generic task to stale interventions
  UPDATE interventions
  SET assigned_task = 'Review previous week materials and retake the quiz. Contact your mentor if you have questions.',
      assigned_by = 'AUTO-SYSTEM',
      assigned_at = NOW()
  WHERE assigned_task IS NULL
    AND created_at < NOW() - INTERVAL '12 hours';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to run this function hourly (requires pg_cron extension)
-- SELECT cron.schedule('auto-unlock-check', '0 * * * *', 'SELECT auto_unlock_stale_interventions();');
