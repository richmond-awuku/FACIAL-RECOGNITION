export type Student = {
  id: string
  student_id: string
  full_name: string
  email: string
  department: string
  enrollment_status: 'Verified' | 'Pending' | 'Flagged'
  face_enrolled: boolean
  last_seen: string | null
  attendance_rate: number
  created_at: string
}

export type Course = {
  id: string
  course_code: string
  course_name: string
  credits: number
  professor: string
  room: string
  created_at: string
}

export type Session = {
  id: string
  session_code: string
  course_id: string
  room: string
  status: 'live' | 'completed' | 'scheduled'
  total_expected: number
  total_present: number
  avg_confidence: number
  started_at: string | null
  ended_at: string | null
  created_at: string
}

export type AttendanceRecord = {
  id: string
  student_id: string
  session_id: string
  status: 'Present' | 'Absent' | 'Excused' | 'Late'
  confidence_score: number | null
  check_in_time: string
  created_at: string
}

export type StudentCourse = {
  id: string
  student_id: string
  course_id: string
  created_at: string
}

export type SessionWithCourse = Session & {
  courses?: Course
}

export type AttendanceWithStudent = AttendanceRecord & {
  students?: Student
}

export type AttendanceWithSession = AttendanceRecord & {
  sessions?: SessionWithCourse
}

export type SystemSettings = {
  key: string
  value: Record<string, any>
  updated_at: string
}

export type StudentSettings = {
  student_id: string
  attendance_notifications: boolean
  security_alerts: boolean
  campus_announcements: boolean
  two_factor_enabled: boolean
  updated_at: string
}

export type SupportTicket = {
  id: string
  student_id: string | null
  category: string
  reference_id: string
  description: string
  status: 'Open' | 'In Review' | 'Resolved' | 'Rejected' | 'Closed'
  created_at: string
  updated_at: string
}

export type SessionReviewItem = {
  id: string
  session_id: string
  student_id: string
  reason: string
  confidence_score: number | null
  status: 'Open' | 'Approved' | 'Dismissed'
  created_at: string
}

export type AdminProfile = {
  full_name: string
  department: string
  admin_id: string
}

export type AdminNotifications = {
  session_starts: boolean
  system_health: boolean
  at_risk_summaries: boolean
  real_time_intervention: boolean
}

export type BiometricSettings = {
  confidence_threshold: number
  anti_spoofing_sensitivity: 'Low' | 'Standard' | 'High'
  auto_schedule_enabled: boolean
  archival_days: number
  telemetry_sharing: boolean
}

export type CameraNode = {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'degraded'
  firmware: string
}
