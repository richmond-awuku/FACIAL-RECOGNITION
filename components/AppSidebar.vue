<script setup lang="ts">
import { usePortal } from '~/composables/usePortal'

const props = defineProps<{
  activeView?: string
}>()

const emit = defineEmits<{
  navigate: [view: string]
  signOut: []
}>()

const { portal, currentUser, isLecturer, logout } = usePortal()

const adminNav = [
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

const navItems = computed(() => portal.value === 'admin' ? adminNav : studentNav)

const handleNav = (id: string) => emit('navigate', id)
const handleSignOut = () => {
  logout()
  emit('signOut')
}
</script>

<template>
  <aside class="w-[266px] flex-shrink-0 min-h-screen bg-navy text-white flex flex-col">
    <!-- Brand -->
    <div v-if="portal === 'admin'" class="px-6 py-7 border-b border-navy-600">
      <strong class="block text-3xl leading-tight tracking-tight">SecureCheck<br />AI</strong>
      <span class="block text-gray-400 mt-1.5 text-sm">{{ isLecturer ? 'Lecturer Dashboard' : 'Admin Dashboard' }}</span>
    </div>
    <div v-else class="px-6 py-7 border-b border-navy-600">
      <strong class="block text-2xl tracking-tight text-cyan">
        <span class="text-2xl mr-1">♢</span> Aegis ID
      </strong>
      <span class="block text-gray-400 mt-1.5 text-sm">Secure Campus Access</span>
    </div>

    <!-- Nav -->
    <nav class="py-4">
      <button
        v-for="item in navItems"
        :key="item.id"
        :class="[
          'w-full text-left px-5 py-4 flex items-center gap-4 text-base transition-colors border-l-4',
          activeView === item.id
            ? 'bg-navy-700 text-cyan border-cyan'
            : 'border-transparent text-gray-300 hover:bg-navy-700 hover:text-cyan'
        ]"
        @click="handleNav(item.id)"
      >
        <span class="w-5 text-center text-xl">{{ item.icon }}</span>
        {{ item.label }}
      </button>
      <button
        :class="[
          'w-full text-left px-5 py-4 flex items-center gap-4 text-base transition-colors border-l-4',
          activeView === 'settings'
            ? 'bg-navy-700 text-cyan border-cyan'
            : 'border-transparent text-gray-300 hover:bg-navy-700 hover:text-cyan'
        ]"
        @click="$emit('navigate', 'settings')"
      >
        <span class="w-5 text-center text-xl">⚙</span>
        Settings
      </button>
    </nav>

    <!-- Bottom -->
    <div class="mt-auto px-5 pb-6">
      <slot name="sidebar-action" />
      <button
        class="w-full mt-4 text-left text-gray-300 hover:text-cyan font-mono text-xs uppercase py-2.5 transition-colors"
        @click="handleSignOut"
      >
        ⇥ Sign Out
      </button>
      <div class="border-t border-navy-600 mt-5 pt-4 flex gap-3 items-center">
        <div class="w-8 h-8 rounded-full bg-cyan-light flex items-center justify-center text-[10px] font-bold text-navy">
          {{ currentUser?.id || 'AU' }}
        </div>
        <div>
          <strong class="block text-sm">{{ currentUser?.name || 'Admin User' }}</strong>
          <small class="block text-gray-400 mt-0.5 font-mono text-[10px]">{{ currentUser?.role || 'System Admin' }}</small>
        </div>
      </div>
    </div>
  </aside>
</template>
