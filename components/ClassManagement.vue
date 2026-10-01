<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'

type ClassRow = {
  id: string | number
  name: string
  code: string
  department: string
  lecturer: string
  students: number
  semester: string
  status: 'Active' | 'Inactive'
}

const api = useApi()
const query = ref('')
const departmentFilter = ref('')
const semesterFilter = ref('')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const classes = ref<ClassRow[]>([])
const departmentOptions = ref<string[]>([])
const semesterOptions = ref<string[]>([])
const showAdd = ref(false)
const addError = ref('')
const newClass = ref({ code: '', name: '', department: '', semester: '', credits: 3, lecturer: '' })
let filterTimer: ReturnType<typeof setTimeout> | null = null
let loadSequence = 0

function mapCourse(course: any): ClassRow {
  return {
    id: course.id,
    name: course.course_name || course.name || 'Unnamed course',
    code: course.course_code || course.code || '',
    department: course.department || '',
    lecturer: course.professor || course.lecturer_name || (course.lecturer ? `Lecturer #${course.lecturer}` : 'Unassigned'),
    students: Array.isArray(course.student_roster)
      ? course.student_roster.length
      : Array.isArray(course.students)
        ? course.students.length
        : Number(course.student_count ?? 0),
    semester: course.semester || '',
    status: course.is_active === false ? 'Inactive' : 'Active',
  }
}

async function loadClasses() {
  const sequence = ++loadSequence
  loading.value = true
  error.value = ''
  try {
    const courses = await api.getCourses({
      search: query.value,
      department: departmentFilter.value,
      semester: semesterFilter.value,
    })
    if (sequence === loadSequence) {
      classes.value = courses.map(mapCourse)
      departmentOptions.value = [...new Set([
        ...departmentOptions.value,
        ...classes.value.map((item) => item.department).filter(Boolean),
      ])].sort()
      semesterOptions.value = [...new Set([
        ...semesterOptions.value,
        ...classes.value.map((item) => item.semester).filter(Boolean),
      ])].sort()
    }
  } catch (e: any) {
    if (sequence === loadSequence) error.value = e?.message || 'Unable to load classes.'
  } finally {
    if (sequence === loadSequence) loading.value = false
  }
}

onMounted(loadClasses)
watch([query, departmentFilter, semesterFilter], () => {
  if (filterTimer) clearTimeout(filterTimer)
  filterTimer = setTimeout(loadClasses, query.value.trim() ? 300 : 0)
})
onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer)
})

const filteredClasses = computed(() => classes.value)
const activeClasses = computed(() => classes.value.filter((item) => item.status === 'Active').length)
const studentCount = computed(() => classes.value.reduce((total, item) => total + item.students, 0))

async function createClass() {
  addError.value = ''
  if (!newClass.value.code.trim() || !newClass.value.name.trim()) {
    addError.value = 'Course code and name are required.'
    return
  }
  saving.value = true
  try {
    await api.createCourse({
      code: newClass.value.code.trim(),
      name: newClass.value.name.trim(),
      credits: Number(newClass.value.credits) || 3,
      lecturer: newClass.value.lecturer.trim(),
      department: newClass.value.department.trim(),
      semester: newClass.value.semester.trim(),
    })
    showAdd.value = false
    newClass.value = { code: '', name: '', department: '', semester: '', credits: 3, lecturer: '' }
    query.value = ''
    departmentFilter.value = ''
    semesterFilter.value = ''
    await loadClasses()
  } catch (e: any) {
    addError.value = e?.payload?.detail || e?.message || 'Unable to create class.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between gap-5 max-md:flex-col max-md:items-start">
      <div>
        <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Class Management</h1>
        <p class="mt-1.5 text-[15px] text-[#64748b]">Create and manage classes, sections and schedules.</p>
      </div>
      <button class="btn-primary" @click="showAdd = true">＋ Add Class</button>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article v-for="stat in [
        { label: 'Matching Classes', value: classes.length },
        { label: 'Total Sections', value: '—' },
        { label: 'Students in Results', value: studentCount },
        { label: 'Active Classes in Results', value: activeClasses },
      ]" :key="stat.label" class="overview-card min-h-[120px]">
        <span class="font-mono text-xs text-gray-500">{{ stat.label }}</span>
        <strong class="overview-stat text-4xl">{{ stat.value }}</strong>
      </article>
    </div>

    <article class="panel-surface overflow-x-auto">
      <p v-if="loading" class="p-6 text-sm text-gray-500">Loading classes...</p>
      <p v-else-if="error" class="p-6 text-sm text-danger">{{ error }}</p>
      <template v-else>
        <div class="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] bg-[#f8fafb] p-4">
          <input v-model="query" class="input-field min-w-[220px] flex-1" placeholder="Search code, name, department, semester, lecturer..." />
          <select v-model="departmentFilter" class="btn-outline">
            <option value="">All Departments</option>
            <option v-for="department in departmentOptions" :key="department" :value="department">{{ department }}</option>
          </select>
          <select v-model="semesterFilter" class="btn-outline">
            <option value="">All Semesters</option>
            <option v-for="semester in semesterOptions" :key="semester" :value="semester">{{ semester }}</option>
          </select>
        </div>
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Class Name</th><th>Course Code</th><th>Department</th><th>Lecturer</th><th>Students</th><th>Semester</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in filteredClasses" :key="item.id">
                <td class="font-medium">{{ item.name }}</td>
                <td class="font-mono text-xs">{{ item.code }}</td>
                <td>{{ item.department || '—' }}</td>
                <td>{{ item.lecturer }}</td>
                <td>{{ item.students }}</td>
                <td>{{ item.semester || '—' }}</td>
                <td><span class="status-tag" :class="item.status === 'Active' ? 'status-verified' : 'status-pending'">{{ item.status }}</span></td>
              </tr>
              <tr v-if="filteredClasses.length === 0"><td colspan="7" class="text-center text-gray-500">No classes match these filters.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="border-t border-line bg-surface px-4 py-4 text-sm text-gray-500">Showing {{ filteredClasses.length }} of {{ classes.length }} classes</div>
      </template>
    </article>

    <BaseModal
      :show="showAdd"
      title="Add Class"
      message="Create a class with its department and semester."
      :button-text="saving ? 'Creating...' : 'Create Class'"
      @close="showAdd = false"
      @confirm="createClass"
    >
      <div class="space-y-4 text-left">
        <p v-if="addError" class="text-sm text-danger">{{ addError }}</p>
        <label class="block font-mono text-[11px]">CLASS NAME<input v-model="newClass.name" class="input-field mt-2" required /></label>
        <label class="block font-mono text-[11px]">COURSE CODE<input v-model="newClass.code" class="input-field mt-2" required /></label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block font-mono text-[11px]">DEPARTMENT<input v-model="newClass.department" class="input-field mt-2" /></label>
          <label class="block font-mono text-[11px]">SEMESTER<input v-model="newClass.semester" class="input-field mt-2" /></label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="block font-mono text-[11px]">CREDITS<input v-model.number="newClass.credits" type="number" min="1" class="input-field mt-2" /></label>
          <label class="block font-mono text-[11px]">LECTURER USER ID<input v-model="newClass.lecturer" class="input-field mt-2" /></label>
        </div>
      </div>
    </BaseModal>
  </section>
</template>
