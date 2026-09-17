<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

type ClassRow = { id: string | number; name: string; code: string; department: string; lecturer: string; students: number; semester: string; status: 'Active' | 'Inactive' }
const query = ref('')
const classes = ref<ClassRow[]>([])
const loading = ref(true)
const error = ref('')
const api = useApi()
const showAddClass = ref(false)
const addingClass = ref(false)
const addClassError = ref('')
const newClass = ref({ code: '', name: '', credits: 3, lecturer: '' })

onMounted(async () => {
  try {
    const courses = await api.getCourses()
    classes.value = courses.map((course: any) => ({
      id: course.id,
      name: course.course_name || course.name || 'Unnamed course',
      code: course.course_code || course.code || '',
      department: course.department || '—',
      lecturer: course.professor || course.lecturer_name || (course.lecturer ? `Lecturer #${course.lecturer}` : 'Unassigned'),
      students: Array.isArray(course.students) ? course.students.length : Number(course.student_count ?? 0),
      semester: course.semester || '—',
      status: course.is_active === false ? 'Inactive' : 'Active',
    }))
  } catch (e: any) {
    error.value = e?.message || 'Unable to load classes.'
  } finally {
    loading.value = false
  }
})

const filteredClasses = computed(() => classes.value.filter((item) => `${item.name} ${item.code} ${item.lecturer}`.toLowerCase().includes(query.value.toLowerCase())))
const activeClasses = computed(() => classes.value.filter((item) => item.status === 'Active').length)
const studentCount = computed(() => classes.value.reduce((total, item) => total + item.students, 0))

async function addClass() {
  addClassError.value = ''
  if (!newClass.value.code.trim() || !newClass.value.name.trim()) {
    addClassError.value = 'Course code and name are required.'
    return
  }
  addingClass.value = true
  try {
    await api.createCourse({
      code: newClass.value.code.trim(),
      name: newClass.value.name.trim(),
      credits: Number(newClass.value.credits) || 3,
      lecturer: newClass.value.lecturer.trim(),
    })
    showAddClass.value = false
    newClass.value = { code: '', name: '', credits: 3, lecturer: '' }
    const courses = await api.getCourses()
    classes.value = courses.map((course: any) => ({
      id: course.id, name: course.course_name || course.name || 'Unnamed course',
      code: course.course_code || course.code || '', department: course.department || '—',
      lecturer: course.professor || course.lecturer_name || (course.lecturer ? `Lecturer #${course.lecturer}` : 'Unassigned'),
      students: Array.isArray(course.students) ? course.students.length : Number(course.student_count ?? 0),
      semester: course.semester || '—', status: course.is_active === false ? 'Inactive' : 'Active',
    }))
  } catch (e: any) {
    addClassError.value = e?.payload?.detail || e?.message || 'Unable to create class.'
  } finally {
    addingClass.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between">
      <div><h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Class Management</h1><p class="mt-1.5 text-[15px] text-[#64748b]">Create and manage classes, sections and schedules.</p></div>
      <button class="btn-primary" @click="showAddClass = true">＋ Add Class</button>
    </div>
    <div class="grid grid-cols-4 gap-5">
      <article v-for="stat in [
        { label: 'Total Classes', value: classes.length }, { label: 'Total Sections', value: '—' },
        { label: 'Total Students', value: studentCount }, { label: 'Active Classes', value: activeClasses },
      ]" :key="stat.label" class="overview-card min-h-[120px]"><span class="font-mono text-xs text-gray-500">{{ stat.label }}</span><strong class="overview-stat text-4xl">{{ stat.value }}</strong><span class="text-cyan text-xs">↑ 8% <span class="text-gray-400">vs last month</span></span></article>
    </div>
    <article class="panel-surface overflow-hidden">
      <p v-if="loading" class="p-6 text-sm text-gray-500">Loading classes...</p>
      <p v-else-if="error" class="p-6 text-sm text-danger">{{ error }}</p>
      <div class="flex items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4">
        <input v-model="query" class="input-field flex-1" placeholder="Search classes, course code, lecturer..." />
        <select class="btn-outline"><option>All Departments</option></select><select class="btn-outline"><option>All Semesters</option></select><select class="btn-outline"><option>All Statuses</option></select><button class="btn-outline">⚑ Filter</button>
      </div>
      <table v-if="!loading && !error" class="data-table">
        <thead><tr><th>Class Name</th><th>Course Code</th><th>Department</th><th>Lecturer</th><th>Students</th><th>Semester</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody><tr v-for="item in filteredClasses" :key="item.id"><td class="font-medium">{{ item.name }}</td><td class="font-mono text-xs">{{ item.code }}</td><td>{{ item.department }}</td><td>{{ item.lecturer }}</td><td>{{ item.students }}</td><td>{{ item.semester }}</td><td><span class="status-tag status-verified">{{ item.status }}</span></td><td><button class="table-action-btn">•••</button></td></tr></tbody>
      </table>
      <div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing {{ filteredClasses.length }} of {{ classes.length }} classes</div>
    </article>
    <div v-if="showAddClass" class="fixed inset-0 z-50 grid place-items-center bg-navy/60 p-4" @click.self="showAddClass = false">
      <form class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" @submit.prevent="addClass">
        <div class="flex items-start justify-between gap-4"><div><h2 class="text-xl font-semibold">Add class</h2><p class="mt-1 text-sm text-gray-500">Creates a course through the classes API.</p></div><button type="button" class="text-xl text-gray-500" @click="showAddClass = false">×</button></div>
        <p v-if="addClassError" class="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{{ addClassError }}</p>
        <div class="mt-5 grid gap-4">
          <label class="text-xs font-mono uppercase text-gray-500">Class name<input v-model="newClass.name" class="input-field mt-2" required /></label>
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1"><label class="text-xs font-mono uppercase text-gray-500">Course code<input v-model="newClass.code" class="input-field mt-2" required /></label><label class="text-xs font-mono uppercase text-gray-500">Credits<input v-model.number="newClass.credits" type="number" min="1" class="input-field mt-2" /></label></div>
          <label class="text-xs font-mono uppercase text-gray-500">Lecturer user ID (optional)<input v-model="newClass.lecturer" class="input-field mt-2" /></label>
        </div>
        <div class="mt-6 flex justify-end gap-3"><button type="button" class="btn-outline" @click="showAddClass = false">Cancel</button><button class="btn-primary" :disabled="addingClass">{{ addingClass ? 'Creating...' : 'Create class' }}</button></div>
      </form>
    </div>
  </section>
</template>
