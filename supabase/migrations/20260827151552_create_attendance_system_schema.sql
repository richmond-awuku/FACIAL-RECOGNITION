/*
# Create Facial Recognition Attendance System Schema

## Overview
Creates the complete database schema for a facial recognition attendance monitoring system.
The system has two portals: Admin (manages sessions, students, analytics) and Student (views own attendance, schedule).

## New Tables

1. **students** — Stores student enrollment data and facial recognition status
   - id (uuid, PK)
   - student_id (text, unique — human-readable ID like "STU-8829-XR")
   - full_name (text)
   - email (text, unique)
   - department (text)
   - enrollment_status (text — 'Verified', 'Pending', 'Flagged')
   - face_enrolled (boolean, default false)
   - last_seen (timestamptz)
   - attendance_rate (numeric, default 0)
   - created_at (timestamptz)

2. **courses** — Stores course catalog
   - id (uuid, PK)
   - course_code (text, unique — e.g. "CS401")
   - course_name (text)
   - credits (int, default 3)
   - professor (text)
   - room (text)
   - created_at (timestamptz)

3. **sessions** — Attendance scanning sessions (a class meeting)
   - id (uuid, PK)
   - session_code (text, unique — e.g. "SES-8924")
   - course_id (uuid, FK → courses)
   - room (text)
   - status (text — 'live', 'completed', 'scheduled')
   - total_expected (int, default 0)
   - total_present (int, default 0)
   - avg_confidence (numeric, default 0)
   - started_at (timestamptz)
   - ended_at (timestamptz)
   - created_at (timestamptz)

4. **attendance_records** — Individual check-in records from facial recognition
   - id (uuid, PK)
   - student_id (uuid, FK → students)
   - session_id (uuid, FK → sessions)
   - status (text — 'Present', 'Absent', 'Excused')
   - confidence_score (numeric — 0-100, null if absent/excused)
   - check_in_time (timestamptz)
   - created_at (timestamptz)

5. **student_courses** — Many-to-many enrollment mapping
   - id (uuid, PK)
   - student_id (uuid, FK → students)
   - course_id (uuid, FK → courses)
   - created_at (timestamptz)

## Security
- RLS enabled on all tables.
- Policies allow anon+authenticated CRUD on all tables since this is a shared institutional system
  (the admin and student portals both use the anon key client).
- No user_id/auth.uid() scoping — all portal users share the same institutional data.

## Important Notes
1. All tables use gen_random_uuid() for primary keys.
2. Foreign keys have ON DELETE CASCADE to maintain referential integrity.
3. Attendance records link students to sessions with confidence scores.
4. The sessions table tracks live scanning state (status = 'live').
5. Student_courses enables course enrollment and schedule generation.
6. Seed data is included for demo purposes.
*/

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  department text NOT NULL DEFAULT 'Computer Science',
  enrollment_status text NOT NULL DEFAULT 'Pending',
  face_enrolled boolean NOT NULL DEFAULT false,
  last_seen timestamptz,
  attendance_rate numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_students" ON students;
CREATE POLICY "anon_select_students" ON students FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_students" ON students;
CREATE POLICY "anon_insert_students" ON students FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_students" ON students;
CREATE POLICY "anon_update_students" ON students FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_students" ON students;
CREATE POLICY "anon_delete_students" ON students FOR DELETE
  TO anon, authenticated USING (true);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text UNIQUE NOT NULL,
  course_name text NOT NULL,
  credits int DEFAULT 3,
  professor text NOT NULL,
  room text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE
  TO anon, authenticated USING (true);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_code text UNIQUE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  room text NOT NULL DEFAULT 'TBD',
  status text NOT NULL DEFAULT 'scheduled',
  total_expected int DEFAULT 0,
  total_present int DEFAULT 0,
  avg_confidence numeric DEFAULT 0,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE
  TO anon, authenticated USING (true);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Present',
  confidence_score numeric,
  check_in_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attendance" ON attendance_records;
CREATE POLICY "anon_select_attendance" ON attendance_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance_records;
CREATE POLICY "anon_insert_attendance" ON attendance_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_attendance" ON attendance_records;
CREATE POLICY "anon_update_attendance" ON attendance_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance_records;
CREATE POLICY "anon_delete_attendance" ON attendance_records FOR DELETE
  TO anon, authenticated USING (true);

-- Student-course enrollment table
CREATE TABLE IF NOT EXISTS student_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_student_courses" ON student_courses;
CREATE POLICY "anon_select_student_courses" ON student_courses FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_student_courses" ON student_courses;
CREATE POLICY "anon_insert_student_courses" ON student_courses FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_student_courses" ON student_courses;
CREATE POLICY "anon_delete_student_courses" ON student_courses FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_course ON sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_student ON student_courses(student_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course ON student_courses(course_id);

-- Seed data: Courses
INSERT INTO courses (course_code, course_name, credits, professor, room) VALUES
  ('CS401', 'Advanced Algorithms', 4, 'Prof. Alan Turing', 'Rm 404, Tech Bldg'),
  ('ENG205', 'Technical Communication', 3, 'Prof. Emily Bronte', 'Rm 210, Arts Bldg'),
  ('MAT310', 'Linear Algebra', 4, 'Prof. John Nash', 'Rm 101, Science Bldg'),
  ('PHY204', 'Quantum Mechanics', 3, 'Prof. Richard Feynman', 'Rm 101, Science Bldg'),
  ('CS301', 'Algorithms', 4, 'Prof. Alan Turing', 'Rm 404, Tech Bldg')
ON CONFLICT (course_code) DO NOTHING;

-- Seed data: Students
INSERT INTO students (student_id, full_name, email, department, enrollment_status, face_enrolled, last_seen, attendance_rate) VALUES
  ('STU-8829-XR', 'Elena Rodriguez', 'elena.r@university.edu', 'Computer Science', 'Verified', true, '2026-08-27 08:14:32+00', 94.2),
  ('STU-4412-BM', 'Marcus Chen', 'marcus.c@university.edu', 'Mechanical Engineering', 'Pending', false, '2026-08-26 14:22:05+00', 78.5),
  ('STU-9901-LQ', 'Sarah Jenkins', 'sarah.j@university.edu', 'Data Science', 'Verified', true, '2026-08-27 09:45:11+00', 91.0),
  ('STU-1123-PZ', 'David O''Connor', 'david.o@university.edu', 'Cybersecurity', 'Flagged', true, '2026-08-27 07:12:44+00', 65.3),
  ('STU-5567-KW', 'Aisha Patel', 'aisha.p@university.edu', 'Architecture', 'Verified', true, '2026-08-27 10:05:59+00', 88.7),
  ('STU-8943-AI', 'Alex Rivera', 'alex.rivera@university.edu', 'Computer Science', 'Verified', true, '2026-08-27 10:58:00+00', 92.0)
ON CONFLICT (student_id) DO NOTHING;

-- Seed data: Active session
INSERT INTO sessions (session_code, course_id, room, status, total_expected, total_present, avg_confidence, started_at)
  SELECT 'SES-8924', c.id, 'Turing Theater', 'live', 150, 142, 94.6, now()
  FROM courses c WHERE c.course_code = 'CS401'
ON CONFLICT (session_code) DO NOTHING;

-- Seed data: Attendance records for the active session
INSERT INTO attendance_records (student_id, session_id, status, confidence_score, check_in_time)
  SELECT s.id, sess.id, 'Present', 98.4, now() - interval '2 minutes'
  FROM students s, sessions sess
  WHERE s.student_id = 'STU-8829-XR' AND sess.session_code = 'SES-8924'
ON CONFLICT DO NOTHING;

INSERT INTO attendance_records (student_id, session_id, status, confidence_score, check_in_time)
  SELECT s.id, sess.id, 'Present', 95.1, now() - interval '4 minutes'
  FROM students s, sessions sess
  WHERE s.student_id = 'STU-9901-LQ' AND sess.session_code = 'SES-8924'
ON CONFLICT DO NOTHING;

INSERT INTO attendance_records (student_id, session_id, status, confidence_score, check_in_time)
  SELECT s.id, sess.id, 'Present', 99.8, now() - interval '6 minutes'
  FROM students s, sessions sess
  WHERE s.student_id = 'STU-5567-KW' AND sess.session_code = 'SES-8924'
ON CONFLICT DO NOTHING;

-- Seed data: Student-course enrollments
INSERT INTO student_courses (student_id, course_id)
  SELECT s.id, c.id FROM students s, courses c
  WHERE s.student_id = 'STU-8943-AI' AND c.course_code = 'CS401'
ON CONFLICT DO NOTHING;

INSERT INTO student_courses (student_id, course_id)
  SELECT s.id, c.id FROM students s, courses c
  WHERE s.student_id = 'STU-8943-AI' AND c.course_code = 'PHY204'
ON CONFLICT DO NOTHING;

INSERT INTO student_courses (student_id, course_id)
  SELECT s.id, c.id FROM students s, courses c
  WHERE s.student_id = 'STU-8943-AI' AND c.course_code = 'ENG205'
ON CONFLICT DO NOTHING;

INSERT INTO student_courses (student_id, course_id)
  SELECT s.id, c.id FROM students s, courses c
  WHERE s.student_id = 'STU-8943-AI' AND c.course_code = 'MAT310'
ON CONFLICT DO NOTHING;