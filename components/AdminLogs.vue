<script setup lang="ts">
import { computed, ref } from 'vue'

const query = ref('')
const logs = ref([
  { id: 1, time: 'Sep 6, 2025 10:34 AM', user: 'Admin User', action: 'Generated attendance report', module: 'Reports', status: 'Success' },
  { id: 2, time: 'Sep 6, 2025 09:47 AM', user: 'Dr. Sarah Jenkins', action: 'Started attendance session', module: 'Sessions', status: 'Success' },
  { id: 3, time: 'Sep 6, 2025 08:12 AM', user: 'Admin User', action: 'Created new lecturer account', module: 'User Management', status: 'Success' },
  { id: 4, time: 'Sep 5, 2025 04:32 PM', user: 'Dr. Michael Chen', action: 'Updated class enrollment', module: 'Class Management', status: 'Success' },
  { id: 5, time: 'Sep 5, 2025 02:16 PM', user: 'Admin User', action: 'Changed biometric settings', module: 'Settings', status: 'Success' },
])

const filteredLogs = computed(() => logs.value.filter((log) => `${log.user} ${log.action} ${log.module}`.toLowerCase().includes(query.value.toLowerCase())))
</script>

<template>
  <section class="space-y-6">
    <div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">System Logs</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Review account, attendance and system activity.</p></div>
    <article class="panel-surface overflow-hidden">
      <div class="border-b border-line bg-[#f8fafb] p-4"><input v-model="query" class="input-field max-w-[440px]" placeholder="Search logs..." /></div>
      <table class="data-table">
        <thead><tr><th>Date &amp; Time</th><th>User</th><th>Action</th><th>Module</th><th>Status</th></tr></thead>
        <tbody><tr v-for="log in filteredLogs" :key="log.id"><td class="font-mono text-xs text-gray-500">{{ log.time }}</td><td class="font-medium">{{ log.user }}</td><td>{{ log.action }}</td><td><span class="mini-pill">{{ log.module }}</span></td><td><span class="status-tag status-verified">{{ log.status }}</span></td></tr></tbody>
      </table>
      <div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing {{ filteredLogs.length }} of {{ logs.length }} log entries</div>
    </article>
  </section>
</template>
