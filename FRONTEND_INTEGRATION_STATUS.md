# Frontend Integration Status — for the Backend Team

**Date:** 2026-09-09
**Frontend repo:** `FACIAL-RECOGNITION` (Nuxt 3)
**Backend contract this targets:** the Django "Frontend API Integration Guide" (JWT / DRF / SimpleJWT)

This document tells the backend team **exactly what the frontend now calls**, what request bodies it
sends, what response shapes it needs, and **which endpoints/behaviors are still missing or mismatched**
so you can close the gap.

---

## 0. Status — 2026-09-07 (round 2)

Backend shipped the updated `FRONTEND_API_INTEGRATION.md`. The frontend adapter has been updated to
match. Resolved on the frontend side:

- **Support base path** → all calls now use `/api/support/requests/…` (list/`mine`/create/`mark-in-review`/`resolve`/`close`).
- **`request_type`** → only `OVERRIDE` (when a session is attached) or `ISSUE`; the invalid `GENERAL` is gone.
- **`category`** → free-text UI labels are mapped to the backend enum on write
  (`ATTENDANCE_DISPUTE`/`TECHNICAL_ISSUE`/`ACCOUNT_ACCESS`/`BIOMETRIC_REENROLLMENT`/`OTHER`) and mapped back to labels on read.
- **Student login** → `StudentLogin.vue` now collects **Student ID + password** and calls the shared `POST /api/auth/login/`. No `/api/auth/student/login/` dependency.
- **Login identifier field** → `api.login(identifier, password, { as })` now sends `{ email, password }` for the admin portal (the form collects an email) and `{ username, password }` for the student portal (a matric number). Backend accepts either field as of 2026-09-08.
- **Admin sign-up** → `POST /api/auth/users/` payload includes `email` (required for email login) and duplicate-email `400`s surface inline via the standard DRF field-error path.
- **Forced first-login password reset** — after *every* login (and on session restore) the app reads `must_change_password` from `GET /api/auth/me/`. When true it shows a dedicated `ForcePasswordChange.vue` screen and nothing else — no portal, no API calls that would `403`. The screen submits `POST /api/auth/change-password/` with the just-used temp password as `old_password` (pre-filled from memory; a "current password" field appears instead when the page was reloaded and the temp password is no longer held), then re-hydrates the session. `usePortal` exposes `mustChangePassword`, `needsCurrentPassword`, `completePasswordChange()`.
- **Student create → auto-provisioned login** — the roster's Add Student form already collects `email`; `POST /api/students/` with no `user` lets the backend create the login + email the temp password. The success toast now branches on **`login_provisioned`** (id collision → no login made) and **`credentials_email_sent`** (no email on file).
- **`POST /api/auth/users/` no longer takes `password`** — the admin "Sign up" flow (`usePortal.adminSignUp`) drops the password from the payload, no longer auto-logs-in (there's no password to use), and returns a "check your email for a temporary password" message; the password field is hidden in the login screen's sign-up mode. `email` is required; duplicate-email `400` surfaces inline.
- **Password show/hide** — new `PasswordInput.vue` (input + eye toggle) replaces every raw `type="password"` field: both login screens, the forced-reset screen, and both settings change-password forms.
- **Refresh rotation** → the adapter now persists the **new `refresh`** returned by `/api/auth/token/refresh/`.
- **Review items** → removed the client `createSessionReviewItem` (backend has no create route by design).
- **Ticket status** → adapter now handles `OPEN/IN_REVIEW/APPROVED/REJECTED/CLOSED`.
- Session live counts (`roster_size`/`present_count`/`average_confidence`) and per-record `course_code`/`course_name` now flow through the normalizers into the existing UI with no template changes.

Round 2 also wired every remaining frontend-only gap the backend flagged as "not a backend
problem":

- **Student self-enroll capture UI** — `StudentSettings.vue` branches on `face_enrolled`: a
  **PENDING** student gets a camera modal that captures a 6-frame burst (with a "blink now" prompt
  for liveness) → `POST /api/students/me/enroll/` via `api.enrollMyFace()`, then refreshes the
  profile (now shows Verified, per backend confirmation). A **VERIFIED** student's button files a
  `BIOMETRIC_REENROLLMENT` support request instead. All five error codes (400/401/403/404/422)
  mapped to specific in-modal messages.
- **Admin "Verify student"** — the roster's Verify action now opens a single-frame staff-capture
  modal → `POST /api/students/:id/enroll/` via `api.enrollStudentFace()` (no liveness; staff
  supervised), then reloads the roster. `422`/`400` mapped.
- **Change password** — real `current` + `new` password fields wired to
  `POST /api/auth/change-password/` in both `StudentSettings.vue` and `AdminSettings.vue`; DRF
  field errors (`old_password` / `new_password`) surfaced inline.
- Shared `composables/useCamera.ts` (getUserMedia + frame grab) backs both capture flows.
- `usePortal` gained `refreshCurrentStudent()`.
- **Course management** — new admin **Courses** screen (`AdminCourses.vue`, nav entry between
  Sessions and Roster): create/delete a course, enrol/unenrol students (PATCH `students` id list),
  and add/remove weekly `schedule-slots`. Adapter gained `createCourse` / `updateCourse` /
  `deleteCourse` / `setCourseStudents` / `getScheduleSlots` / `createScheduleSlot` /
  `deleteScheduleSlot`. **Open question for backend:** is `lecturer` required on `POST
  /api/classes/courses/`? The form treats it as optional (a user-id text field); confirm or tell us
  the expected default.

Genuinely still open (blocked on backend or optional):

- **Realtime** — no SSE/WebSocket channel exists (`/events/` 404s), so `subscribeToSessionAttendance`
  now **polls `GET /api/attendance/sessions/:id/summary/` every 5s**, diffs `recent_checkins` /
  `present_count`, and fires the same `{ new, summary }` callback the live session view already
  consumed. Works with no UI change. If the backend later ships a push channel, only this one
  adapter function needs to swap back.
- **Dashboard / analytics response shapes** — the dashboard and trend APIs are now called, but the
  backend still needs to document exact fields/definitions so missing metrics are not guessed.
- **Sessions scan** — the client now captures a camera frame and calls `scan-classroom`; the
  response should include the matched student and confidence, or make the created record immediately
  available through the session-records endpoint.

## 0.1 Status — 2026-09-09 (dynamic-data audit)

The admin, lecturer, and student screens were checked for fabricated records and actions. Audit logs
and schedules now use their API endpoints, report downloads export current API-backed records, and
classroom scans submit a captured JPEG frame to the backend. Roster pagination and CSV export now
operate on the fetched roster. Dashboard labels no longer claim a system is online or show a made-up
week-over-week change. Analytics show check-in counts rather than deriving an attendance percentage
from a list of check-in records. Camera-node settings are explicitly described as saved
configuration, not live hardware health.

Remaining backend/API work needed for complete dynamic behavior:

1. **Persisted report jobs/history** — add report generation/history endpoints if reports need to
   appear as saved jobs, have status, or be re-downloaded. Current CSVs are generated client-side
   from attendance records, users, courses, and audit logs.
2. **Dashboard metric contract** — document exact fields and definitions for
   `GET /api/dashboard/overview/` and `GET /api/analytics/trends/`, including daily attendance
   denominator, uptime, and health components. Unprovided values remain unavailable in the UI.
3. **Live device management/health** — `node_settings` is generic saved configuration, not camera
   node CRUD or telemetry. Provide node list/create/update/delete and health/last-seen endpoints
   before the UI can report actual online/degraded/offline status.
4. **Notification inbox** — no notification list, unread-count, or mark-read endpoint is exposed.
   Global search and help/contact actions likewise have no API contract; the nonfunctional top-bar
   controls were removed rather than implying that they work.
5. **Schedule response contract** — `GET /api/classes/my-schedule/?week_start=...` should return each
   assigned slot with course code/name, `day_of_week` (1=Monday through 7=Sunday), `start_time`,
   `end_time`, and `room`. The student schedule renders only returned slots.
6. **Roster pagination** — the roster currently paginates the fetched result in the browser. Add DRF
   pagination and accept `search`, `department`, and page parameters if the result size requires
   server-side pagination.
7. **Profile-photo upload** — no profile-photo upload/read endpoint is exposed by the current
   frontend adapter. Provide authenticated upload and profile-read fields for admin, lecturer, and
   student accounts if photos must persist across devices.
8. **Manual attendance status** — `POST /api/attendance/sessions/:id/manual/` currently accepts only
   `{student}` and the backend determines the result. The UI now matches that behavior. Add an
   explicit permission-checked status/override contract if staff need to mark absent or excused.
9. **Student security and privacy actions** — the current API has no two-factor enrollment/status
   flow or personal-data export request endpoint. Those controls now explain the limitation instead
   of toggling local state or showing a fake "queued" success. Student notification preferences can
   be saved, but notification delivery/inbox behavior still needs backend support.

The scan sends multipart `image` to
`POST /api/attendance/sessions/:id/scan-classroom/`. For deterministic immediate feedback, return
the matched student and confidence in the response (or guarantee the created record is immediately
available from the session-records endpoint). The browser uses native camera APIs and Canvas to
capture the frame; no facial-recognition frontend library is needed while recognition runs on the
backend. A student only views the slots assigned to their enrolled courses; staff create those
weekly slots through the course-management UI.

---

## 1. What changed on the frontend

- All direct Supabase access (`composables/useDatabase.ts`) is **removed from components**. It is left
  in the tree only as dead reference and should be considered deprecated.
- Every component now talks to a single adapter: **`composables/useApi.ts`** → `useApi()`.
- `composables/usePortal.ts` (login/session state) now calls `useApi()` for auth.
- Base URL comes from `runtimeConfig.public.backendUrl` (env `VITE_BACKEND_URL`, default
  `http://localhost:8000`). Set this in every environment.

### Auth/token behavior the frontend implements

| Concern | Behavior |
|---|---|
| Token storage | `access` + `refresh` in `localStorage` |
| Auth header | `Authorization: Bearer <access>` on every call |
| Session restore | on page load a `.client` plugin calls `GET /api/auth/me/` with the stored token and rehydrates the portal (role → admin/student), so a refresh no longer logs the user out; app renders a "Restoring session…" splash until this resolves |
| 401 handling | calls `POST /api/auth/token/refresh/` once, retries the request |
| Refresh failure | clears both tokens, throws `401` |
| Logout | `POST /api/auth/logout/` with `{refresh}`; tolerates `205 Reset Content` |
| Errors | reads `{"detail": "..."}`, else first message of `{"field": ["..."]}` |

### The frontend has a normalization layer — you do NOT need to rename fields

`useApi.ts` maps your DRF-native shapes to the legacy shapes the templates expect. Keep returning your
current shapes. Specifically it already handles:

| Backend (DRF) | Frontend expects | Handled by adapter |
|---|---|---|
| `first_name` + `last_name` | `full_name` | ✅ |
| course `code` / `name` | `course_code` / `course_name` | ✅ |
| session `status` `SCHEDULED`/`ACTIVE`/`ENDED` | `scheduled`/`live`/`completed` | ✅ |
| student `enrollment_status` `PENDING`/`VERIFIED`/`FLAGGED` | `Pending`/`Verified`/`Flagged` | ✅ |
| ticket `status` `OPEN`/`IN_REVIEW`/`RESOLVED`/`CLOSED` | `Open`/`In Review`/`Resolved`/`Closed` | ✅ |
| review `status` `OPEN`/`APPROVED`/`DISMISSED` | `Open`/`Approved`/`Dismissed` | ✅ |
| attendance `timestamp` | `check_in_time` | ✅ |
| student `is_enrolled` | `face_enrolled` | ✅ |
| flat `course_code`/`course_name` on a session | nested `session.courses` | ✅ |
| list responses OR `{results: [...]}` pagination | array | ✅ |

---

## 2. Endpoints the frontend calls (implement / confirm these)

Paths are exact. "Sends" = request body the frontend transmits. All JSON unless noted multipart.

### Auth

| Method | Path | Sends | Notes |
|---|---|---|---|
| POST | `/api/auth/login/` | `{username, password}` | expects `{access, refresh}` |
| POST | `/api/auth/token/refresh/` | `{refresh}` | expects `{access}` |
| POST | `/api/auth/logout/` | `{refresh}` | `205` OK |
| GET | `/api/auth/me/` | — | `{id, username, email, first_name, last_name, role}` |
| POST | `/api/auth/users/` | `{username, email, first_name, last_name, role}` | admin only; backend provisions a temporary password |
| GET | `/api/auth/users/?search=&role=&is_active=` | — | admin user management; backend accepts search, role and active-state filters |
| POST | `/api/auth/change-password/` | `{old_password, new_password}` | wired in adapter, not yet surfaced in UI |
| POST | `/api/auth/student/login/` | `{student_id}` | **DOES NOT EXIST — see Gap #1** |

### Students

| Method | Path | Sends | Notes |
|---|---|---|---|
| GET | `/api/students/` | — | admin/lecturer list |
| GET | `/api/students/?search=<matric>` | — | used to resolve a student by matric number |
| GET | `/api/students/me/` | — | student self-profile |
| POST | `/api/students/` | `{student_id, first_name, last_name, email, department, user?, guardian_phone?, guardian_email?}` | frontend splits a full-name field into first/last |
| PATCH | `/api/students/:id/` | `{first_name?, last_name?, email?, department?, guardian_phone?, guardian_email?, is_active?}` | `enrollment_status` / `face_enrolled` are **never** sent here (treated as backend-managed) |
| DELETE | `/api/students/:id/` | — | `204` |
| POST | `/api/students/:id/flag/` | — | frontend calls this when an admin "flags" |
| POST | `/api/students/:id/unflag/` | — | exposed in adapter |
| POST | `/api/students/:id/enroll/` | multipart `image`, `retain_image?` | **admin/lecturer only today — see Gap #7** |

### Courses & schedule

| Method | Path | Sends | Notes |
|---|---|---|---|
| GET | `/api/classes/courses/?search=&department=&semester=` | — | admin class-management list supports backend search/filter; role-scoped for student "my courses" — **see Gap #5** |
| GET | `/api/classes/courses/:id/` | — | course detail |
| POST | `/api/classes/courses/` | `{code, name, credits, lecturer?, students?}` | admin **Courses** screen — create course |
| PATCH | `/api/classes/courses/:id/` | `{code?, name?, credits?, lecturer?, department?, semester?, students?}` | edit course; `students` is the full id list (enrol/unenrol by replacing it) |
| Course fields | — | `department`, `semester` | included on create/update and returned by the course serializer |
| DELETE | `/api/classes/courses/:id/` | — | delete course |
| GET | `/api/classes/courses/:id/students/?search=<term>` | — | lecturer/admin course roster lookup; excludes students already in course |
| POST | `/api/classes/courses/:id/students/` | `{student_ids: [<id>, ...]}` | add students to a course without replacing existing enrolments |
| GET | `/api/classes/schedule-slots/` | — | listed then filtered client-side by `course` |
| POST | `/api/classes/schedule-slots/` | `{course, day_of_week, start_time, end_time, room}` | add a weekly slot; `day_of_week` sent as 1–7 (Mon–Sun) |
| DELETE | `/api/classes/schedule-slots/:id/` | — | remove a slot |
| GET | `/api/classes/sessions/` | — | frontend fetches all, filters client-side by status |
| POST | `/api/classes/sessions/` | `{course, room, scheduled_date}` | **missing `schedule_slot` — see Gap #3** |
| POST | `/api/classes/sessions/:id/start/` | — | called right after create |
| POST | `/api/classes/sessions/:id/stop/` | — | |
| POST | `/api/classes/schedule/generate/` | `{date?}` | adapter helper `generateSessions()` |
| GET | `/api/classes/my-schedule/?week_start=<YYYY-MM-DD>` | — | also the fallback source for student courses |

### Attendance

| Method | Path | Sends | Notes |
|---|---|---|---|
| GET | `/api/attendance/records/?session=:id` | — | per-session attendance |
| GET | `/api/attendance/records/` | — | admin analytics feed |
| GET | `/api/attendance/my-records/` | — | student attendance history — **see Gap #8** |
| POST | `/api/attendance/sessions/:id/manual/` | `{student}` | manual mark; status/confidence not sent |
| GET | `/api/attendance/sessions/:id/summary/` | — | frontend also calls this wherever it used to "recompute session stats" |
| POST | `/api/attendance/sessions/:id/scan-classroom/` | multipart `image` | admin session UI captures a JPEG frame and submits it |
| POST | `/api/attendance/sessions/:id/checkin/` | multipart `frames` (≥3) | adapter method `checkIn()` (not yet wired) |
| GET | `/api/attendance/audit-logs/` | — | adapter helper |

### Session review items

| Method | Path | Sends | Notes |
|---|---|---|---|
| GET | `/api/attendance/review-items/?session=:id` | — | |
| POST | `/api/attendance/review-items/:id/approve/` | — | |
| POST | `/api/attendance/review-items/:id/dismiss/` | — | |
| POST | `/api/attendance/review-items/` | `{...}` | kept for parity — **see Gap #9** |

### Settings

| Method | Path | Sends | Notes |
|---|---|---|---|
| GET | `/api/settings/:key/` | — | expects `{key, value, updated_at}`; **`value` is read as a JSON string and `JSON.parse`d — see Gap #2** |
| POST | `/api/settings/` | `{key, value: "<stringified JSON>"}` | upsert |
| GET / PATCH | `/api/students/:id/settings/` | `{attendance_notifications?, security_alerts?, campus_announcements?, two_factor_enabled?}` | admin/lecturer view of a student |
| GET / PATCH | `/api/students/me/settings/` | same body | student self view (StudentSettings.vue uses this) |

### Support / requests

| Method | Path | Sends | Notes |
|---|---|---|---|
| GET | `/api/support/mine/` | — | student portal |
| GET | `/api/support/` | — | admin/lecturer |
| POST | `/api/support/` | `{request_type, category, reference_id, message, session?}` | **`request_type` values — see Gap #6** |
| POST | `/api/support/:id/mark-in-review/` | — | |
| POST | `/api/support/:id/resolve/` | `{approved, note}` | |
| POST | `/api/support/:id/close/` | `{note}` | |

### Dashboard & analytics (adapter helpers, ready to wire)

| Method | Path |
|---|---|
| GET | `/api/dashboard/overview/` |
| GET | `/api/analytics/trends/?months=<n>` |
| GET | `/api/analytics/by-department/` |
| GET | `/api/analytics/at-risk/?threshold=<n>` |

### Realtime

| Method | Path | Notes |
|---|---|---|
| GET (SSE) | `/api/attendance/sessions/:id/events/` | `EventSource`; **DOES NOT EXIST — optional, see Gap #10** |

---

## 3. Gaps & decisions needed from the backend

Priority order.

### Gap #1 — Student login has no endpoint (BLOCKER for the student portal)
`StudentLogin.vue` collects **only a matric number** and the adapter calls
`POST /api/auth/student/login/ {student_id}`, which the backend does not expose. Nothing student-side
authenticates until this is resolved. Options:
- **(a)** Add `POST /api/auth/student/login/` that accepts `{student_id}` and returns `{access, refresh}`
  (e.g. passwordless / OTP / institutional SSO).
- **(b)** Tell us students must use `username + password` via `/api/auth/login/` and we add a password
  field to the student login screen.

Please pick one.

### Gap #2 — `system_settings.value` encoding
The frontend stores structured settings blobs (`admin_profile`, `admin_notifications`,
`biometric_settings`, `node_settings`). It **POSTs `value` as a JSON string** and, on GET, **`JSON.parse`s
`row.value`** (falls back to raw if parse fails). Please confirm the settings endpoint:
- accepts a string `value` on write, and
- returns the same string on read.

If you'd rather store/return a real JSON object, say so — the adapter tolerates objects on read, but the
write path currently sends a string.

### Gap #3 — Session creation needs `schedule_slot` + `scheduled_date`
Your doc requires `schedule_slot` and `scheduled_date` to create a session; the admin "Start Session"
form only has course + room, so the adapter sends `{course, room, scheduled_date: <today>}`. Either:
- allow ad-hoc sessions without a `schedule_slot`, or
- confirm we must add a slot picker to the UI (currently deferred).

### Gap #4 — Session list has no live counts
`GET /api/classes/sessions/` returns no `present_count` / `roster_size` / `average_confidence`, so
admin dashboards show `0` for present/expected/confidence until a session is opened. If the list
serializer can annotate those three fields, the overview and analytics tiles light up with no frontend
change (the adapter already reads `roster_size` / `present_count` / `average_confidence` as fallbacks).

### Gap #5 — `/api/classes/courses/` must be role-scoped for students
The student pages (Overview, Schedule, Attendance, Support) call `GET /api/classes/courses/` to show
"my courses". If a STUDENT token gets **all** courses, students see the whole catalog. Please scope the
queryset to the requesting student's enrollments for STUDENT role. The adapter falls back to
`/api/classes/my-schedule/` only on `403`.

### Gap #6 — `request_type` enum for support tickets
The adapter sends `request_type: "OVERRIDE"` when a session is attached, otherwise `"GENERAL"`. Your doc
only documents `OVERRIDE` (and says it requires `session`). Please give us the full valid enum,
especially the value for a **non-override** ticket (missed attendance, biometric issue, technical). Also
confirm whether non-override tickets can omit `session`.

### Gap #7 — Student self face-enrollment
`StudentSettings.vue` has an "Add New Reference" button. There is no student-accessible enroll endpoint
(`/api/students/:id/enroll/` is admin/lecturer + needs an image). It currently **no-ops**. Tell us the
intended flow (kiosk only? a student-scoped enroll endpoint? a support request?).

### Gap #8 — `/api/attendance/my-records/` should carry course info
Student attendance/telemetry views show the course name per record. If a record is just
`{session: <id>, ...}` the UI renders "Unknown Course". Please include `course_code` + `course_name`
(or a nested `session` with its course) on each item.

### Gap #9 — Manual creation of review items
The adapter keeps `POST /api/attendance/review-items/` for parity, but assumes review items are created
by the backend during recognition. Confirm there is no manual-create requirement (if there is, give us
the body).

### Gap #10 — Realtime (optional)
Live session attendance uses `EventSource` on `/api/attendance/sessions/:id/events/`. If you don't ship
SSE/WebSockets, the frontend degrades to manual refresh — acceptable for now. If you do, emit the new
attendance record (ideally with nested student) as the SSE `data` payload.

---

## 4. Frontend behavior that is intentionally unavailable

- Live notification inbox, global search, and help/contact actions are not shown until an endpoint
  contract exists.
- Two-factor enrollment and personal-data export do not report success without backend endpoints.
- The admin session scan uses `scan-classroom`; `checkIn` remains available for a student self-check-in
  flow if/when the product requires one.

---

## 5. Quick reference — files

| File | Role |
|---|---|
| `composables/useApi.ts` | the entire frontend↔backend contract; read this for exact calls |
| `composables/usePortal.ts` | login flow + `currentUser` / `currentStudent` state |
| `types/database.ts` | shapes the templates consume (post-normalization) |
| `nuxt.config.ts` | `backendUrl` runtime config (`VITE_BACKEND_URL`) |
