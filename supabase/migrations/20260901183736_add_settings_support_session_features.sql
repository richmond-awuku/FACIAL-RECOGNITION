/*
# Add persistent settings, support tickets, and session review records

## Overview
Adds the durable records required by the supplied admin and student screens.
Settings are stored in the database instead of being held only in the browser,
support requests become trackable tickets, and session review items preserve
low-confidence or manually flagged attendance cases.

## New Tables
1. `system_settings`
   - `key` (text, primary key) — stable institution setting name.
   - `value` (jsonb) — setting value, allowing booleans, numbers, and text.
   - `updated_at` (timestamptz) — last save time.
2. `student_settings`
   - `student_id` (uuid, primary key, references students) — student owner.
   - `attendance_notifications` (boolean) — attendance confirmation preference.
   - `security_alerts` (boolean) — security notification preference.
   - `campus_announcements` (boolean) — announcement preference.
   - `two_factor_enabled` (boolean) — student security preference.
   - `updated_at` (timestamptz).
3. `support_tickets`
   - `id` (uuid, primary key).
   - `student_id` (uuid, nullable foreign key) — submitting student when applicable.
   - `category` (text) — support issue category.
   - `reference_id` (text) — related session or module identifier.
   - `description` (text) — submitted explanation.
   - `status` (text) — Open, In Review, Resolved, or Closed.
   - `created_at` and `updated_at` (timestamptz).
4. `session_review_items`
   - `id` (uuid, primary key).
   - `session_id` and `student_id` (uuid foreign keys).
   - `reason` (text) — low match, occluded camera, or other review reason.
   - `confidence_score` (numeric, nullable).
   - `status` (text) — Open, Approved, or Dismissed.
   - `created_at` (timestamptz).

## Security
- RLS is enabled on every new table.
- The current product is a shared institutional portal using the anon client,
  so each table has separate anon+authenticated SELECT, INSERT, UPDATE, and
  DELETE policies matching the existing shared tables.

## Important Notes
1. Existing attendance and session data is not changed or deleted.
2. Default settings are inserted only when their keys do not already exist.
3. Session summaries can be calculated from existing sessions and attendance
   records while review items preserve exceptional cases for later action.
*/

CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_system_settings" ON system_settings;
CREATE POLICY "anon_select_system_settings" ON system_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_system_settings" ON system_settings;
CREATE POLICY "anon_insert_system_settings" ON system_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_system_settings" ON system_settings;
CREATE POLICY "anon_update_system_settings" ON system_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_system_settings" ON system_settings;
CREATE POLICY "anon_delete_system_settings" ON system_settings FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS student_settings (
  student_id uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  attendance_notifications boolean NOT NULL DEFAULT true,
  security_alerts boolean NOT NULL DEFAULT true,
  campus_announcements boolean NOT NULL DEFAULT false,
  two_factor_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE student_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_student_settings" ON student_settings;
CREATE POLICY "anon_select_student_settings" ON student_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_student_settings" ON student_settings;
CREATE POLICY "anon_insert_student_settings" ON student_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_student_settings" ON student_settings;
CREATE POLICY "anon_update_student_settings" ON student_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_student_settings" ON student_settings;
CREATE POLICY "anon_delete_student_settings" ON student_settings FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  category text NOT NULL,
  reference_id text NOT NULL DEFAULT '',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_support_tickets" ON support_tickets;
CREATE POLICY "anon_select_support_tickets" ON support_tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_support_tickets" ON support_tickets;
CREATE POLICY "anon_insert_support_tickets" ON support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_support_tickets" ON support_tickets;
CREATE POLICY "anon_update_support_tickets" ON support_tickets FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_support_tickets" ON support_tickets;
CREATE POLICY "anon_delete_support_tickets" ON support_tickets FOR DELETE TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS session_review_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  reason text NOT NULL,
  confidence_score numeric,
  status text NOT NULL DEFAULT 'Open',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE session_review_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_session_review_items" ON session_review_items;
CREATE POLICY "anon_select_session_review_items" ON session_review_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_session_review_items" ON session_review_items;
CREATE POLICY "anon_insert_session_review_items" ON session_review_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_session_review_items" ON session_review_items;
CREATE POLICY "anon_update_session_review_items" ON session_review_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_session_review_items" ON session_review_items;
CREATE POLICY "anon_delete_session_review_items" ON session_review_items FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_support_tickets_student ON support_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_session_review_items_session ON session_review_items(session_id);
CREATE INDEX IF NOT EXISTS idx_session_review_items_status ON session_review_items(status);

INSERT INTO system_settings (key, value) VALUES
  ('admin_profile', '{"full_name":"System Admin","department":"Institutional Operations","admin_id":"ADM-001"}'::jsonb),
  ('admin_notifications', '{"session_starts":true,"system_health":true,"at_risk_summaries":true,"real_time_intervention":false}'::jsonb),
  ('biometric_settings', '{"confidence_threshold":85,"anti_spoofing_sensitivity":"Standard","auto_schedule_enabled":false,"archival_days":90,"telemetry_sharing":false}'::jsonb),
  ('node_settings', '{"nodes":[]}'::jsonb)
ON CONFLICT (key) DO NOTHING;
