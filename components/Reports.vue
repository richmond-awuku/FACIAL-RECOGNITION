<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('Attendance Reports')
const reportTypes = [
  { name: 'Attendance Summary', type: 'Overall attendance statistics', color: 'text-cyan' },
  { name: 'Student Attendance', type: 'Individual student records', color: 'text-cyan' },
  { name: 'Class Attendance', type: 'Class-wise attendance', color: 'text-success' },
  { name: 'Custom Report', type: 'Filter and download', color: 'text-purple-500' },
]
const recentReports = ref([
  { id: 1, name: 'Attendance Summary', type: 'Attendance', date: 'Sep 6, 2025 10:34 AM', status: 'Completed' },
  { id: 2, name: 'CS-201 Class Report', type: 'Class', date: 'Sep 6, 2025 06:15 AM', status: 'Completed' },
  { id: 3, name: 'Student Attendance (Michael Chen)', type: 'Student', date: 'Sep 5, 2025 04:31 PM', status: 'Completed' },
  { id: 4, name: 'System Activity Log', type: 'System', date: 'Sep 5, 2025 02:10 PM', status: 'Completed' },
])
const generate = (name: string) => {
  recentReports.value.unshift({ id: Date.now(), name, type: 'Generated', date: new Date().toLocaleString(), status: 'Completed' })
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between"><div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Reports</h1><p class="mt-1.5 text-[15px] text-[#64748b]">View and download attendance, academic and system reports.</p></div><div class="flex gap-2"><button class="btn-outline">Sep 1, 2025 - Sep 6, 2025</button><button class="btn-primary">⇩ Export</button></div></div>
    <div class="flex gap-8 border-b border-line"><button v-for="tab in ['Attendance Reports', 'User Reports', 'Class Reports', 'System Reports']" :key="tab" class="border-b-2 px-1 pb-3 text-sm font-medium" :class="activeTab === tab ? 'border-cyan text-cyan-dark' : 'border-transparent text-gray-500'" @click="activeTab = tab">{{ tab }}</button></div>
    <div class="grid grid-cols-4 gap-5">
      <article v-for="report in reportTypes" :key="report.name" class="panel-surface p-5"><div :class="report.color" class="mb-5 text-2xl">▧</div><h2 class="font-semibold">{{ report.name }}</h2><p class="mt-1 text-sm text-gray-500">{{ report.type }}</p><button class="btn-outline mt-5 w-full" @click="generate(report.name)">Generate Report</button></article>
    </div>
    <article class="panel-surface overflow-hidden"><div class="border-b border-line px-6 py-5"><h2 class="text-xl font-semibold">Recent Reports</h2></div><table class="data-table"><thead><tr><th>Report Name</th><th>Type</th><th>Date Generated</th><th>Status</th><th>Actions</th></tr></thead><tbody><tr v-for="report in recentReports" :key="report.id"><td class="font-medium">{{ report.name }}</td><td>{{ report.type }}</td><td class="font-mono text-xs text-gray-500">{{ report.date }}</td><td><span class="status-tag status-verified">{{ report.status }}</span></td><td><button class="table-action-btn">⇩</button></td></tr></tbody></table></article>
  </section>
</template>
