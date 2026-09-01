import { useSupabase } from '~/utils/supabase'
import type {
  Student, Course, Session, AttendanceRecord,
  StudentSettings, SupportTicket, SessionReviewItem,
  AdminProfile, AdminNotifications, BiometricSettings, CameraNode,
} from '~/types/database'

export function useDatabase() {
  const supabase = useSupabase()

  async function getStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as Student[]
  }

  async function getStudentByStudentId(studentId: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()
    if (error) throw error
    return data as Student | null
  }

  async function getCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('course_code')
    if (error) throw error
    return (data || []) as Course[]
  }

  async function getActiveSessions(): Promise<(Session & { courses: Course })[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, courses(*)')
      .eq('status', 'live')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as (Session & { courses: Course })[]
  }

  async function getAllSessions(): Promise<(Session & { courses: Course })[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, courses(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as (Session & { courses: Course })[]
  }

  async function getCompletedSessions(): Promise<(Session & { courses: Course })[]> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, courses(*)')
      .eq('status', 'completed')
      .order('ended_at', { ascending: false })
    if (error) throw error
    return (data || []) as (Session & { courses: Course })[]
  }

  async function getAttendanceBySession(sessionId: string): Promise<(AttendanceRecord & { students: Student })[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*, students(*)')
      .eq('session_id', sessionId)
      .order('check_in_time', { ascending: false })
    if (error) throw error
    return (data || []) as (AttendanceRecord & { students: Student })[]
  }

  async function getAttendanceByStudent(studentDbId: string): Promise<(AttendanceRecord & { sessions: Session & { courses: Course } })[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*, sessions(*, courses(*))')
      .eq('student_id', studentDbId)
      .order('check_in_time', { ascending: false })
    if (error) throw error
    return (data || []) as (AttendanceRecord & { sessions: Session & { courses: Course } })[]
  }

  async function getStudentCourses(studentDbId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('student_courses')
      .select('courses(*)')
      .eq('student_id', studentDbId)
    if (error) throw error
    return ((data || []) as any[]).map((item) => item.courses as Course)
  }

  async function createStudent(student: { student_id: string; full_name: string; email: string; department: string; enrollment_status?: string; face_enrolled?: boolean }): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert({
        student_id: student.student_id,
        full_name: student.full_name,
        email: student.email,
        department: student.department,
        enrollment_status: student.enrollment_status || 'Pending',
        face_enrolled: student.face_enrolled || false,
      })
      .select()
      .single()
    if (error) throw error
    return data as Student
  }

  async function startSession(courseId: string, room: string, expected: number): Promise<Session> {
    const sessionCode = `SES-${Math.floor(1000 + Math.random() * 9000)}`
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        session_code: sessionCode,
        course_id: courseId,
        room,
        status: 'live',
        total_expected: expected,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data as Session
  }

  async function stopSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'completed', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
    if (error) throw error
  }

  async function recordAttendance(studentDbId: string, sessionId: string, status: 'Present' | 'Absent' | 'Excused', confidence: number | null): Promise<void> {
    const { error } = await supabase
      .from('attendance_records')
      .insert({
        student_id: studentDbId,
        session_id: sessionId,
        status,
        confidence_score: confidence,
        check_in_time: new Date().toISOString(),
      })
    if (error) throw error
  }

  async function updateSessionStats(sessionId: string): Promise<void> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('confidence_score')
      .eq('session_id', sessionId)
      .eq('status', 'Present')
    if (error) throw error

    const present = data.length
    const avgConf = present > 0
      ? data.reduce((sum: number, r: any) => sum + Number(r.confidence_score || 0), 0) / present
      : 0

    await supabase
      .from('sessions')
      .update({ total_present: present, avg_confidence: Math.round(avgConf * 10) / 10 })
      .eq('id', sessionId)
  }

  async function deleteStudent(studentDbId: string): Promise<void> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentDbId)
    if (error) throw error
  }

  async function updateStudent(studentDbId: string, updates: Partial<Student>): Promise<void> {
    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentDbId)
    if (error) throw error
  }

  function subscribeToSessionAttendance(sessionId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`attendance:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance_records',
        filter: `session_id=eq.${sessionId}`,
      }, callback)
      .subscribe()
  }

  // ── Settings ──────────────────────────────────────────────

  async function getSystemSetting<T = any>(key: string): Promise<T | null> {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (error) throw error
    return (data?.value as T) ?? null
  }

  async function saveSystemSetting(key: string, value: Record<string, any>): Promise<void> {
    const { error } = await supabase
      .from('system_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) throw error
  }

  async function getStudentSettings(studentDbId: string): Promise<StudentSettings | null> {
    const { data, error } = await supabase
      .from('student_settings')
      .select('*')
      .eq('student_id', studentDbId)
      .maybeSingle()
    if (error) throw error
    return data as StudentSettings | null
  }

  async function saveStudentSettings(studentDbId: string, settings: Partial<StudentSettings>): Promise<void> {
    const { error } = await supabase
      .from('student_settings')
      .upsert({ student_id: studentDbId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'student_id' })
    if (error) throw error
  }

  // ── Support tickets ────────────────────────────────────────

  async function getSupportTickets(studentDbId?: string): Promise<(SupportTicket & { students?: Student })[]> {
    let query = supabase.from('support_tickets').select('*, students(*)')
    if (studentDbId) query = query.eq('student_id', studentDbId)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as (SupportTicket & { students?: Student })[]
  }

  async function createSupportTicket(ticket: { student_id?: string; category: string; reference_id?: string; description: string }): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        student_id: ticket.student_id || null,
        category: ticket.category,
        reference_id: ticket.reference_id || '',
        description: ticket.description,
        status: 'Open',
      })
      .select()
      .single()
    if (error) throw error
    return data as SupportTicket
  }

  async function updateSupportTicket(ticketId: string, updates: Partial<SupportTicket>): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
    if (error) throw error
  }

  // ── Session review items ──────────────────────────────────

  async function getSessionReviewItems(sessionId: string): Promise<(SessionReviewItem & { students?: Student })[]> {
    const { data, error } = await supabase
      .from('session_review_items')
      .select('*, students(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []) as (SessionReviewItem & { students?: Student })[]
  }

  async function createSessionReviewItem(item: { session_id: string; student_id: string; reason: string; confidence_score?: number | null }): Promise<void> {
    const { error } = await supabase
      .from('session_review_items')
      .insert({
        session_id: item.session_id,
        student_id: item.student_id,
        reason: item.reason,
        confidence_score: item.confidence_score ?? null,
        status: 'Open',
      })
    if (error) throw error
  }

  async function updateSessionReviewItem(itemId: string, updates: Partial<SessionReviewItem>): Promise<void> {
    const { error } = await supabase
      .from('session_review_items')
      .update(updates)
      .eq('id', itemId)
    if (error) throw error
  }

  return {
    getStudents,
    getStudentByStudentId,
    getCourses,
    getActiveSessions,
    getAllSessions,
    getCompletedSessions,
    getAttendanceBySession,
    getAttendanceByStudent,
    getStudentCourses,
    createStudent,
    startSession,
    stopSession,
    recordAttendance,
    updateSessionStats,
    deleteStudent,
    updateStudent,
    subscribeToSessionAttendance,
    getSystemSetting,
    saveSystemSetting,
    getStudentSettings,
    saveStudentSettings,
    getSupportTickets,
    createSupportTicket,
    updateSupportTicket,
    getSessionReviewItems,
    createSessionReviewItem,
    updateSessionReviewItem,
  }
}
