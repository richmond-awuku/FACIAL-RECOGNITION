import { ref, readonly, computed } from "vue";
import { useApi } from "~/composables/useApi";

type Portal = "admin" | "student";

const portal = ref<Portal>("admin");
const isAuthed = ref(false);
const authReady = ref(false);
const mustChangePassword = ref(false);
const heldPassword = ref<string | null>(null); // temp password from this session's login, used to pre-fill the forced change
const currentUser = ref<{
  name: string;
  role: string;
  rawRole: string;
  id: string;
  email?: string;
  avatarUrl?: string;
} | null>(null);
const currentStudent = ref<{
  id: string;
  student_id: string;
  full_name: string;
  department: string;
  face_enrolled: boolean;
  attendance_rate: number;
  avatarUrl?: string;
} | null>(null);

function mapAdminUser(me: any) {
  const rawRole = (me.role || "").toString().toUpperCase();
  return {
    name: me.first_name
      ? `${me.first_name} ${me.last_name}`
      : me.full_name || me.username,
    role:
      rawRole === "ADMIN"
        ? "System Admin"
        : rawRole === "LECTURER"
          ? "Lecturer"
          : me.role,
    rawRole,
    id: (me.id ?? "").toString().slice(0, 8),
    email: me.email,
    avatarUrl: me.avatar_url || me.profile_image || me.photo_url,
  };
}

function mapStudent(data: any) {
  return {
    id: data.id,
    student_id: data.student_id,
    full_name:
      data.full_name ||
      `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim(),
    department: data.department,
    face_enrolled: data.face_enrolled ?? data.is_enrolled ?? false,
    attendance_rate: Number(data.attendance_rate || 0),
    avatarUrl: data.avatar_url || data.profile_image || data.photo_url,
  };
}

// A forced-password-change account is authenticated but every endpoint except
// /api/auth/me/ and /api/auth/change-password/ returns 403 until it's done.
function gateForcedChange(me: any, p: Portal) {
  isAuthed.value = true;
  mustChangePassword.value = true;
  portal.value = p;
  currentUser.value = {
    name: me.first_name ? `${me.first_name} ${me.last_name}` : me.username,
    role: p === "student" ? "Student" : mapAdminUser(me).role,
    rawRole: p === "student" ? "STUDENT" : mapAdminUser(me).rawRole,
    id: (me.id ?? "").toString().slice(0, 8),
    email: me.email,
    avatarUrl: me.avatar_url || me.profile_image || me.photo_url,
  };
  currentStudent.value = null;
}

export function usePortal() {
  const api = useApi();

  const setPortal = (p: Portal) => {
    portal.value = p;
  };

  const hydrateStudent = async (me: any) => {
    portal.value = "student";
    const data = await api.getMyStudentProfile().catch(() => null);
    if (data) currentStudent.value = mapStudent(data);
    currentUser.value = {
      name: me.first_name
        ? `${me.first_name} ${me.last_name}`
        : me.username || data?.full_name,
      role: "Student",
      rawRole: "STUDENT",
      id: String(currentStudent.value?.student_id || me.username || "").slice(
        -2,
      ),
    };
    return data;
  };

  const adminLogin = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await api.login(email, password, { as: "email" });
      heldPassword.value = password;
      const me = await api.getMe();
      if (me?.must_change_password) {
        gateForcedChange(me, "admin");
        return { success: true };
      }
      isAuthed.value = true;
      portal.value = "admin";
      currentUser.value = mapAdminUser(me);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.payload?.detail || err?.message || "Login failed",
      };
    }
  };

  const adminSignUp = async (
    email: string,
    fullName: string,
    role: string = "ADMIN",
  ): Promise<{ success: boolean; error?: string; info?: string }> => {
    try {
      // POST /api/auth/users/ no longer accepts a password — the backend
      // generates a one-time password, emails it, and forces a reset on first
      // sign-in. So there is nothing to auto-log-in with here.
      const created: any = await api.createUser({
        username: email,
        email,
        first_name: fullName.split(" ")[0] || fullName,
        last_name: fullName.split(" ").slice(1).join(" ") || "",
        role: role.toUpperCase(),
      });
      const info =
        created?.credentials_email_sent === false
          ? "Account created, but the temporary-password email could not be sent. Contact the system administrator."
          : "Account created. Check your email for a temporary password, then sign in.";
      return { success: true, info };
    } catch (err: any) {
      return {
        success: false,
        error: err?.payload?.detail || err?.message || "Signup failed",
      };
    }
  };

  const studentLogin = async (
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Students authenticate through the same endpoint as everyone else; the
      // "Student ID" field is just their Django username.
      await api.login(username, password);
      heldPassword.value = password;
      const me = await api.getMe();
      if (me?.must_change_password) {
        gateForcedChange(me, "student");
        return { success: true };
      }
      const data = await hydrateStudent(me);
      if (!data)
        return {
          success: false,
          error: "No student profile is linked to this account.",
        };
      isAuthed.value = true;
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.payload?.detail || err?.message || "Student login failed",
      };
    }
  };

  // Finish a forced first-login password reset. `currentPassword` is only needed
  // after a page reload, when the temp password is no longer held in memory.
  const completePasswordChange = async (
    newPassword: string,
    currentPassword?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const oldPw = currentPassword || heldPassword.value;
    if (!oldPw)
      return { success: false, error: "Enter your current password." };
    if (!newPassword) return { success: false, error: "Enter a new password." };
    try {
      await api.changePassword(oldPw, newPassword);
      heldPassword.value = null;
      mustChangePassword.value = false;
      const me = await api.getMe();
      if (me?.role === "STUDENT") {
        await hydrateStudent(me);
      } else {
        portal.value = "admin";
        currentUser.value = mapAdminUser(me);
      }
      isAuthed.value = true;
      return { success: true };
    } catch (err: any) {
      const p = err?.payload;
      return {
        success: false,
        error:
          p?.old_password?.[0] ||
          p?.old_password ||
          p?.new_password?.[0] ||
          p?.new_password ||
          err?.message ||
          "Unable to change password.",
      };
    }
  };

  const refreshCurrentStudent = async () => {
    try {
      const data = await api.getMyStudentProfile();
      if (data) currentStudent.value = mapStudent(data);
    } catch {
      // keep the current value
    }

    const refreshCurrentUser = async () => {
      const me = await api.getMe();
      if (me?.role === "STUDENT") await hydrateStudent(me);
      else currentUser.value = mapAdminUser(me);
    };
  };

  // Rehydrate auth state from the tokens in localStorage after a page reload.
  const restoreSession = async () => {
    if (authReady.value) return;
    try {
      let hasToken = false;
      try {
        hasToken = !!(
          localStorage.getItem("access") || localStorage.getItem("refresh")
        );
      } catch {
        hasToken = false;
      }
      if (!hasToken) return;

      const me = await api.getMe();
      if (!me) return;
      isAuthed.value = true;

      if (me.must_change_password) {
        gateForcedChange(me, me.role === "STUDENT" ? "student" : "admin");
        return;
      }

      if (me.role === "STUDENT") {
        await hydrateStudent(me);
      } else {
        portal.value = "admin";
        currentUser.value = mapAdminUser(me);
      }
    } catch {
      isAuthed.value = false;
      currentUser.value = null;
      currentStudent.value = null;
      mustChangePassword.value = false;
    } finally {
      authReady.value = true;
    }
  };

  const logout = () => {
    try {
      api.logout();
    } catch (e) {
      /* ignore */
    }
    isAuthed.value = false;
    currentUser.value = null;
    currentStudent.value = null;
    mustChangePassword.value = false;
    heldPassword.value = null;
  };

  return {
    portal: readonly(portal),
    isAuthed: readonly(isAuthed),
    authReady: readonly(authReady),
    mustChangePassword: readonly(mustChangePassword),
    needsCurrentPassword: computed(() => !heldPassword.value),
    currentUser: readonly(currentUser),
    currentStudent: readonly(currentStudent),
    isAdmin: computed(() => currentUser.value?.rawRole === "ADMIN"),
    isLecturer: computed(() => currentUser.value?.rawRole === "LECTURER"),
    setPortal,
    adminLogin,
    adminSignUp,
    studentLogin,
    completePasswordChange,
    refreshCurrentStudent,

    restoreSession,
    logout,
  };
}
