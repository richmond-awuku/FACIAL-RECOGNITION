<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

const emit = defineEmits<{ navigate: [view: string] }>()
const api = useApi()
const dashboard = ref<any>({})
const attendance = ref<any[]>([])
const todayRecords = ref<any[] | null>(null)
const activity = ref<any[]>([])
const health = ref<any>(null)
const loading = ref(true)
const error = ref('')
const healthError = ref('')
const trendError = ref('')
const activityError = ref('')
const recordsError = ref('')
const updatedAt = ref('')

onMounted(async () => {
  const [overviewResult, trendsResult, logsResult, healthResult, recordsResult] = await Promise.allSettled([
    api.getDashboardOverview(),
    api.getAttendanceTrends(6),
    api.getAuditLogs(),
    api.getSystemHealth(),
    api.getAttendanceRecords(),
  ])
  if (overviewResult.status === 'fulfilled') {
    dashboard.value = overviewResult.value || {}
    updatedAt.value = overviewResult.value?.updated_at || overviewResult.value?.last_updated || ''
  } else {
    error.value = overviewResult.reason?.message || 'Unable to load the admin overview.'
  }
  if (trendsResult.status === 'fulfilled') {
    attendance.value = trendsResult.value.flatMap((point: any) => {
      const rate = Number(point?.attendance_rate)
      return typeof point?.period === 'string' && Number.isFinite(rate)
        ? [{ period: point.period, attendanceRate: rate }]
        : []
    })
  } else {
    trendError.value = trendsResult.reason?.message || 'Unable to load attendance trends.'
  }
  if (logsResult.status === 'fulfilled') {
    const recentActivity = Array.isArray(dashboard.value?.recent_activity)
      ? dashboard.value.recent_activity
      : []
    const activityRows = recentActivity.length ? recentActivity : logsResult.value
    activity.value = activityRows.slice(0, 5).map((log: any, index: number) => ({
      id: log.id ?? `${log.created_at || log.timestamp || 'activity'}-${index}`,
      title: log.action || log.event || log.message || 'Activity recorded',
      detail: log.user_name || log.username || log.user?.email || log.module || 'System',
      time: log.created_at || log.timestamp
        ? new Date(log.created_at || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '',
    }))
  } else {
    activityError.value = logsResult.reason?.message || 'Unable to load recent activity.'
  }
  if (healthResult.status === 'fulfilled') {
    health.value = healthResult.value
    updatedAt.value = healthResult.value?.checked_at || updatedAt.value
  } else {
    healthError.value = healthResult.reason?.message || 'Unable to load system health.'
  }
  if (recordsResult.status === 'fulfilled') {
    todayRecords.value = recordsResult.value.filter((record: any) => {
      const timestamp = record.check_in_time || record.created_at
      return timestamp && new Date(timestamp).toLocaleDateString() === new Date().toLocaleDateString()
    })
  } else {
    recordsError.value = recordsResult.reason?.message || 'Unable to load today’s attendance records.'
  }
  loading.value = false
})

const metric = (...keys: string[]) => {
  for (const key of keys) {
    const value = dashboard.value?.[key] ?? dashboard.value?.metrics?.[key]
    if (value !== undefined && value !== null) return value
  }
  return '—'
}
const summary = computed(() => dashboard.value?.attendance_today_summary || dashboard.value?.attendance_summary || {})
const todayStatusCounts = computed(() => {
  const counts = { present: 0, absent: 0, late: 0 }
  for (const record of todayRecords.value || []) {
    const status = String(record.status || '').toUpperCase()
    if (status === 'LATE' || record.is_late === true || record.late === true) counts.late++
    else if (status === 'PRESENT') counts.present++
    else if (status === 'ABSENT') counts.absent++
  }
  return counts
})
const todayStatus = (key: 'present' | 'absent' | 'late') => {
  const serverCount = summary.value?.[key] ?? summary.value?.[`${key}_count`]
  if (serverCount !== undefined && serverCount !== null) return serverCount
  return todayRecords.value ? todayStatusCounts.value[key] : '—'
}
const formatUptime = (value: unknown) => {
  const uptime = Number(value)
  if (!Number.isFinite(uptime)) return '—'
  const seconds = Math.max(0, Math.floor(uptime))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`
}
const healthComponents = computed(() => {
  if (!health.value) return []
  return [
    { name: 'Database', ...health.value.database },
    { name: 'Email', ...health.value.email },
    { name: 'Face recognition model', ...health.value.face_recognition_model },
  ]
})
const healthTone = (status: string) => {
  const normalized = status.toLowerCase()
  return ['ok', 'healthy'].includes(normalized)
    ? 'bg-success'
    : normalized === 'unknown' || !normalized
      ? 'bg-gray-400'
      : 'bg-danger'
}
const chartPoints = computed(() => attendance.value.map((point, index) => ({
  ...point,
  x: attendance.value.length > 1 ? 28 + index * (560 / (attendance.value.length - 1)) : 308,
  y: 208 - (point.attendanceRate / 100) * 150,
})))
const chartPath = computed(() => chartPoints.value.map((point, index) => `${index ? 'L' : 'M'}${point.x} ${point.y}`).join(' '))
const chartArea = computed(() => chartPath.value ? `${chartPath.value} L588 208 L28 208 Z` : '')
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between">
      <div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Overview</h1><p class="mt-1.5 text-[15px] text-[#64748b]">System status and key metrics from the backend.</p></div>
      <div class="text-right text-xs text-gray-500"><span class="block">{{ loading ? 'Loading status…' : error ? 'Status unavailable' : health?.status || 'Health status unavailable' }}</span><span v-if="updatedAt" class="mt-2 block">Checked {{ new Date(updatedAt).toLocaleString() }}</span></div>
    </div>
    <p v-if="loading" class="text-sm text-gray-500">Loading overview...</p>
    <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="card in [
        { label: 'Total Roster', value: metric('total_roster', 'total_students'), tone: 'border-blue-200 bg-blue-50/20' },
        { label: 'Total Users', value: metric('total_users'), tone: 'border-green-200 bg-green-50/20' },
        { label: 'Total Classes', value: metric('total_classes'), tone: 'border-purple-200 bg-purple-50/20' },
        { label: 'Attendance Today', value: metric('total_attendance_today', 'attendance_today'), tone: 'border-orange-200 bg-orange-50/20' },
        { label: 'Active Sessions', value: metric('active_sessions'), tone: 'border-cyan-200 bg-cyan-50/20' },
        { label: 'Attendance Rate Today', value: metric('todays_attendance_rate') === '—' ? '—' : `${metric('todays_attendance_rate')}%`, tone: 'border-teal-200 bg-teal-50/20' },
        { label: 'System Uptime', value: formatUptime(health?.uptime_seconds), tone: 'border-gray-200 bg-gray-50/20' },
      ]" :key="card.label" class="overview-card min-h-[145px] border" :class="card.tone">
        <span class="font-mono text-xs text-[#64748b]">{{ card.label }}</span><strong class="overview-stat text-4xl">{{ card.value }}</strong>
      </article>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <button v-for="action in [
        { label: 'Manage Users', detail: 'Add, edit or deactivate users', view: 'user-management', icon: '♙' },
        { label: 'Manage Classes', detail: 'Create and organize classes', view: 'class-management', icon: '❏' },
        { label: 'View Reports', detail: 'Attendance and system reports', view: 'reports', icon: '▤' },
        { label: 'System Settings', detail: 'Configure system preferences', view: 'settings', icon: '⚙' },
      ]" :key="action.label" class="panel-surface flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md" @click="emit('navigate', action.view)">
        <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f2ff] text-lg text-[#287bd4]">{{ action.icon }}</span><span><strong class="block text-sm text-[#1f2d3d]">{{ action.label }}</strong><small class="mt-1 block text-[11px] text-gray-500">{{ action.detail }}</small></span><span class="ml-auto text-xl text-gray-400">›</span>
      </button>
    </div>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_1fr]">
      <article class="panel-surface overflow-hidden">
        <div class="border-b border-line px-5 py-4"><h2 class="text-lg font-semibold">Attendance Overview</h2></div>
        <div class="p-5">
          <svg v-if="chartPath" viewBox="0 0 600 240" preserveAspectRatio="none" class="h-[235px] w-full">
            <path d="M28 208 H588 M28 158 H588 M28 108 H588 M28 58 H588" stroke="#e5e7eb" /><path :d="chartArea" fill="#e8f3ff" /><path :d="chartPath" fill="none" stroke="#287bd4" stroke-width="3" /><circle v-for="point in chartPoints" :key="point.period" :cx="point.x" :cy="point.y" r="4" fill="#287bd4" />
          </svg>
          <p v-else class="py-20 text-center text-sm" :class="trendError ? 'text-danger' : 'text-gray-500'">{{ trendError || 'No attendance trend data returned.' }}</p>
          <p v-if="chartPath" class="mb-2 text-right font-mono text-[10px] text-gray-500">ATTENDANCE RATE (%)</p>
          <div class="flex justify-between gap-2 font-mono text-[10px] text-gray-500"><span v-for="point in attendance" :key="point.period">{{ point.period }}</span></div>
          <div class="mt-5 grid grid-cols-1 border-t border-line pt-4 text-sm sm:grid-cols-3">
            <div><span class="text-success">Present</span><strong class="mt-1 block text-lg">{{ todayStatus('present') }}</strong></div>
            <div class="border-l border-line pl-4"><span class="text-danger">Absent</span><strong class="mt-1 block text-lg">{{ todayStatus('absent') }}</strong></div>
            <div class="border-l border-line pl-4"><span class="text-warning">Late</span><strong class="mt-1 block text-lg">{{ todayStatus('late') }}</strong></div>
          </div>
          <p v-if="recordsError && !summary.present && !summary.absent && !summary.late" class="mt-3 text-xs text-danger">
            {{ recordsError }}
          </p>
          <p v-else-if="todayRecords?.length === 0" class="mt-3 text-xs text-gray-500">
            No attendance records have been returned for today.
          </p>
        </div>
      </article>
      <article class="panel-surface overflow-hidden">
        <div class="flex items-center justify-between border-b border-line px-5 py-4"><h2 class="text-lg font-semibold">Recent Activity</h2><button class="text-sm text-cyan-dark" @click="emit('navigate', 'logs')">View All →</button></div>
        <div v-for="item in activity" :key="item.id" class="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-light/30 text-cyan-dark">•</span><span class="min-w-0 flex-1"><strong class="block truncate text-xs">{{ item.title }}</strong><small class="block truncate text-[11px] text-gray-500">{{ item.detail }}</small></span><span class="text-[10px] text-gray-500">{{ item.time }}</span></div>
        <p v-if="activityError" class="p-5 text-sm text-danger">{{ activityError }}</p>
        <p v-else-if="!activity.length" class="p-5 text-sm text-gray-500">No scan or check-in attempts have been recorded.</p>
      </article>
    </div>

    <article class="panel-surface p-5">
      <h2 class="mb-4 text-lg font-semibold">System Health</h2>
      <p v-if="healthError" class="mb-3 text-sm text-danger">{{ healthError }}</p>
      <div v-if="health" class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div v-for="system in healthComponents" :key="system.name" class="flex items-center gap-3 rounded-lg border border-line p-3">
          <span class="h-3 w-3 rounded-full" :class="healthTone(String(system.status || 'unknown'))" />
          <span><strong class="block text-xs">{{ system.name }}</strong><small class="text-xs text-gray-500">{{ system.status || 'unknown' }}<template v-if="system.detail"> · {{ system.detail }}</template><template v-if="system.backend"> · {{ system.backend }}</template><template v-if="system.configured !== undefined"> · {{ system.configured ? 'configured' : 'not configured' }}</template><template v-if="system.model_name"> · {{ system.model_name }}{{ system.loaded === false ? ' (loads on first use)' : '' }}</template></small></span>
        </div>
        <div class="rounded-lg border border-line p-3"><strong class="block text-xs">Uptime</strong><small class="text-xs text-gray-500">{{ Number(health.uptime_seconds || 0).toFixed(0) }} seconds</small></div>
      </div>
      <p v-else-if="!healthError" class="text-sm text-gray-500">System health checks are unavailable.</p>
    </article>
  </section>
</template>
