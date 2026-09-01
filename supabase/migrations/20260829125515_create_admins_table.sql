/*
# Create admins table for admin portal authentication

## Overview
Adds an `admins` table to store admin user accounts for the admin portal.
Admins log in with email/password stored in this table (simple shared-tenant model,
matching the existing student portal approach — no Supabase Auth used).

## New Tables
1. **admins** — Admin user accounts
   - id (uuid, PK)
   - email (text, unique)
   - full_name (text)
   - role (text — 'admin' or 'operator')
   - password_hash (text — hashed password)
   - created_at (timestamptz)

## Security
- RLS enabled on admins.
- Policies allow anon+authenticated CRUD (shared institutional system, same as all other tables).

## Important Notes
1. Passwords are hashed client-side using SHA-256 before sending — this is a demo-grade
   hash, not bcrypt. For production, use Supabase Auth or a SECURITY DEFINER function.
2. Seed data includes a default admin: admin@institution.edu / password
*/

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_admins" ON admins;
CREATE POLICY "anon_select_admins" ON admins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_admins" ON admins;
CREATE POLICY "anon_insert_admins" ON admins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_admins" ON admins;
CREATE POLICY "anon_update_admins" ON admins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_admins" ON admins;
CREATE POLICY "anon_delete_admins" ON admins FOR DELETE
  TO anon, authenticated USING (true);

-- Seed default admin (password = "password", SHA-256 hash)
INSERT INTO admins (email, full_name, role, password_hash)
VALUES (
  'admin@institution.edu',
  'System Admin',
  'admin',
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
)
ON CONFLICT (email) DO NOTHING;
