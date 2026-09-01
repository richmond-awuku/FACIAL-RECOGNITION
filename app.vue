<script setup lang="ts">
import { ref } from 'vue'
import { usePortal } from '~/composables/usePortal'

const { portal, isAuthed, logout, setPortal } = usePortal()

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

const switchPortal = () => {
  setPortal(portal.value === 'admin' ? 'student' : 'admin')
}
</script>

<template>
  <div>
    <!-- Login screens -->
    <AdminLogin
      v-if="!isAuthed && portal === 'admin'"
      @login="() => {}"
      @switch-to-student="setPortal('student')"
    />
    <StudentLogin
      v-else-if="!isAuthed && portal === 'student'"
      @login="() => {}"
      @switch-to-admin="setPortal('admin')"
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
        <AppTopbar @switch-portal="switchPortal" />

        <div class="p-8 max-w-5xl mx-auto">
          <!-- Admin views -->
          <AdminOverview
            v-if="portal === 'admin' && adminView === 'overview'"
            @start-session="handleAdminNav('sessions')"
            @view-log="handleAdminNav('sessions')"
          />
          <AdminSessions
            v-else-if="portal === 'admin' && adminView === 'sessions'"
            @notify="notify"
            @view-roster="handleAdminNav('roster')"
          />
          <AdminRoster
            v-else-if="portal === 'admin' && adminView === 'roster'"
            @notify="notify"
          />
          <AdminAnalytics
            v-else-if="portal === 'admin' && adminView === 'analytics'"
            @notify="notify"
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
