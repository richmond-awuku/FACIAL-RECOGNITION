import { readonly, computed } from 'vue'
import { useApi } from '~/composables/useApi'

type Portal = 'admin' | 'student'

function mapAdminUser(me: any) {
  const rawRole = (me.role || '').toString().toUpperCase()
  return {
    name: me.first_name ? `${me.first_name} ${me.last_name}` : me.full_name || me.username,
    role: rawRole === 'ADMIN' ? 'System Admin' : rawRole === 'LECTURER' ? 'Lecturer' : me.role,
    rawRole,
    id: (me.id ?? '').toString().slice(0, 8),
    imageKey: me.id != null ? `user-${me.id}` : `email-${me.email || me.username}`,
    email: me.email,
  }
}

function mapStudent(data: any) {
  return {
    id: data.id,
    student_id: data.student_id,
    full_name: data.full_name || `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
    department: data.department,
    face_enrolled: data.face_enrolled ?? data.is_enrolled ?? false,
    attendance_rate: Number(data.attendance_rate || 0),
  }
}

export function usePortal() {
  const api = useApi()
  const portal = useState<Portal>('portal', () => 'admin')
  const isAuthed = useState('portal-is-authed', () => false)
  const authReady = useState('portal-auth-ready', () => false)
  const mustChangePassword = useState('portal-must-change-password', () => false)
  const heldPassword = useState<string | null>('portal-held-password', () => null)
  const currentUser = useState<{ name: string; role: string; rawRole: string; id: string; imageKey?: string; email?: string } | null>('portal-current-user', () => null)
  const currentStudent = useState<{ id: string; student_id: string; full_name: string; department: string; face_enrolled: boolean; attendance_rate: number } | null>('portal-current-student', () => null)
  const profileImage = useState<string | null>('portal-profile-image', () => null)

  const setCurrentUser = (user: typeof currentUser.value) => {
    currentUser.value = user
    try {
      profileImage.value = user?.imageKey
        ? localStorage.getItem(`profile-image:${user.imageKey}`)
        : null
    } catch {
      profileImage.value = null
    }
  }

  const setProfileImage = (image: string | null) => {
    const imageKey = currentUser.value?.imageKey
    if (!imageKey) throw new Error('Unable to identify the current account.')
    try {
      if (image) localStorage.setItem(`profile-image:${imageKey}`, image)
      else localStorage.removeItem(`profile-image:${imageKey}`)
      profileImage.value = image
    } catch {
      throw new Error('Could not save this image in browser storage.')
    }
  }

  // A forced-password-change account is authenticated but every endpoint except
  // /api/auth/me/ and /api/auth/change-password/ returns 403 until it's done.
  const gateForcedChange = (me: any, p: Portal) => {
    isAuthed.value = true
    mustChangePassword.value = true
    portal.value = p
    setCurrentUser({
      name: me.first_name ? `${me.first_name} ${me.last_name}` : me.username,
      role: p === 'student' ? 'Student' : mapAdminUser(me).role,
      rawRole: p === 'student' ? 'STUDENT' : mapAdminUser(me).rawRole,
      id: (me.id ?? '').toString().slice(0, 8),
      imageKey: me.id != null ? `user-${me.id}` : `username-${me.username}`,
      email: me.email,
    })
    currentStudent.value = null
  }

  const setPortal = (p: Portal) => {
    portal.value = p
  }

  const hydrateStudent = async (me: any) => {
    portal.value = 'student'
    const data = await api.getMyStudentProfile().catch(() => null)
    if (data) currentStudent.value = mapStudent(data)
    setCurrentUser({
      name: me.first_name ? `${me.first_name} ${me.last_name}` : me.username || data?.full_name,
      role: 'Student',
      rawRole: 'STUDENT',
      id: String(currentStudent.value?.student_id || me.username || '').slice(-2),
      imageKey: me.id != null ? `user-${me.id}` : `username-${me.username}`,
      email: me.email,
    })
    return data
  }

  const adminLogin = async (email: string, password: string, remember = true): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.login(email, password, { as: 'email', remember })
      heldPassword.value = password
      const me = await api.getMe()
      if (me?.must_change_password) {
        gateForcedChange(me, 'admin')
        return { success: true }
      }
      isAuthed.value = true
      portal.value = 'admin'
      setCurrentUser(mapAdminUser(me))
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.payload?.detail || err?.message || 'Login failed' }
    }
  }

  const adminSignUp = async (email: string, fullName: string, role: string = 'ADMIN'): Promise<{ success: boolean; error?: string; info?: string }> => {
    try {
      // POST /api/auth/users/ no longer accepts a password — the backend
      // generates a one-time password, emails it, and forces a reset on first
      // sign-in. So there is nothing to auto-log-in with here.
      const created: any = await api.createUser({
        username: email,
        email,
        first_name: fullName.split(' ')[0] || fullName,
        last_name: fullName.split(' ').slice(1).join(' ') || '',
        role: role.toUpperCase(),
      })
      const info = created?.credentials_email_sent === false
        ? 'Account created, but the temporary-password email could not be sent. Contact the system administrator.'
        : 'Account created. Check your email for a temporary password, then sign in.'
      return { success: true, info }
    } catch (err: any) {
      return { success: false, error: err?.payload?.detail || err?.message || 'Signup failed' }
    }
  }

  const studentLogin = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Students authenticate through the same endpoint as everyone else; the
      // "Student ID" field is just their Django username.
      await api.login(username, password)
      heldPassword.value = password
      const me = await api.getMe()
      if (me?.must_change_password) {
        gateForcedChange(me, 'student')
        return { success: true }
      }
      const data = await hydrateStudent(me)
      if (!data) return { success: false, error: 'No student profile is linked to this account.' }
      isAuthed.value = true
      return { success: true }
    } catch (err: any) {
      return { success: false, error: err?.payload?.detail || err?.message || 'Student login failed' }
    }
  }

  // Finish a forced first-login password reset. `currentPassword` is only needed
  // after a page reload, when the temp password is no longer held in memory.
  const completePasswordChange = async (newPassword: string, currentPassword?: string): Promise<{ success: boolean; error?: string }> => {
    const oldPw = currentPassword || heldPassword.value
    if (!oldPw) return { success: false, error: 'Enter your current password.' }
    if (!newPassword) return { success: false, error: 'Enter a new password.' }
    try {
      await api.changePassword(oldPw, newPassword)
      heldPassword.value = null
      mustChangePassword.value = false
      const me = await api.getMe()
      if (me?.role === 'STUDENT') {
        await hydrateStudent(me)
      } else {
        portal.value = 'admin'
        setCurrentUser(mapAdminUser(me))
      }
      isAuthed.value = true
      return { success: true }
    } catch (err: any) {
      const p = err?.payload
      return {
        success: false,
        error: p?.old_password?.[0] || p?.old_password
          || p?.new_password?.[0] || p?.new_password
          || err?.message || 'Unable to change password.',
      }
    }
  }

  const refreshCurrentStudent = async () => {
    try {
      const data = await api.getMyStudentProfile()
      if (data) currentStudent.value = mapStudent(data)
    } catch {
      // keep the current value
    }
  }

  // Rehydrate auth state from the tokens in localStorage after a page reload.
  const restoreSession = async () => {
    if (authReady.value) return
    try {
      let hasToken = false
      try {
        hasToken = !!(
          localStorage.getItem('access') ||
          localStorage.getItem('refresh') ||
          sessionStorage.getItem('access') ||
          sessionStorage.getItem('refresh')
        )
      } catch {
        hasToken = false
      }
      if (!hasToken) return

      const me = await api.getMe()
      if (!me) return
      isAuthed.value = true

      if (me.must_change_password) {
        gateForcedChange(me, me.role === 'STUDENT' ? 'student' : 'admin')
        return
      }

      if (me.role === 'STUDENT') {
        await hydrateStudent(me)
      } else {
        portal.value = 'admin'
        setCurrentUser(mapAdminUser(me))
      }
    } catch {
      isAuthed.value = false
      setCurrentUser(null)
      currentStudent.value = null
      mustChangePassword.value = false
    } finally {
      authReady.value = true
    }
  }

  const logout = () => {
    try { api.logout() } catch (e) { /* ignore */ }
    isAuthed.value = false
    setCurrentUser(null)
    currentStudent.value = null
    mustChangePassword.value = false
    heldPassword.value = null
  }

  return {
    portal: readonly(portal),
    isAuthed: readonly(isAuthed),
    authReady: readonly(authReady),
    mustChangePassword: readonly(mustChangePassword),
    needsCurrentPassword: computed(() => !heldPassword.value),
    currentUser: readonly(currentUser),
    profileImage: readonly(profileImage),
    currentStudent: readonly(currentStudent),
    isAdmin: computed(() => currentUser.value?.rawRole === 'ADMIN'),
    isLecturer: computed(() => currentUser.value?.rawRole === 'LECTURER'),
    setPortal,
    adminLogin,
    adminSignUp,
    studentLogin,
    completePasswordChange,
    refreshCurrentStudent,
    setProfileImage,
    restoreSession,
    logout,
  }
}
