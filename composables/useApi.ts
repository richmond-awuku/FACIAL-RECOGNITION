import { useRuntimeConfig } from '#app'

type FetchOpts = { method?: string; body?: any }

// ── token helpers ─────────────────────────────────────────
function authHeaders() {
  try {
    const access = localStorage.getItem('access')
    return access ? { Authorization: `Bearer ${access}` } : {}
  } catch {
    return {}
  }
}

function setTokens(tokens: { access?: string; refresh?: string } | null) {
  try {
    if (!tokens) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      return
    }
    if (tokens.access) localStorage.setItem('access', tokens.access)
    if (tokens.refresh) localStorage.setItem('refresh', tokens.refresh)
  } catch {
    // noop
  }
}

// ── shape normalizers ─────────────────────────────────────
// The Django API returns DRF-style objects (first_name/last_name, code/name,
// UPPERCASE status enums, flat course fields on sessions). The UI components
// were written against the older Supabase shapes, so we translate here to avoid
// touching every template.

const ENROLL_STATUS: Record<string, string> = { VERIFIED: 'Verified', PENDING: 'Pending', FLAGGED: 'Flagged' }
const SESSION_STATUS: Record<string, string> = { SCHEDULED: 'scheduled', ACTIVE: 'live', ENDED: 'completed', CANCELLED: 'completed' }
const REVIEW_STATUS: Record<string, string> = { OPEN: 'Open', APPROVED: 'Approved', DISMISSED: 'Dismissed' }
const TICKET_STATUS: Record<string, string> = { OPEN: 'Open', IN_REVIEW: 'In Review', APPROVED: 'Resolved', REJECTED: 'Rejected', RESOLVED: 'Resolved', CLOSED: 'Closed' }

// Support request categories: backend enum <-> human label shown in the UI.
const CATEGORY_LABEL: Record<string, string> = {
  ATTENDANCE_DISPUTE: 'Attendance Dispute',
  TECHNICAL_ISSUE: 'Technical Issue',
  ACCOUNT_ACCESS: 'Account Access',
  BIOMETRIC_REENROLLMENT: 'Biometric Re-enrollment',
  OTHER: 'Other',
}
const CATEGORY_ENUM: Record<string, string> = {
  'Missed Attendance': 'ATTENDANCE_DISPUTE',
  'Incorrect Identification': 'ATTENDANCE_DISPUTE',
  'Biometric Enrollment': 'BIOMETRIC_REENROLLMENT',
  'Biometric Re-enrollment': 'BIOMETRIC_REENROLLMENT',
  'Technical Issue': 'TECHNICAL_ISSUE',
  'Account Access': 'ACCOUNT_ACCESS',
  'Other': 'OTHER',
}
function toCategoryEnum(c?: string): string {
  if (!c) return 'OTHER'
  if (CATEGORY_ENUM[c]) return CATEGORY_ENUM[c]
  const up = c.toUpperCase().replace(/[^A-Z]+/g, '_')
  return ['ATTENDANCE_DISPUTE', 'TECHNICAL_ISSUE', 'ACCOUNT_ACCESS', 'BIOMETRIC_REENROLLMENT', 'OTHER'].includes(up) ? up : 'OTHER'
}

function fullName(s: any): string {
  return s?.full_name || [s?.first_name, s?.last_name].filter(Boolean).join(' ').trim() || s?.name || ''
}

function asArray(d: any): any[] {
  if (Array.isArray(d)) return d
  if (d && Array.isArray(d.results)) return d.results // tolerate DRF pagination
  return d ? [d] : []
}

function normStudent(s: any): any {
  if (!s || typeof s !== 'object') return s
  return {
    ...s,
    id: s.id,
    student_id: s.student_id ?? s.student_id_number ?? '',
    full_name: fullName(s),
    email: s.email ?? '',
    department: s.department ?? '',
    enrollment_status: ENROLL_STATUS[s.enrollment_status] ?? s.enrollment_status ?? 'Pending',
    face_enrolled: s.is_enrolled ?? s.face_enrolled ?? false,
    last_seen: s.last_seen ?? null,
    attendance_rate: Number(s.attendance_rate ?? 0),
    created_at: s.created_at ?? null,
  }
}

function normCourse(c: any): any {
  if (!c || typeof c !== 'object') return c
  return {
    ...c,
    id: c.id ?? c.course ?? c.code ?? c.course_code,
    course_code: c.course_code ?? c.code ?? '',
    course_name: c.course_name ?? c.name ?? '',
    credits: c.credits ?? 0,
    professor: c.professor ?? (c.lecturer != null ? `Lecturer #${c.lecturer}` : ''),
    room: c.room ?? c.schedule_slots?.[0]?.room ?? 'TBD',
    created_at: c.created_at ?? null,
  }
}

function normSession(s: any): any {
  if (!s || typeof s !== 'object') return s
  const courses = normCourse({
    id: s.course,
    course_code: s.course_code,
    course_name: s.course_name,
    room: s.room,
  })
  return {
    ...s,
    id: s.id,
    session_code: s.session_code ?? (s.id != null ? `SES-${s.id}` : ''),
    course_id: s.course ?? null,
    room: s.room ?? 'TBD',
    status: SESSION_STATUS[s.status] ?? String(s.status ?? '').toLowerCase(),
    total_expected: s.total_expected ?? s.roster_size ?? 0,
    total_present: s.total_present ?? s.present_count ?? 0,
    avg_confidence: s.avg_confidence ?? s.average_confidence ?? 0,
    started_at: s.started_at ?? null,
    ended_at: s.ended_at ?? null,
    created_at: s.created_at ?? null,
    courses,
  }
}

function normAttendance(r: any): any {
  if (!r || typeof r !== 'object') return r
  const studentObj = r.student && typeof r.student === 'object'
  const sessionObj = r.session && typeof r.session === 'object'
  const students = studentObj
    ? normStudent(r.student)
    : (r.student_name || r.student_id_number)
      ? normStudent({ id: r.student, first_name: r.student_name, student_id: r.student_id_number })
      : undefined
  const sessions = sessionObj
    ? normSession(r.session)
    : (r.course_name || r.course_code)
      ? { courses: normCourse({ id: r.course, course_name: r.course_name, course_code: r.course_code }) }
      : undefined
  return {
    ...r,
    id: r.id,
    student_id: studentObj ? r.student.id : r.student,
    session_id: sessionObj ? r.session.id : r.session,
    status: r.status ?? 'Present', // every returned record is a check-in
    confidence_score: r.confidence_score ?? null,
    check_in_time: r.check_in_time ?? r.timestamp ?? r.created_at ?? null,
    created_at: r.created_at ?? r.timestamp ?? null,
    students,
    sessions,
  }
}

function normReviewItem(r: any): any {
  if (!r || typeof r !== 'object') return r
  return {
    ...r,
    id: r.id,
    session_id: r.session,
    student_id: r.student,
    reason: r.reason ?? '',
    confidence_score: r.confidence_score ?? null,
    status: REVIEW_STATUS[r.status] ?? r.status ?? 'Open',
    students: (r.student_name || r.student_id_number)
      ? normStudent({ id: r.student, first_name: r.student_name, student_id: r.student_id_number })
      : undefined,
    created_at: r.created_at ?? null,
  }
}

function normTicket(t: any): any {
  if (!t || typeof t !== 'object') return t
  return {
    ...t,
    id: t.id,
    student_id: t.student ?? null,
    category: CATEGORY_LABEL[t.category] ?? t.category ?? '',
    reference_id: t.reference_id ?? '',
    description: t.message ?? t.description ?? '',
    status: TICKET_STATUS[t.status] ?? t.status ?? 'Open',
    created_at: t.created_at ?? null,
    updated_at: t.resolved_at ?? t.updated_at ?? t.created_at ?? null,
  }
}

export function useApi() {
  const config = useRuntimeConfig()
  const base = (config.public.backendUrl as string) || 'http://localhost:8000'

  async function rawFetch(path: string, opts: FetchOpts = {}) {
    const url = `${base}${path}`
    const headers: Record<string, string> = { ...(authHeaders() as any) }
    const isForm = opts.body instanceof FormData
    if (opts.body && !isForm) headers['Content-Type'] = 'application/json'
    return fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: opts.body && !isForm ? JSON.stringify(opts.body) : opts.body,
    })
  }

  async function tryRefresh() {
    const refresh = localStorage.getItem('refresh')
    if (!refresh) throw new Error('No refresh token')
    const res = await fetch(`${base}/api/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) throw new Error('Refresh failed')
    const data = await res.json()
    // SimpleJWT rotates the refresh token on every use and blacklists the old one,
    // so persist BOTH values that come back.
    setTokens({ access: data.access, refresh: data.refresh })
    return data
  }

  async function call(path: string, opts: FetchOpts = {}) {
    let res = await rawFetch(path, opts)
    if (res.status === 401) {
      try {
        await tryRefresh()
        res = await rawFetch(path, opts)
      } catch {
        setTokens(null)
        const err: any = new Error('Unauthorized')
        err.status = 401
        throw err
      }
    }
    const contentType = res.headers.get('content-type') || ''
    if (!res.ok) {
      let payload: any = null
      if (contentType.includes('application/json')) payload = await res.json().catch(() => null)
      // DRF errors are either { detail } or { field: [msg] }
      let message = payload?.detail || res.statusText
      if (!payload?.detail && payload && typeof payload === 'object') {
        const first = Object.values(payload)[0]
        if (Array.isArray(first) && first.length) message = String(first[0])
      }
      const err: any = new Error(message)
      err.status = res.status
      err.payload = payload
      throw err
    }
    if (res.status === 204 || res.status === 205) return null
    if (contentType.includes('application/json')) return res.json()
    return res
  }

  // Like call(), but resolves to null on 404 (missing optional resource).
  async function callSafe(path: string, opts: FetchOpts = {}) {
    try {
      return await call(path, opts)
    } catch (e: any) {
      if (e?.status === 404) return null
      throw e
    }
  }

  // ── Auth ────────────────────────────────────────────────
  // Every role authenticates through /api/auth/login/. The backend accepts
  // either `username` or `email` as the identifier field — admins sign in with
  // their email, students with their matric number (their Django username).
  async function login(identifier: string, password: string, opts: { as?: 'email' | 'username' } = {}) {
    const field = opts.as === 'email' ? 'email' : 'username'
    const data = await call('/api/auth/login/', { method: 'POST', body: { [field]: identifier, password } })
    setTokens({ access: data.access, refresh: data.refresh })
    return data
  }

  async function refreshToken() {
    return tryRefresh()
  }

  async function logout() {
    let refresh: string | null = null
    try { refresh = localStorage.getItem('refresh') } catch { /* noop */ }
    try {
      if (refresh) await call('/api/auth/logout/', { method: 'POST', body: { refresh } })
    } catch {
      // ignore server logout errors
    }
    setTokens(null)
  }

  async function getMe() { return call('/api/auth/me/') }
  async function createUser(payload: any) { return call('/api/auth/users/', { method: 'POST', body: payload }) }
  async function changePassword(oldPassword: string, newPassword: string) {
    return call('/api/auth/change-password/', { method: 'POST', body: { old_password: oldPassword, new_password: newPassword } })
  }

  // ── Students ────────────────────────────────────────────
  async function getStudents() { return asArray(await call('/api/students/')).map(normStudent) }

  async function getStudentByStudentId(studentId: string) {
    const arr = asArray(await call(`/api/students/?search=${encodeURIComponent(studentId)}`)).map(normStudent)
    return arr.find((s) => s.student_id === studentId) ?? arr[0] ?? null
  }

  async function getMyStudentProfile() { return normStudent(await call('/api/students/me/')) }

  async function createStudent(payload: any) {
    const [first, ...rest] = String(payload.full_name ?? '').trim().split(/\s+/)
    const body: any = {
      student_id: payload.student_id,
      first_name: payload.first_name ?? first ?? '',
      last_name: payload.last_name ?? rest.join(' '),
      email: payload.email,
      department: payload.department,
    }
    if (payload.user != null) body.user = payload.user
    if (payload.guardian_phone) body.guardian_phone = payload.guardian_phone
    if (payload.guardian_email) body.guardian_email = payload.guardian_email
    return normStudent(await call('/api/students/', { method: 'POST', body }))
  }

  async function updateStudent(id: string, updates: any) {
    // Flag state has dedicated actions.
    if (updates?.enrollment_status === 'Flagged') return flagStudent(id)
    const body: any = {}
    if (updates.full_name != null) {
      const [first, ...rest] = String(updates.full_name).trim().split(/\s+/)
      body.first_name = first
      body.last_name = rest.join(' ')
    }
    if (updates.first_name != null) body.first_name = updates.first_name
    if (updates.last_name != null) body.last_name = updates.last_name
    if (updates.email != null) body.email = updates.email
    if (updates.department != null) body.department = updates.department
    if (updates.guardian_phone != null) body.guardian_phone = updates.guardian_phone
    if (updates.guardian_email != null) body.guardian_email = updates.guardian_email
    if (updates.is_active != null) body.is_active = updates.is_active
    // enrollment_status / face_enrolled / face_reference_updated_at are backend-managed
    // (set via /enroll/ and recognition flows), so they are intentionally dropped.
    if (Object.keys(body).length === 0) return null
    return normStudent(await call(`/api/students/${id}/`, { method: 'PATCH', body }))
  }

  async function deleteStudent(id: string) { return call(`/api/students/${id}/`, { method: 'DELETE' }) }
  async function flagStudent(id: string) { return normStudent(await call(`/api/students/${id}/flag/`, { method: 'POST' })) }
  async function unflagStudent(id: string) { return normStudent(await call(`/api/students/${id}/unflag/`, { method: 'POST' })) }
  async function enrollStudentFace(id: string, formData: FormData) {
    // Staff-supervised: single `image` field, no liveness, works at any status.
    return call(`/api/students/${id}/enroll/`, { method: 'POST', body: formData })
  }
  async function enrollMyFace(formData: FormData) {
    // Student self-enroll: multipart `frames` (>=3), liveness-checked, once while PENDING.
    return call('/api/students/me/enroll/', { method: 'POST', body: formData })
  }

  // ── Courses ─────────────────────────────────────────────
  async function getCourses() { return asArray(await call('/api/classes/courses/')).map(normCourse) }
  async function getCourse(id: string) { return normCourse(await call(`/api/classes/courses/${id}/`)) }

  async function createCourse(payload: any) {
    const body: any = {
      code: payload.code ?? payload.course_code,
      name: payload.name ?? payload.course_name,
      credits: payload.credits ?? 3,
    }
    if (payload.lecturer != null && payload.lecturer !== '') body.lecturer = Number(payload.lecturer)
    if (Array.isArray(payload.students)) body.students = payload.students
    return normCourse(await call('/api/classes/courses/', { method: 'POST', body }))
  }
  async function updateCourse(id: string, updates: any) {
    const body: any = {}
    if (updates.code ?? updates.course_code) body.code = updates.code ?? updates.course_code
    if (updates.name ?? updates.course_name) body.name = updates.name ?? updates.course_name
    if (updates.credits != null) body.credits = updates.credits
    if (updates.lecturer !== undefined) body.lecturer = updates.lecturer === '' || updates.lecturer == null ? null : Number(updates.lecturer)
    if (Array.isArray(updates.students)) body.students = updates.students
    return normCourse(await call(`/api/classes/courses/${id}/`, { method: 'PATCH', body }))
  }
  async function deleteCourse(id: string) { return call(`/api/classes/courses/${id}/`, { method: 'DELETE' }) }

  // Enroll / unenroll students on a course by merging the students id list.
  async function setCourseStudents(id: string, studentIds: Array<string | number>) {
    return updateCourse(id, { students: studentIds.map((n) => Number(n)) })
  }

  // ── Schedule slots ──────────────────────────────────────
  async function getScheduleSlots(courseId?: string | number) {
    const rows = asArray(await call('/api/classes/schedule-slots/'))
    return courseId != null ? rows.filter((s: any) => String(s.course) === String(courseId)) : rows
  }
  async function createScheduleSlot(payload: any) {
    return call('/api/classes/schedule-slots/', {
      method: 'POST',
      body: {
        course: payload.course,
        day_of_week: Number(payload.day_of_week),
        start_time: payload.start_time,
        end_time: payload.end_time,
        room: payload.room,
      },
    })
  }
  async function deleteScheduleSlot(id: string | number) {
    return call(`/api/classes/schedule-slots/${id}/`, { method: 'DELETE' })
  }

  // GET /api/classes/courses/ is role-scoped server-side: a STUDENT token gets
  // only their enrolled courses (empty list, not an error, if none). The
  // my-schedule fallback stays as a safety net for older backend builds.
  async function getStudentCourses(_studentDbId?: string) {
    try {
      return asArray(await call('/api/classes/courses/')).map(normCourse)
    } catch (e: any) {
      if (e?.status !== 403) throw e
      const slots = asArray(await call('/api/classes/my-schedule/'))
      const seen = new Map<string, any>()
      for (const s of slots) {
        const key = s.course_code ?? String(s.session_id)
        if (!seen.has(key)) {
          seen.set(key, normCourse({ id: key, course_code: s.course_code, course_name: s.course_name, room: s.room }))
        }
      }
      return [...seen.values()]
    }
  }

  // ── Sessions ────────────────────────────────────────────
  async function getAllSessions() { return asArray(await call('/api/classes/sessions/')).map(normSession) }
  async function getActiveSessions() {
    return asArray(await call('/api/classes/sessions/')).map(normSession).filter((s) => s.status === 'live')
  }
  async function getCompletedSessions() {
    return asArray(await call('/api/classes/sessions/')).map(normSession).filter((s) => s.status === 'completed')
  }

  // NOTE: creating a session properly also needs schedule_slot + scheduled_date.
  // This minimal form is kept pending the sessions rework.
  async function startSession(courseId: string, room: string, _expected: number) {
    const created = await call('/api/classes/sessions/', {
      method: 'POST',
      body: { course: courseId, room, scheduled_date: new Date().toISOString().slice(0, 10) },
    })
    try { await call(`/api/classes/sessions/${created.id}/start/`, { method: 'POST' }) } catch { /* may already be active */ }
    return normSession(created)
  }

  async function stopSession(sessionId: string) {
    return normSession(await call(`/api/classes/sessions/${sessionId}/stop/`, { method: 'POST' }))
  }

  async function generateSessions(date?: string) {
    return asArray(await call('/api/classes/schedule/generate/', { method: 'POST', body: date ? { date } : {} })).map(normSession)
  }

  async function getMySchedule(weekStart?: string) {
    return asArray(await call(`/api/classes/my-schedule/${weekStart ? `?week_start=${weekStart}` : ''}`))
  }

  // ── Attendance ──────────────────────────────────────────
  async function getAttendanceBySession(sessionId: string) {
    return asArray(await call(`/api/attendance/records/?session=${sessionId}`)).map(normAttendance)
  }
  async function getAttendanceRecords() {
    return asArray(await call('/api/attendance/records/')).map(normAttendance)
  }
  async function getAttendanceByStudent(_studentDbId?: string) {
    // Self-service endpoint; the current student is inferred from the token.
    return asArray(await call('/api/attendance/my-records/')).map(normAttendance)
  }

  async function recordAttendance(payload: any) {
    // Manual override — status/confidence are backend-managed for manual marks.
    const sessionId = payload.session_id ?? payload.session
    const student = payload.student_id ?? payload.student
    return call(`/api/attendance/sessions/${sessionId}/manual/`, { method: 'POST', body: { student } })
  }

  async function getSessionSummary(sessionId: string) {
    return call(`/api/attendance/sessions/${sessionId}/summary/`)
  }

  // The backend computes session stats; nothing to write. Return the summary so
  // callers that await this still get useful data.
  async function updateSessionStats(sessionId: string) {
    try { return await getSessionSummary(sessionId) } catch { return null }
  }

  async function scanClassroom(sessionId: string, formData: FormData) {
    return call(`/api/attendance/sessions/${sessionId}/scan-classroom/`, { method: 'POST', body: formData })
  }
  async function checkIn(sessionId: string, formData: FormData) {
    return call(`/api/attendance/sessions/${sessionId}/checkin/`, { method: 'POST', body: formData })
  }
  async function getAuditLogs() { return asArray(await call('/api/attendance/audit-logs/')) }

  // ── Session review items ────────────────────────────────
  async function getSessionReviewItems(sessionId: string) {
    return asArray(await call(`/api/attendance/review-items/?session=${sessionId}`)).map(normReviewItem)
  }
  async function getReviewItems(params: { session?: string; status?: string } = {}) {
    const qs = new URLSearchParams(params as Record<string, string>).toString()
    return asArray(await call(`/api/attendance/review-items/${qs ? `?${qs}` : ''}`)).map(normReviewItem)
  }
  // NOTE: review items have no manual-create route by design — the backend
  // creates them during recognition; POST /review-items/ is a guaranteed 405.
  async function updateSessionReviewItem(itemId: string, updates: any) {
    if (updates?.status === 'Approved') {
      return normReviewItem(await call(`/api/attendance/review-items/${itemId}/approve/`, { method: 'POST' }))
    }
    if (updates?.status === 'Dismissed') {
      return normReviewItem(await call(`/api/attendance/review-items/${itemId}/dismiss/`, { method: 'POST' }))
    }
    return null
  }

  // ── Settings ────────────────────────────────────────────
  async function getSystemSetting<T = any>(key: string): Promise<T | null> {
    const row = await callSafe(`/api/settings/${encodeURIComponent(key)}/`)
    if (!row) return null
    const raw = row.value ?? row
    if (typeof raw !== 'string') return raw as T
    try { return JSON.parse(raw) as T } catch { return raw as unknown as T }
  }
  async function saveSystemSetting(key: string, value: any) {
    const payload = typeof value === 'string' ? value : JSON.stringify(value)
    // POST acts as upsert on the settings router.
    return call('/api/settings/', { method: 'POST', body: { key, value: payload } })
  }

  async function getStudentSettings(studentDbId: string) {
    return callSafe(`/api/students/${studentDbId}/settings/`)
  }
  async function saveStudentSettings(studentDbId: string, settings: any) {
    return call(`/api/students/${studentDbId}/settings/`, { method: 'PATCH', body: settings })
  }
  async function getMyStudentSettings() { return callSafe('/api/students/me/settings/') }
  async function saveMyStudentSettings(settings: any) {
    return call('/api/students/me/settings/', { method: 'PATCH', body: settings })
  }

  // ── Support / requests ──────────────────────────────────
  // Everything lives under /api/support/requests/ (NOT bare /api/support/).
  async function getSupportTickets(studentDbId?: string) {
    // Students see only their own via /mine/; admins/lecturers see all.
    return asArray(await call(studentDbId ? '/api/support/requests/mine/' : '/api/support/requests/')).map(normTicket)
  }
  async function createSupportTicket(ticket: any) {
    // request_type is ONLY "OVERRIDE" | "ISSUE". OVERRIDE requires a session, so
    // without one we always file an ISSUE.
    const body: any = {
      request_type: ticket.request_type ?? (ticket.session ? 'OVERRIDE' : 'ISSUE'),
      category: ticket.category_enum ?? toCategoryEnum(ticket.category),
      message: ticket.message ?? ticket.description ?? '',
    }
    if (ticket.reference_id) body.reference_id = ticket.reference_id
    if (ticket.session) body.session = ticket.session
    return normTicket(await call('/api/support/requests/', { method: 'POST', body }))
  }
  async function updateSupportTicket(id: string, updates: any) {
    if (updates?.status === 'In Review') {
      return normTicket(await call(`/api/support/requests/${id}/mark-in-review/`, { method: 'POST' }))
    }
    if (updates?.status === 'Resolved' || updates?.status === 'Rejected') {
      return normTicket(await call(`/api/support/requests/${id}/resolve/`, {
        method: 'POST',
        body: { approved: updates.approved ?? updates.status !== 'Rejected', note: updates.note ?? '' },
      }))
    }
    if (updates?.status === 'Closed') {
      return normTicket(await call(`/api/support/requests/${id}/close/`, { method: 'POST', body: { note: updates.note ?? '' } }))
    }
    return null
  }

  // ── Dashboard & analytics ───────────────────────────────
  async function getDashboardOverview() { return call('/api/dashboard/overview/') }
  async function getAttendanceTrends(months = 6) { return asArray(await call(`/api/analytics/trends/?months=${months}`)) }
  async function getAttendanceByDepartment() { return asArray(await call('/api/analytics/by-department/')) }
  async function getAtRiskStudents(threshold = 15) { return asArray(await call(`/api/analytics/at-risk/?threshold=${threshold}`)) }

  // ── "Realtime" via polling ──────────────────────────────
  // The backend has no SSE/WebSocket channel. We poll the session summary and
  // invoke `callback` when a new check-in appears (or present_count changes),
  // keeping the same { new, summary } payload shape the callers already expect.
  function subscribeToSessionAttendance(
    sessionId: string,
    callback: (payload: any) => void,
    opts: { intervalMs?: number } = {},
  ) {
    const interval = opts.intervalMs ?? 5000
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let primed = false
    let lastPresent = -1
    const seen = new Set<string | number>()

    async function tick() {
      if (stopped) return
      try {
        const summary: any = await getSessionSummary(sessionId)
        const checkins = Array.isArray(summary?.recent_checkins) ? summary.recent_checkins : []
        let firedForNew = false
        // recent_checkins is newest-first; walk oldest-first so callbacks arrive in order
        for (const raw of [...checkins].reverse()) {
          const rec = normAttendance(raw)
          if (rec.id == null || seen.has(rec.id)) continue
          seen.add(rec.id)
          if (primed) { callback({ new: rec, summary }); firedForNew = true }
        }
        const present = Number(summary?.present_count ?? NaN)
        if (primed && !firedForNew && Number.isFinite(present) && lastPresent >= 0 && present !== lastPresent) {
          callback({ summary })
        }
        if (Number.isFinite(present)) lastPresent = present
        primed = true
      } catch {
        /* transient error — try again next tick */
      }
      if (!stopped) timer = setTimeout(tick, interval)
    }
    tick()

    return {
      close: () => {
        stopped = true
        if (timer) clearTimeout(timer)
      },
    }
  }

  return {
    // auth
    login,
    refreshToken,
    logout,
    getMe,
    createUser,
    changePassword,
    // students
    getStudents,
    getStudentByStudentId,
    getMyStudentProfile,
    createStudent,
    updateStudent,
    deleteStudent,
    flagStudent,
    unflagStudent,
    enrollStudentFace,
    enrollMyFace,
    // courses
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    setCourseStudents,
    getStudentCourses,
    // schedule slots
    getScheduleSlots,
    createScheduleSlot,
    deleteScheduleSlot,
    // sessions
    getAllSessions,
    getActiveSessions,
    getCompletedSessions,
    startSession,
    stopSession,
    generateSessions,
    getMySchedule,
    // attendance
    getAttendanceBySession,
    getAttendanceRecords,
    getAttendanceByStudent,
    recordAttendance,
    getSessionSummary,
    updateSessionStats,
    scanClassroom,
    checkIn,
    getAuditLogs,
    // review items
    getSessionReviewItems,
    getReviewItems,
    updateSessionReviewItem,
    // settings
    getSystemSetting,
    saveSystemSetting,
    getStudentSettings,
    saveStudentSettings,
    getMyStudentSettings,
    saveMyStudentSettings,
    // support
    getSupportTickets,
    createSupportTicket,
    updateSupportTicket,
    // dashboard & analytics
    getDashboardOverview,
    getAttendanceTrends,
    getAttendanceByDepartment,
    getAtRiskStudents,
    // realtime
    subscribeToSessionAttendance,
  }
}

export type UseApi = ReturnType<typeof useApi>
