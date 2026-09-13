<script setup lang="ts">
import { computed, ref } from 'vue'

type ClassRow = { id: number; name: string; code: string; department: string; lecturer: string; students: number; semester: string; status: 'Active' | 'Inactive' }
const query = ref('')
const classes = ref<ClassRow[]>([
  { id: 1, name: 'Web Development', code: 'CS-201', department: 'Computer Science', lecturer: 'Dr. Sarah Jenkins', students: 32, semester: 'Fall 2025', status: 'Active' },
  { id: 2, name: 'Data Structures', code: 'CS-301', department: 'Computer Science', lecturer: 'Dr. Michael Chen', students: 28, semester: 'Fall 2025', status: 'Active' },
  { id: 3, name: 'Digital Electronics', code: 'EE-201', department: 'Electrical Eng.', lecturer: 'Prof. James Wilson', students: 25, semester: 'Fall 2025', status: 'Active' },
  { id: 4, name: 'Control Systems', code: 'EE-302', department: 'Electrical Eng.', lecturer: 'Dr. Anita Patel', students: 22, semester: 'Fall 2025', status: 'Active' },
  { id: 5, name: 'Intro to IT', code: 'IT-101', department: 'Information Tech.', lecturer: 'Dr. David Kim', students: 40, semester: 'Fall 2025', status: 'Active' },
  { id: 6, name: 'Calculus I', code: 'MA-201', department: 'Mathematics', lecturer: 'Dr. Elena Rodriguez', students: 36, semester: 'Fall 2025', status: 'Active' },
  { id: 7, name: 'Physics I', code: 'PHY-101', department: 'Physics', lecturer: 'Prof. John Smith', students: 31, semester: 'Fall 2025', status: 'Active' },
  { id: 8, name: 'Business Management', code: 'BUS-101', department: 'Business Admin.', lecturer: 'Dr. Michael Brown', students: 27, semester: 'Fall 2025', status: 'Active' },
])
const filteredClasses = computed(() => classes.value.filter((item) => `${item.name} ${item.code} ${item.lecturer}`.toLowerCase().includes(query.value.toLowerCase())))
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between">
      <div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Class Management</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Create and manage classes, sections and schedules.</p></div>
      <button class="btn-primary">＋ Add Class</button>
    </div>
    <div class="grid grid-cols-4 gap-5">
      <article v-for="stat in [
        { label: 'Total Classes', value: '48' }, { label: 'Total Sections', value: '142' },
        { label: 'Total Students', value: '1,020' }, { label: 'Active Classes', value: '42' },
      ]" :key="stat.label" class="overview-card min-h-[120px]"><span class="font-mono text-xs text-gray-500">{{ stat.label }}</span><strong class="overview-stat text-4xl">{{ stat.value }}</strong><span class="text-cyan text-xs">↑ 8% <span class="text-gray-400">vs last month</span></span></article>
    </div>
    <article class="panel-surface overflow-hidden">
      <div class="flex items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4">
        <input v-model="query" class="input-field flex-1" placeholder="Search classes, course code, lecturer..." />
        <select class="btn-outline"><option>All Departments</option></select><select class="btn-outline"><option>All Semesters</option></select><select class="btn-outline"><option>All Statuses</option></select><button class="btn-outline">⚑ Filter</button>
      </div>
      <table class="data-table">
        <thead><tr><th>Class Name</th><th>Course Code</th><th>Department</th><th>Lecturer</th><th>Students</th><th>Semester</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody><tr v-for="item in filteredClasses" :key="item.id"><td class="font-medium">{{ item.name }}</td><td class="font-mono text-xs">{{ item.code }}</td><td>{{ item.department }}</td><td>{{ item.lecturer }}</td><td>{{ item.students }}</td><td>{{ item.semester }}</td><td><span class="status-tag status-verified">{{ item.status }}</span></td><td><button class="table-action-btn">•••</button></td></tr></tbody>
      </table>
      <div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing {{ filteredClasses.length }} of {{ classes.length }} classes</div>
    </article>
  </section>
</template>
