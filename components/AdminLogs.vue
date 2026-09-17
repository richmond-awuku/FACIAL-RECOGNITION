<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

const query = ref('')
const logs = ref<any[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const api = useApi()
    const rows = await api.getAuditLogs()
    logs.value = rows.map((log: any) => ({
      id: log.id,
      time: log.created_at || log.timestamp || log.time
        ? new Date(log.created_at || log.timestamp || log.time).toLocaleString()
        : 'Unknown',
      user: log.user_name || log.username || log.user?.email || log.user?.username || 'System',
      action: log.action || log.event || log.message || 'Activity recorded',
      module: log.module || log.resource || 'System',
      status: log.status || 'Success',
    }))
  } catch (e: any) {
    error.value = e?.message || 'Unable to load system logs.'
  } finally {
    loading.value = false
  }
})

const filteredLogs = computed(() => logs.value.filter((log) => `${log.user} ${log.action} ${log.module}`.toLowerCase().includes(query.value.toLowerCase())))
</script>

<template>
  <section class="space-y-6">
    <div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">System Logs</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Review account, attendance and system activity.</p></div>
    <article class="panel-surface overflow-hidden">
      <p v-if="loading" class="p-6 text-sm text-gray-500">Loading logs...</p>
      <p v-else-if="error" class="p-6 text-sm text-danger">{{ error }}</p>
      <div class="border-b border-line bg-[#f8fafb] p-4"><input v-model="query" class="input-field max-w-[440px]" placeholder="Search logs..." /></div>
      <table v-if="!loading && !error" class="data-table">
        <thead><tr><th>Date &amp; Time</th><th>User</th><th>Action</th><th>Module</th><th>Status</th></tr></thead>
        <tbody><tr v-for="log in filteredLogs" :key="log.id"><td class="font-mono text-xs text-gray-500">{{ log.time }}</td><td class="font-medium">{{ log.user }}</td><td>{{ log.action }}</td><td><span class="mini-pill">{{ log.module }}</span></td><td><span class="status-tag status-verified">{{ log.status }}</span></td></tr></tbody>
      </table>
      <div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing {{ filteredLogs.length }} of {{ logs.length }} log entries</div>
    </article>
  </section>
</template>
