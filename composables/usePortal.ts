import { ref, readonly } from 'vue'
import { useSupabase } from '~/utils/supabase'

type Portal = 'admin' | 'student'

const portal = ref<Portal>('admin')
const isAuthed = ref(false)
const currentUser = ref<{ name: string; role: string; id: string; email?: string } | null>(null)
const currentStudent = ref<{ id: string; student_id: string; full_name: string; department: string; face_enrolled: boolean; attendance_rate: number } | null>(null)

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function usePortal() {
  const supabase = useSupabase()

  const setPortal = (p: Portal) => {
    portal.value = p
  }

  const adminLogin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const hash = await sha256(password)
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, full_name, role')
      .eq('email', email)
      .eq('password_hash', hash)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Invalid email or password.' }

    isAuthed.value = true
    portal.value = 'admin'
    currentUser.value = {
      name: data.full_name,
      role: data.role === 'admin' ? 'System Admin' : 'Operator',
      id: data.id.slice(0, 8),
      email: data.email,
    }
    return { success: true }
  }

  const adminSignUp = async (email: string, password: string, fullName: string, role: string = 'admin'): Promise<{ success: boolean; error?: string }> => {
    const hash = await sha256(password)
    const { data, error } = await supabase
      .from('admins')
      .insert({ email, full_name: fullName, role, password_hash: hash })
      .select('id, email, full_name, role')
      .single()

    if (error) {
      if (error.code === '23505') return { success: false, error: 'An admin with this email already exists.' }
      return { success: false, error: error.message }
    }

    isAuthed.value = true
    portal.value = 'admin'
    currentUser.value = {
      name: data.full_name,
      role: data.role === 'admin' ? 'System Admin' : 'Operator',
      id: data.id.slice(0, 8),
      email: data.email,
    }
    return { success: true }
  }

  const studentLogin = async (matricNumber: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase
      .from('students')
      .select('id, student_id, full_name, department, face_enrolled, attendance_rate')
      .eq('student_id', matricNumber)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    if (!data) return { success: false, error: 'Student ID not found. Please check your matric number.' }

    isAuthed.value = true
    portal.value = 'student'
    currentStudent.value = {
      id: data.id,
      student_id: data.student_id,
      full_name: data.full_name,
      department: data.department,
      face_enrolled: data.face_enrolled,
      attendance_rate: Number(data.attendance_rate),
    }
    currentUser.value = {
      name: data.full_name,
      role: 'Student',
      id: data.student_id.slice(-2),
    }
    return { success: true }
  }

  const logout = () => {
    isAuthed.value = false
    currentUser.value = null
    currentStudent.value = null
  }

  return {
    portal: readonly(portal),
    isAuthed: readonly(isAuthed),
    currentUser: readonly(currentUser),
    currentStudent: readonly(currentStudent),
    setPortal,
    adminLogin,
    adminSignUp,
    studentLogin,
    logout,
  }
}
