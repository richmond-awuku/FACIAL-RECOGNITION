<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

const emit = defineEmits<{ navigate: [view: string] }>()

const api = useApi()
const dashboard = ref<any>({})
const attendance = ref<any[]>([])
const activity = ref<any[]>([])
const systems = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const [overview, trends, logs] = await Promise.all([
      api.getDashboardOverview(),
      api.getAttendanceTrends(1),
      api.getAuditLogs(),
    ])
    dashboard.value = overview || {}
    attendance.value = trends.map((point: any) => ({
      day: point.day || point.date || point.label || '',
      value: Number(point.value ?? point.count ?? point.present ?? 0),
    }))
    activity.value = logs.slice(0, 5).map((log: any) => ({
      icon: '•',
      title: log.action || log.event || log.message || 'Activity recorded',
      detail: log.user_name || log.username || log.module || 'System',
      time: log.created_at || log.timestamp
        ? new Date(log.created_at || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Unknown',
      tone: 'bg-cyan-light/30 text-cyan-dark',
    }))
    systems.value = Array.isArray(overview?.systems) ? overview.systems : []
  } catch (e: any) {
    error.value = e?.message || 'Unable to load the admin overview.'
  } finally {
    loading.value = false
  }
})

const metric = (key: string, fallback = '—') => dashboard.value?.[key] ?? dashboard.value?.metrics?.[key] ?? fallback

const chartPoints = computed(() => attendance.value.map((point, index) => ({
  ...point,
  x: attendance.value.length > 1 ? 28 + index * (560 / (attendance.value.length - 1)) : 308,
  y: 208 - (point.value / Math.max(...attendance.value.map((item) => item.value), 1)) * 150,
})))

const chartPath = computed(() => chartPoints.value.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' '))
const chartArea = computed(() => `${chartPath.value} L588 208 L28 208 Z`)
const updatedAt = computed(() => dashboard.value?.updated_at || dashboard.value?.last_updated || 'Unavailable')
const attendanceSummary = computed(() => dashboard.value?.attendance_today_summary || dashboard.value?.attendance_summary || {})
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Overview</h1>
        <p class="mt-1.5 text-[15px] text-[#64748b]">System status and key metrics at a glance.</p>
      </div>
      <div class="text-right text-xs text-gray-500">
        <span class="flex items-center justify-end gap-2 font-medium text-[#1f2d3d]"><i class="h-2 w-2 rounded-full bg-success" /> System Online</span>
        <span class="mt-2 block">Last updated: {{ updatedAt }}</span>
      </div>
    </div>
    <p v-if="loading" class="text-sm text-gray-500">Loading overview...</p>
    <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

    <div class="grid grid-cols-4 gap-5">
      <article v-for="card in [
        { label: 'Total Users', value: metric('total_users'), detail: 'Students + Lecturers + Admins', change: metric('users_change'), tone: 'border-blue-200 bg-blue-50/20' },
        { label: 'Total Classes', value: metric('total_classes'), detail: 'All registered classes', change: metric('classes_change'), tone: 'border-green-200 bg-green-50/20' },
        { label: 'Total Attendance Today', value: metric('attendance_today'), detail: 'Across all classes', change: metric('attendance_change'), tone: 'border-purple-200 bg-purple-50/20' },
        { label: 'System Uptime', value: metric('system_uptime'), detail: 'Last 7 days', change: metric('uptime_change'), tone: 'border-orange-200 bg-orange-50/20' },
      ]" :key="card.label" class="overview-card min-h-[145px] border" :class="card.tone">
        <span class="font-mono text-xs text-[#64748b]">{{ card.label }}</span>
        <strong class="overview-stat text-4xl">{{ card.value }}</strong>
        <div class="flex items-center justify-between text-xs"><span class="text-gray-500">{{ card.detail }}</span><span class="text-success">↑ {{ card.change }}</span></div>
      </article>
    </div>

    <div class="grid grid-cols-4 gap-4">
      <button v-for="action in [
        { label: 'Manage Users', detail: 'Add, edit or deactivate users', view: 'user-management', icon: '♙' },
        { label: 'Manage Classes', detail: 'Create and organize classes', view: 'class-management', icon: '❏' },
        { label: 'View Reports', detail: 'Attendance & system reports', view: 'reports', icon: '▤' },
        { label: 'System Settings', detail: 'Configure system preferences', view: 'settings', icon: '⚙' },
      ]" :key="action.label" class="panel-surface flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md" @click="emit('navigate', action.view)">
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f2ff] text-lg text-[#287bd4]">{{ action.icon }}</span>
        <span><strong class="block text-sm text-[#1f2d3d]">{{ action.label }}</strong><small class="mt-1 block text-[11px] text-gray-500">{{ action.detail }}</small></span>
        <span class="ml-auto text-xl text-gray-400">›</span>
      </button>
    </div>

    <div class="grid grid-cols-[1.35fr_1fr] gap-5">
      <article class="panel-surface overflow-hidden">
        <div class="flex items-center justify-between border-b border-line px-5 py-4"><h2 class="text-lg font-semibold">▣ Attendance Overview</h2><button class="btn-outline text-xs">Last 7 Days⌄</button></div>
        <div class="p-5">
          <svg viewBox="0 0 600 240" preserveAspectRatio="none" class="h-[235px] w-full">
            <path d="M28 208 H588 M28 158 H588 M28 108 H588 M28 58 H588" stroke="#e5e7eb" />
            <path :d="chartArea" fill="#e8f3ff" />
            <path :d="chartPath" fill="none" stroke="#287bd4" stroke-width="3" />
            <circle v-for="point in chartPoints" :key="point.day" :cx="point.x" :cy="point.y" r="4" fill="#287bd4" />
          </svg>
          <div class="flex justify-between font-mono text-[10px] text-gray-500"><span v-for="point in attendance" :key="point.day">{{ point.day }}</span></div>
          <div class="mt-5 grid grid-cols-3 border-t border-line pt-4 text-sm">
            <div><span class="text-success">● Present</span><strong class="mt-1 block text-lg">{{ attendanceSummary.present ?? '—' }}</strong><small class="text-gray-500">{{ attendanceSummary.present_rate ?? '—' }}</small></div>
            <div class="border-l border-line pl-4"><span class="text-danger">● Absent</span><strong class="mt-1 block text-lg">{{ attendanceSummary.absent ?? '—' }}</strong><small class="text-gray-500">{{ attendanceSummary.absent_rate ?? '—' }}</small></div>
            <div class="border-l border-line pl-4"><span class="text-warning">● Late</span><strong class="mt-1 block text-lg">{{ attendanceSummary.late ?? '—' }}</strong><small class="text-gray-500">{{ attendanceSummary.late_rate ?? '—' }}</small></div>
          </div>
        </div>
      </article>

      <article class="panel-surface overflow-hidden">
        <div class="flex items-center justify-between border-b border-line px-5 py-4"><h2 class="text-lg font-semibold">◷ Recent Activity</h2><button class="text-sm text-cyan-dark" @click="emit('navigate', 'logs')">View All →</button></div>
        <div v-for="item in activity" :key="item.title + item.time" class="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0">
          <span class="flex h-9 w-9 items-center justify-center rounded-full text-sm" :class="item.tone">{{ item.icon }}</span>
          <span class="min-w-0 flex-1"><strong class="block truncate text-xs">{{ item.title }}</strong><small class="block truncate text-[11px] text-gray-500">{{ item.detail }}</small></span>
          <span class="text-[10px] text-gray-500">{{ item.time }} <i class="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-success" /></span>
        </div>
      </article>
    </div>

    <article class="panel-surface p-5">
      <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-semibold">▤ System Status</h2><button class="text-sm text-cyan-dark">View Details →</button></div>
      <div class="grid grid-cols-4 gap-4">
        <div v-for="system in systems" :key="system.name" class="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50/50 p-3"><span class="flex h-7 w-7 items-center justify-center rounded-full bg-success text-white">✓</span><span><strong class="block text-xs">{{ system.name }}</strong><small class="text-xs text-success">{{ system.state || system.status }}</small></span></div>
        <p v-if="!systems.length" class="col-span-4 text-sm text-gray-500">System health details are not available from the backend.</p>
      </div>
    </article>
  </section>
</template>
