<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import type { Student } from '~/types/database'

const emit = defineEmits<{
  notify: [message: string]
}>()

const { getStudents, createStudent, deleteStudent, updateStudent } = useDatabase()

const students = ref<Student[]>([])
const searchQuery = ref('')
const departmentFilter = ref('All Departments')
const loading = ref(true)
const error = ref('')

// Add student modal
const showAddForm = ref(false)
const newStudent = ref({ student_id: '', full_name: '', email: '', department: 'Computer Science' })
const addingStudent = ref(false)

// View student modal
const viewStudent = ref<Student | null>(null)

onMounted(async () => {
  await loadStudents()
})

async function loadStudents() {
  loading.value = true
  try {
    students.value = await getStudents()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const departments = computed(() => {
  const depts = new Set(students.value.map(s => s.department))
  return ['All Departments', ...Array.from(depts)]
})

const filteredStudents = computed(() => {
  return students.value.filter(s => {
    const q = searchQuery.value.toLowerCase()
    const matchesSearch = !q || `${s.full_name} ${s.student_id} ${s.department}`.toLowerCase().includes(q)
    const matchesDept = departmentFilter.value === 'All Departments' || s.department === departmentFilter.value
    return matchesSearch && matchesDept
  })
})

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

const statusClass = (status: string) => {
  if (status === 'Verified') return 'status-verified'
  if (status === 'Pending') return 'status-pending'
  return 'status-flagged'
}

const formatDate = (iso: string | null) => {
  if (!iso) return 'Never'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

async function handleAddStudent() {
  if (!newStudent.value.student_id.trim() || !newStudent.value.full_name.trim() || !newStudent.value.email.trim()) {
    emit('notify', 'Please fill in all fields.')
    return
  }
  addingStudent.value = true
  try {
    await createStudent({
      student_id: newStudent.value.student_id,
      full_name: newStudent.value.full_name,
      email: newStudent.value.email,
      department: newStudent.value.department,
    })
    await loadStudents()
    showAddForm.value = false
    newStudent.value = { student_id: '', full_name: '', email: '', department: 'Computer Science' }
    emit('notify', 'Student added successfully.')
  } catch (e: any) {
    emit('notify', `Error adding student: ${e.message}`)
  } finally {
    addingStudent.value = false
  }
}

async function handleVerify(student: Student) {
  try {
    await updateStudent(student.id, { enrollment_status: 'Verified', face_enrolled: true })
    await loadStudents()
    emit('notify', `${student.full_name} verified.`)
  } catch (e: any) {
    emit('notify', `Error: ${e.message}`)
  }
}

async function handleDelete(student: Student) {
  try {
    await deleteStudent(student.id)
    await loadStudents()
    emit('notify', `${student.full_name} removed from roster.`)
  } catch (e: any) {
    emit('notify', `Error: ${e.message}`)
  }
}
</script>

<template>
  <section>
    <div class="flex items-end justify-between gap-5 mb-6">
      <div>
        <h1 class="text-3xl tracking-tight">Student Roster</h1>
        <p class="mt-1.5 text-gray-500">Manage global enrollment, verify identities, and monitor facility access telemetry.</p>
      </div>
      <button class="btn-dark" @click="showAddForm = true">♙ Add Student</button>
    </div>

    <p v-if="loading" class="text-gray-500">Loading roster...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <article v-if="!loading" class="card overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 bg-gray-50 border-b border-line flex gap-2.5 items-center">
        <div class="h-9 border border-gray-300 rounded bg-white flex items-center gap-2.5 px-3 flex-1 max-w-[460px] text-gray-500">
          <span>⌕</span>
          <input v-model="searchQuery" class="border-0 outline-none w-full text-ink" placeholder="Filter by Name, ID, or Department..." />
        </div>
        <select v-model="departmentFilter" class="btn-outline">
          <option v-for="d in departments" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>

      <!-- Table head -->
      <div class="table-head grid-cols-[1.6fr_1fr_1.45fr_1.25fr_1.55fr_0.5fr]">
        <span>Student Name</span><span>Student ID</span><span>Department</span><span>Enrollment Status</span><span>Last Seen</span><span>Action</span>
      </div>

      <!-- Rows -->
      <div
        v-for="student in filteredStudents"
        :key="student.id"
        class="table-row grid-cols-[1.6fr_1fr_1.45fr_1.25fr_1.55fr_0.5fr] text-xs"
      >
        <span class="flex gap-3 items-center">
          <span class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-navy">
            {{ initials(student.full_name) }}
          </span>
          {{ student.full_name }}
        </span>
        <span>{{ student.student_id }}</span>
        <span>{{ student.department }}</span>
        <span>
          <b class="status-tag" :class="statusClass(student.enrollment_status)">● {{ student.enrollment_status }}</b>
        </span>
        <span>{{ formatDate(student.last_seen) }}</span>
        <div class="flex gap-2">
          <button class="font-mono text-[11px] uppercase text-ink hover:text-cyan" @click="viewStudent = student">View</button>
          <button v-if="student.enrollment_status !== 'Verified'" class="font-mono text-[11px] uppercase text-cyan hover:underline" @click="handleVerify(student)">Verify</button>
          <button class="font-mono text-[11px] uppercase text-danger hover:underline" @click="handleDelete(student)">Del</button>
        </div>
      </div>

      <p v-if="filteredStudents.length === 0" class="p-6 text-center text-gray-400">No students found.</p>

      <!-- Footer -->
      <div class="p-4 flex justify-between items-center text-gray-500">
        Showing <b class="text-ink mx-1">{{ filteredStudents.length }}</b> of {{ students.length }} entries
      </div>
    </article>

    <!-- Add student modal -->
    <BaseModal
      :show="showAddForm"
      title="Add New Student"
      message="Enter the student's details to enroll them in the system."
      :button-text="addingStudent ? 'Adding...' : 'Add Student'"
      @close="showAddForm = false"
      @confirm="handleAddStudent"
    >
      <template #default>
        <div class="text-left">
          <label class="block font-mono text-[11px] tracking-wide mt-4">
            STUDENT ID
            <input v-model="newStudent.student_id" type="text" class="input-field mt-2" placeholder="e.g. STU-8829-XR" />
          </label>
          <label class="block font-mono text-[11px] tracking-wide mt-4">
            FULL NAME
            <input v-model="newStudent.full_name" type="text" class="input-field mt-2" placeholder="e.g. Jane Doe" />
          </label>
          <label class="block font-mono text-[11px] tracking-wide mt-4">
            EMAIL
            <input v-model="newStudent.email" type="email" class="input-field mt-2" placeholder="e.g. jane@university.edu" />
          </label>
          <label class="block font-mono text-[11px] tracking-wide mt-4">
            DEPARTMENT
            <input v-model="newStudent.department" type="text" class="input-field mt-2" placeholder="e.g. Computer Science" />
          </label>
        </div>
      </template>
    </BaseModal>

    <!-- View student modal -->
    <BaseModal
      :show="!!viewStudent"
      :title="viewStudent?.full_name || 'Student'"
      :message="`ID: ${viewStudent?.student_id || ''} • ${viewStudent?.department || ''} • Status: ${viewStudent?.enrollment_status || ''}`"
      button-text="Close"
      @close="viewStudent = null"
      @confirm="viewStudent = null"
    />
  </section>
</template>
