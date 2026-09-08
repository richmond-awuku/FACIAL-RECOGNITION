# SecureCheck AI — Backend Documentation

This document provides a complete, developer-facing specification for the backend of the SecureCheck AI facial-recognition attendance system. It consolidates schema, access patterns, client expectations, runtime configuration, migration details, realtime channels, and recommended endpoints. Give this file to backend engineers as the authoritative starting point.

--

## Table of contents
- Project summary
- Tech stack
- Runtime environment & env vars
- Database schema (tables, columns, constraints)
- Seed data and migrations
- Authentication & security model
- Access patterns required by the frontend (API contract)
- Realtime / subscription behavior
- Important implementation notes (RLS, service role usage)
- Deployment & CI suggestions
- Developer setup & local run
- File map: key client files (where they call backend)
- Open questions / recommended improvements

--

## Project summary

SecureCheck AI is a Nuxt 3 single-page application that acts as the frontend for a facial-recognition attendance monitoring system. There are two portals:

- Admin portal: manage courses, sessions, review flagged attendance, support tickets, and system settings.
- Student portal: view personal attendance, enrollments, update settings, and submit support tickets.

The frontend previously communicated directly with a Supabase Postgres database using the public anon key. The repository has been migrated so the client calls a backend via a centralized adapter `composables/useApi.ts` which expects REST endpoints under `/api/...`. The legacy `composables/useDatabase.ts` (direct Supabase access) is deprecated; backend engineers should implement the server endpoints described below to match the adapter's expectations and avoid further frontend changes.

## Tech stack

- Frontend: Nuxt 3 (TypeScript), Tailwind CSS
- Client DB layer: Supabase JS v2
- Database: PostgreSQL (Supabase-managed), with Row Level Security policies in migrations
- Authentication: lightweight admin auth via `admins` table (SHA-256 hashed password in seed). Student portal uses matric/student-id lookup.

Refer to [package.json](package.json#L1) for scripts.

## Runtime environment & env vars

- `VITE_SUPABASE_URL` — public Supabase URL
- `VITE_SUPABASE_ANON_KEY` — public Supabase anon key used by the client

These are exposed to the frontend via Nuxt runtime config in [nuxt.config.ts](nuxt.config.ts#L1).

Backend considerations:
- The frontend currently uses the anon key; for privileged tasks the backend should use a Supabase `service_role` key and run server-side operations.
- When implementing a backend, store secrets in environment variables and do not expose service keys to the client.

## Database schema

The canonical schema is defined in the repository's SQL migrations. Below are each table and its columns (types and constraints). For full SQL, see the migration files in `supabase/migrations/`.

- Students (`students`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `student_id` text UNIQUE NOT NULL — human-readable matric number
  - `full_name` text NOT NULL
  - `email` text UNIQUE NOT NULL
  - `department` text NOT NULL DEFAULT 'Computer Science'
  - `enrollment_status` text NOT NULL DEFAULT 'Pending' (Allowed: 'Verified','Pending','Flagged')
  - `face_enrolled` boolean NOT NULL DEFAULT false
  - `last_seen` timestamptz
  - `attendance_rate` numeric DEFAULT 0
  - `face_reference_updated_at` timestamptz (added later)
  - `created_at` timestamptz DEFAULT now()

- Courses (`courses`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `course_code` text UNIQUE NOT NULL
  - `course_name` text NOT NULL
  - `credits` int DEFAULT 3
  - `professor` text NOT NULL
  - `room` text NOT NULL
  - `created_at` timestamptz DEFAULT now()

- Sessions (`sessions`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `session_code` text UNIQUE NOT NULL
  - `course_id` uuid REFERENCES courses(id) ON DELETE CASCADE
  - `room` text NOT NULL DEFAULT 'TBD'
  - `status` text NOT NULL DEFAULT 'scheduled' (Allowed: 'live','completed','scheduled')
  - `total_expected` int DEFAULT 0
  - `total_present` int DEFAULT 0
  - `avg_confidence` numeric DEFAULT 0
  - `started_at` timestamptz
  - `ended_at` timestamptz
  - `created_at` timestamptz DEFAULT now()

- Attendance Records (`attendance_records`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `student_id` uuid REFERENCES students(id) ON DELETE CASCADE
  - `session_id` uuid REFERENCES sessions(id) ON DELETE CASCADE
  - `status` text NOT NULL DEFAULT 'Present' (Allowed: 'Present','Absent','Excused')
  - `confidence_score` numeric
  - `check_in_time` timestamptz DEFAULT now()
  - `created_at` timestamptz DEFAULT now()

- Student-Course Enrollment (`student_courses`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `student_id` uuid REFERENCES students(id) ON DELETE CASCADE
  - `course_id` uuid REFERENCES courses(id) ON DELETE CASCADE
  - `created_at` timestamptz DEFAULT now()

- Admins (`admins`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `email` text UNIQUE NOT NULL
  - `full_name` text NOT NULL
  - `role` text NOT NULL DEFAULT 'admin' (Allowed: 'admin','operator')
  - `password_hash` text NOT NULL (seed uses SHA-256)
  - `created_at` timestamptz DEFAULT now()

- System Settings (`system_settings`)
  - `key` text PRIMARY KEY
  - `value` jsonb NOT NULL
  - `updated_at` timestamptz NOT NULL DEFAULT now()

- Student Settings (`student_settings`)
  - `student_id` uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE
  - `attendance_notifications` boolean NOT NULL DEFAULT true
  - `security_alerts` boolean NOT NULL DEFAULT true
  - `campus_announcements` boolean NOT NULL DEFAULT false
  - `two_factor_enabled` boolean NOT NULL DEFAULT false
  - `updated_at` timestamptz NOT NULL DEFAULT now()

- Support Tickets (`support_tickets`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `student_id` uuid REFERENCES students(id) ON DELETE SET NULL
  - `category` text NOT NULL
  - `reference_id` text NOT NULL DEFAULT ''
  - `description` text NOT NULL
  - `status` text NOT NULL DEFAULT 'Open' (Open, In Review, Resolved, Closed)
  - `created_at` timestamptz NOT NULL DEFAULT now()
  - `updated_at` timestamptz NOT NULL DEFAULT now()

- Session Review Items (`session_review_items`)
  - `id` uuid PRIMARY KEY DEFAULT gen_random_uuid()
  - `session_id` uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE
  - `student_id` uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE
  - `reason` text NOT NULL
  - `confidence_score` numeric
  - `status` text NOT NULL DEFAULT 'Open' (Open, Approved, Dismissed)
  - `created_at` timestamptz NOT NULL DEFAULT now()

Indexes exist for `attendance_records(student_id)`, `attendance_records(session_id)`, `sessions(course_id)`, `student_courses(student_id)`, and `student_courses(course_id)`.

For the exact CREATE TABLE statements and seed data, see the SQL migrations in `supabase/migrations/`.

## Seed data

Migration files include seed entries for courses, a small set of students, an active session `SES-8924` for `CS401`, and some attendance records.

## Authentication & security model

- Current frontend: uses shared anon key to query Supabase tables directly. Admin sign-in is implemented by client-side SHA-256 hashing of a plaintext password and lookup in `admins` table (migration seeds a default admin with SHA-256 hash for "password").
- Student sign-in: frontend looks up a student by `student_id` (matric number) and treats a match as authentication.

Backend recommendations:
- Replace client-side admin password hashing and table-based auth with a proper auth provider (Supabase Auth, or custom server-side auth with bcrypt + salted hash + secure session/token). The current SHA-256 in migration is demo-grade only.
- Use server-side validation for any operation that should be privileged (for example changing settings or creating courses). Use a `service_role` key on the backend for privileged DB operations.
- Keep RLS policies aligned with server implementation. The migrations enable RLS and allow anon+authenticated roles wide access — evaluate tightening policies for production.

## API contract / Endpoints to implement for backend engineers

The frontend now uses the `useApi()` adapter to call server endpoints. Implement the following REST endpoints (recommended names, HTTP methods, expected request/response payloads shown). Backend should validate input and return proper HTTP codes.

Base: `/api/v1`

Students
- GET `/students` — list students
  - Response: 200 OK — JSON array of Student objects (see types in `types/database.ts`)
- GET `/students/:student_id` — lookup by `student_id` (matric number)
  - Response: 200 OK — Student object or 404
- POST `/students` — create a student
  - Body: { student_id, full_name, email, department, enrollment_status?, face_enrolled? }
  - Response: 201 Created — created Student
- PUT `/students/:id` — update a student
  - Body: Partial student fields
  - Response: 200 OK
- DELETE `/students/:id`
  - Response: 204 No Content

Courses
- GET `/courses` — list courses
- GET `/courses/:id` — course detail
- POST `/courses` — create course
- PUT `/courses/:id` — update course
- DELETE `/courses/:id`

Sessions
- GET `/sessions` — list sessions (query param `status=live|completed|scheduled` optional)
- GET `/sessions/active` — convenience route returning sessions with `status=live`
- POST `/sessions` — create/start session
  - Body: { course_id, room, total_expected }
  - Response: 201 Created — created Session
- POST `/sessions/:id/stop` — stop session
  - Response: 200 OK

Attendance
- GET `/sessions/:sessionId/attendance` — all attendance for a session
  - Response: 200 OK — array of attendance records with student info
- GET `/students/:studentDbId/attendance` — attendance history for a student
- POST `/attendance` — record attendance (from biometric scanner)
  - Body: { student_id, session_id, status: 'Present'|'Absent'|'Excused', confidence_score }
  - Response: 201 Created

Student Courses / Enrollments
- GET `/students/:studentDbId/courses`
- POST `/students/:studentDbId/courses` — enroll in course (or admin enroll)

Settings
- GET `/settings/:key` — retrieve system setting
- POST `/settings/:key` — upsert system setting (admin only)
- GET `/students/:studentDbId/settings`
- POST `/students/:studentDbId/settings`

Support tickets
- GET `/support_tickets` (optional query `student_id`)
- POST `/support_tickets` — create ticket
- PUT `/support_tickets/:id` — update ticket

Session review items
- GET `/sessions/:sessionId/review_items`
- POST `/sessions/:sessionId/review_items` — create item
- PUT `/review_items/:id` — update item status

Auth endpoints (if backend implements auth)
- POST `/auth/admin/login` — { email, password } → returns session token or cookie
- POST `/auth/admin/signup` — (admin-only route to create admin)
- POST `/auth/student/login` — { student_id } → returns session token or cookie if desired

Notes on payload shapes: Align responses to the TypeScript types in `types/database.ts` (Student, Course, Session, AttendanceRecord, etc.). See [types/database.ts](types/database.ts#L1) for canonical type definitions.

## Realtime & subscriptions

The frontend uses Supabase realtime channels to subscribe to attendance inserts for a session.

- Channel name convention used in client code: `attendance:{sessionId}`
- Event: Postgres `INSERT` on `attendance_records` filtered to `session_id=eq.{sessionId}`

Backend alternative:
- Implement a WebSocket endpoint that emits the same payload the frontend expects when a new attendance record is created. Event format should include the new attendance record and optionally joined student info.

## Implementation details derived from client code

- The frontend uses `useDatabase()` in `composables/useDatabase.ts` to call Supabase directly. The backend should provide identical behavior and data shapes to avoid frontend changes.
- `subscribeToSessionAttendance(sessionId)` expects realtime inserts for attendance_records filtered by `session_id`.
- The frontend relies on `getActiveSessions()` to query sessions with `status = 'live'` and also expects the `courses` relation to be returned (join `courses` table).

## Row Level Security (RLS) and policies

The migrations enable RLS for all tables and create policies that grant `anon` and `authenticated` broad CRUD access. For production, the backend team should:

- Review and tighten RLS policies so only authorized roles can perform sensitive operations.
- Use JWT claims and `auth.uid()` where appropriate to scope actions to specific users.
- Use a server-side `service_role` key for privileged migrations, maintenance, or analytics queries.

## Migration files

All migrations are located in `supabase/migrations/`.

- Create schema & seed: [20260827151552_create_attendance_system_schema.sql](supabase/migrations/20260827151552_create_attendance_system_schema.sql#L1)
- Admins table: [20260829125515_create_admins_table.sql](supabase/migrations/20260829125515_create_admins_table.sql#L1)
- Settings, support, reviews: [20260901183736_add_settings_support_session_features.sql](supabase/migrations/20260901183736_add_settings_support_session_features.sql#L1)
- Student face reference timestamp: [20260901183836_add_student_face_reference_timestamp.sql](supabase/migrations/20260901183836_add_student_face_reference_updated_at.sql#L1)

Backend must apply these migrations in order.

## Recommended backend tasks (priority list)

1. Implement secure admin authentication (replace current SHA-256 table lookup with Supabase Auth or server-side bcrypt + sessions).
2. Provide a server-side REST API that mirrors the `useApi()` adapter calls and enforces additional validation.
3. Store and rotate Supabase `service_role` key on the server; do not expose to the client.
4. Harden RLS rules for production; limit `anon` access.
5. Add request validation and rate-limiting for attendance ingest endpoints.
6. Implement audit logging for critical actions (session start/stop, attendance injection, settings changes).

## Deployment & CI suggestions

- Build steps (from repository root):

```bash
npm ci
npm run build
```

- Environment variables to set in production host:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - (If backend uses service key) `SUPABASE_SERVICE_ROLE_KEY`

- Recommend: run migrations during deployment with a controlled job using the service key.

## Developer setup & local run

1. Install dependencies

```bash
npm ci
```

2. Provide Supabase credentials in your environment (for local dev you can use a local Supabase or the project Supabase instance)

```bash
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key"
```

3. Run dev server

```bash
npm run dev
```

4. To apply migrations locally, use your preferred Supabase CLI or psql with the SQL files in `supabase/migrations/`.

## File map (where frontend expects certain backend behaviors)

- `composables/useApi.ts` — primary frontend adapter for backend REST endpoints; implement server routes to match these calls. See [composables/useApi.ts](composables/useApi.ts#L1).
- `composables/usePortal.ts` — admin/student login flow; now calls `useApi()` for auth and user operations. See [composables/usePortal.ts](composables/usePortal.ts#L1).
- `composables/useDatabase.ts` — (deprecated) legacy Supabase helper retained for reference. Do not rely on this for new integrations.
- `types/database.ts` — canonical TypeScript types used in the frontend; responses from the backend should match these shapes. See [types/database.ts](types/database.ts#L1).
- `utils/supabase.ts` — shows the client library and runtime config expectations for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. See [utils/supabase.ts](utils/supabase.ts#L1).

## Open questions & recommended improvements

- Authentication: should the team migrate to Supabase Auth or implement a secure backend auth? Recommended: Supabase Auth for institutions.
- Privacy & compliance: facial biometric data must comply with local laws — clarify retention, consent, and opt-out procedures. Migrations include `face_enrolled` and `face_reference_updated_at` but not raw images; ensure biometric templates are stored securely and consider encryption/limited access.
- RLS: production must tighten policies and eliminate reliance on the anon key for privileged actions.

## Contact & ownership

If you need clarifications about the frontend expectations, inspect the composables and components in the repository. The quickest references are:

- `composables/useDatabase.ts` — exact queries the frontend makes.
- `types/database.ts` — canonical types.

--

Generated from repository files and migrations at time of export. If you want, I can also:

- Extract and generate a Postman collection for the REST endpoints described above.
- Add OpenAPI (Swagger) spec for the backend endpoints.
- Create sample server templates (Express / Fastify / Nest / Next API) implementing the minimal endpoints.

If you want any of these, tell me which and I'll produce it next.
