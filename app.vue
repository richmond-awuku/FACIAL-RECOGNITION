<script setup lang="ts">
import { ref } from 'vue'
import { usePortal } from '~/composables/usePortal'

const { portal, isAuthed, authReady, mustChangePassword, isAdmin, logout, setPortal } = usePortal()

const adminView = ref('overview')
const studentView = ref('overview')
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

const notify = (message: string) => {
  toast.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 2600)
}

const handleAdminNav = (view: string) => {
  adminView.value = view
}

const handleStudentNav = (view: string) => {
  studentView.value = view
}

const handleSignOut = () => {
  logout()
  adminView.value = 'overview'
  studentView.value = 'overview'
}

</script>

<template>
  <div>
    <!-- Session rehydrating after a reload -->
    <div v-if="!authReady" class="min-h-screen grid place-items-center bg-navy text-white">
      <div class="flex items-center gap-3 font-mono text-xs uppercase tracking-widest text-cyan">
        <span class="w-2 h-2 rounded-full bg-cyan animate-pulse"></span> Restoring session…
      </div>
    </div>

    <!-- Login screens -->
    <AdminLogin
      v-else-if="!isAuthed && portal === 'admin'"
      @login="() => {}"
      @switch-to-student="setPortal('student')"
    />
    <StudentLogin
      v-else-if="!isAuthed && portal === 'student'"
      @login="() => {}"
      @switch-to-admin="setPortal('admin')"
    />

    <!-- Forced first-login password reset -->
    <ForcePasswordChange
      v-else-if="isAuthed && mustChangePassword"
      @sign-out="handleSignOut"
    />

    <!-- Portal -->
    <div v-else class="min-h-screen flex bg-gray-50">
      <AppSidebar
        :active-view="portal === 'admin' ? adminView : studentView"
        @navigate="portal === 'admin' ? handleAdminNav($event) : handleStudentNav($event)"
        @sign-out="handleSignOut"
      >
        <template #sidebar-action>
          <slot name="sidebar-action" />
        </template>
      </AppSidebar>

      <main class="flex-1 min-w-0">
        <AppTopbar />

        <div class="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
          <!-- Admin views -->
          <AdminSystemOverview
            v-if="portal === 'admin' && isAdmin && adminView === 'overview'"
            @navigate="handleAdminNav"
          />
          <AdminOverview
            v-else-if="portal === 'admin' && !isAdmin && adminView === 'overview'"
            @start-session="handleAdminNav(isAdmin ? 'class-management' : 'sessions')"
            @view-log="handleAdminNav(isAdmin ? 'logs' : 'sessions')"
          />
          <AdminSessions
          v-else-if="portal === 'admin' && !isAdmin && adminView === 'sessions'"
            @notify="notify"
            @view-roster="handleAdminNav('roster')"
          />
          <AdminLogs
            v-else-if="portal === 'admin' && isAdmin && adminView === 'logs'"
          />
          <UserManagement
            v-else-if="portal === 'admin' && isAdmin && adminView === 'user-management'"
          />
          <ClassManagement
            v-else-if="portal === 'admin' && isAdmin && adminView === 'class-management'"
          />
          <AdminCourses
            v-else-if="portal === 'admin' && !isAdmin && adminView === 'courses'"
            @notify="notify"
          />
          <AdminRoster
            v-else-if="portal === 'admin' && adminView === 'roster'"
            @notify="notify"
          />
          <AdminAnalytics
            v-else-if="portal === 'admin' && adminView === 'analytics'"
            @notify="notify"
          />
          <Reports
            v-else-if="portal === 'admin' && isAdmin && adminView === 'reports'"
          />
          <AdminSettings
            v-else-if="portal === 'admin' && adminView === 'settings'"
            @notify="notify"
          />

          <!-- Student views -->
          <StudentOverview
            v-else-if="portal === 'student' && studentView === 'overview'"
            @notify="notify"
            @navigate="handleStudentNav"
          />
          <StudentAttendance
            v-else-if="portal === 'student' && studentView === 'attendance'"
            @notify="notify"
          />
          <StudentSchedule
            v-else-if="portal === 'student' && studentView === 'schedule'"
            @notify="notify"
          />
          <StudentSupport
            v-else-if="portal === 'student' && studentView === 'support'"
            @notify="notify"
          />
          <StudentSettings
            v-else-if="portal === 'student' && studentView === 'settings'"
            @notify="notify"
          />
        </div>
      </main>
    </div>

    <ToastNotification :message="toast" />
  </div>
</template>
