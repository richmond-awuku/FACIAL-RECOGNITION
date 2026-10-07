<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()
const logs = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    logs.value = await api.getAuditLogs()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load audit logs.'
  } finally {
    loading.value = false
  }
})

function actor(log: any) {
  return log.user_name || log.username || log.user?.full_name || log.user?.email || 'System'
}

function eventName(log: any) {
  return log.action || log.event || log.message || log.module || 'Audit event'
}

function eventTime(log: any) {
  const value = log.created_at || log.timestamp
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">System Logs</h1>
      <p class="mt-1.5 text-[15px] text-[#64748b]">Face-recognition scan and check-in attempts recorded by the backend.</p>
    </div>
    <p v-if="loading" class="text-sm text-gray-500">Loading audit logs...</p>
    <p v-else-if="error" class="text-sm text-danger">{{ error }}</p>
    <article v-else class="panel-surface overflow-x-auto">
      <table class="data-table min-w-[680px]">
        <thead><tr><th>Event</th><th>Actor</th><th>Details</th><th>Date</th></tr></thead>
        <tbody>
          <tr v-for="(log, index) in logs" :key="log.id ?? index">
            <td class="font-medium">{{ eventName(log) }}</td>
            <td>{{ actor(log) }}</td>
            <td>{{ log.details || log.description || log.module || '—' }}</td>
            <td class="font-mono text-xs text-gray-500">{{ eventTime(log) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-if="!logs.length" class="p-6 text-center text-sm text-gray-500">No scan or check-in attempts are available in this audit-log scope.</p>
    </article>
  </section>
</template>
