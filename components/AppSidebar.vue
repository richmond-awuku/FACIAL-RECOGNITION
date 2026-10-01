<script setup lang="ts">
import { computed } from 'vue'
import { usePortal } from '~/composables/usePortal'

const props = defineProps<{
  activeView?: string
}>()

const emit = defineEmits<{
  navigate: [view: string]
  signOut: []
}>()

const { portal, currentUser, isLecturer, logout } = usePortal()
const userInitials = computed(() => currentUser.value?.name?.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U')

const adminNav = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'user-management', label: 'User Management', icon: '♙' },
  { id: 'class-management', label: 'Class Management', icon: '❏' },
  { id: 'roster', label: 'Student Roster', icon: '♙' },
  { id: 'analytics', label: 'Analytics', icon: '⌁' },
  { id: 'logs', label: 'Logs', icon: '▤' },
  { id: 'reports', label: 'Reports', icon: '▥' },
]

const lecturerNav = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'sessions', label: 'Sessions', icon: '▣' },
  { id: 'courses', label: 'Courses', icon: '❏' },
  { id: 'roster', label: 'Student Roster', icon: '♙' },
  { id: 'analytics', label: 'Analytics', icon: '⌁' },
]

const studentNav = [
  { id: 'overview', label: 'Overview', icon: '▦' },
  { id: 'attendance', label: 'My Attendance', icon: '♢' },
  { id: 'schedule', label: 'Schedule', icon: '□' },
  { id: 'support', label: 'Support', icon: '✦' },
]

const navItems = computed(() => {
  if (portal.value === 'student') return studentNav
  return isLecturer.value ? lecturerNav : adminNav
})

const handleNav = (id: string) => emit('navigate', id)
const handleSignOut = () => {
  logout()
  emit('signOut')
}
</script>

<template>
  <aside class="flex min-h-screen w-[64px] flex-shrink-0 flex-col bg-navy text-white sm:w-[220px] lg:w-[266px]">
    <!-- Brand -->
    <div v-if="portal === 'admin'" class="border-b border-navy-600 px-2 py-5 sm:px-6 sm:py-7">
      <strong class="hidden text-3xl leading-tight tracking-tight sm:block">SecureCheck<br />AI</strong>
      <span class="hidden text-sm text-gray-400 sm:mt-1.5 sm:block">{{ isLecturer ? 'Lecturer Dashboard' : 'Admin Dashboard' }}</span>
      <strong class="block text-center text-xl text-cyan sm:hidden">SC</strong>
    </div>
    <div v-else class="border-b border-navy-600 px-2 py-5 sm:px-6 sm:py-7">
      <strong class="hidden text-2xl tracking-tight text-cyan sm:block">
        <span class="mr-1 text-2xl">♢</span> Aegis ID
      </strong>
      <strong class="block text-center text-xl text-cyan sm:hidden">♢</strong>
      <span class="hidden text-sm text-gray-400 sm:mt-1.5 sm:block">Secure Campus Access</span>
    </div>

    <!-- Nav -->
    <nav class="py-4">
      <button
        v-for="item in navItems"
        :key="item.id"
        :class="[
          'w-full border-l-4 py-4 text-center text-base transition-colors sm:px-5 sm:text-left',
          activeView === item.id
            ? 'bg-navy-700 text-cyan border-cyan'
            : 'border-transparent text-gray-300 hover:bg-navy-700 hover:text-cyan'
        ]"
        @click="handleNav(item.id)"
      >
        <span class="w-full text-center text-xl sm:w-5">{{ item.icon }}</span>
        <span class="hidden sm:inline">{{ item.label }}</span>
      </button>
      <button
        :class="[
          'w-full border-l-4 py-4 text-center text-base transition-colors sm:px-5 sm:text-left',
          activeView === 'settings'
            ? 'bg-navy-700 text-cyan border-cyan'
            : 'border-transparent text-gray-300 hover:bg-navy-700 hover:text-cyan'
        ]"
        @click="$emit('navigate', 'settings')"
      >
        <span class="w-full text-center text-xl sm:w-5">⚙</span>
        <span class="hidden sm:inline">Settings</span>
      </button>
    </nav>

    <!-- Bottom -->
    <div class="mt-auto px-1 pb-4 sm:px-5 sm:pb-6">
      <slot name="sidebar-action" />
      <button
        class="mt-4 w-full py-2.5 text-center font-mono text-xs uppercase text-gray-300 transition-colors hover:text-cyan sm:text-left"
        :title="'Sign out'"
        @click="handleSignOut"
      >
        ⇥ <span class="hidden sm:inline">Sign Out</span>
      </button>
      <div class="mt-5 flex items-center justify-center gap-3 border-t border-navy-600 pt-4 sm:justify-start">
        <div class="w-8 h-8 rounded-full bg-cyan-light flex items-center justify-center text-[10px] font-bold text-navy">
          {{ userInitials }}
        </div>
        <div class="hidden min-w-0 sm:block">
          <strong class="block truncate text-sm">{{ currentUser?.name || currentUser?.email || 'User' }}</strong>
          <small class="mt-0.5 block truncate font-mono text-[10px] text-gray-400">{{ currentUser?.role || '' }}</small>
        </div>
      </div>
    </div>
  </aside>
</template>
