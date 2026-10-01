<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

type ReportDataset = 'attendance' | 'users' | 'classes' | 'logs'
type ReportDefinition = { name: string; description: string; dataset: ReportDataset }

const api = useApi()
const definitions: ReportDefinition[] = [
  { name: 'Attendance Summary', description: 'Attendance records from the backend', dataset: 'attendance' },
  { name: 'Student Attendance', description: 'Student-level attendance records', dataset: 'attendance' },
  { name: 'Class Attendance', description: 'Course and session attendance records', dataset: 'attendance' },
  { name: 'User Directory', description: 'User records returned by the backend', dataset: 'users' },
  { name: 'Class Directory', description: 'Course records returned by the backend', dataset: 'classes' },
  { name: 'System Activity', description: 'Audit events returned by the backend', dataset: 'logs' },
]
const datasets = ref<Record<ReportDataset, any[]>>({ attendance: [], users: [], classes: [], logs: [] })
const loading = ref(true)
const error = ref('')
const exporting = ref('')
const loadedAt = ref('')

onMounted(async () => {
  try {
    const [attendance, users, classes, logs] = await Promise.all([
      api.getAttendanceRecords(),
      api.getUsers(),
      api.getCourses(),
      api.getAuditLogs(),
    ])
    datasets.value = { attendance, users, classes, logs }
    loadedAt.value = new Date().toLocaleString()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load report data.'
  } finally {
    loading.value = false
  }
})

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function exportReport(report: ReportDefinition) {
  exporting.value = report.name
  try {
    const rows = datasets.value[report.dataset]
    if (!rows.length) {
      error.value = `No ${report.dataset} data is available to export.`
      return
    }
    const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    const csv = [
      columns.map(csvCell).join(','),
      ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(',')),
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to export report data.'
  } finally {
    exporting.value = ''
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Reports</h1>
        <p class="mt-1.5 text-[15px] text-[#64748b]">Export current records fetched from the backend.</p>
      </div>
      <span v-if="loadedAt" class="text-xs text-gray-500">Data loaded {{ loadedAt }}</span>
    </div>
    <p v-if="loading" class="text-sm text-gray-500">Loading report data...</p>
    <p v-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="report in definitions" :key="report.name" class="panel-surface p-5">
        <div class="mb-5 text-2xl text-cyan">▧</div>
        <h2 class="font-semibold">{{ report.name }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ report.description }}</p>
        <p class="mt-3 text-xs text-gray-500">{{ datasets[report.dataset].length }} records loaded</p>
        <button class="btn-outline mt-5 w-full" :disabled="loading || !!exporting" @click="exportReport(report)">
          {{ exporting === report.name ? 'Preparing...' : 'Download CSV' }}
        </button>
      </article>
    </div>
    <article class="panel-surface p-5">
      <h2 class="text-lg font-semibold">Report history</h2>
      <p class="mt-2 text-sm text-gray-500">Report downloads are generated in this browser from live API data. Persisted report jobs and download history are not available in the current backend contract.</p>
    </article>
  </section>
</template>
