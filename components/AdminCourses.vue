<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { usePortal } from '~/composables/usePortal'
import type { Course, Student } from '~/types/database'

const emit = defineEmits<{ notify: [message: string] }>()
const api = useApi()
const { isAdmin } = usePortal()

const courses = ref<any[]>([])
const students = ref<Student[]>([])
const loading = ref(true)
const error = ref('')

const expandedId = ref<string | number | null>(null)
const savingEnrollment = ref(false)
const studentFilter = ref('')
const draftStudents = ref<Set<number>>(new Set())

// New course modal
const showAdd = ref(false)
const adding = ref(false)
const newCourse = ref({ code: '', name: '', credits: 3, lecturer: '' })

// Schedule slot draft (per expanded course)
const slots = ref<any[]>([])
const slotsLoading = ref(false)
const newSlot = ref({ day_of_week: 1, start_time: '09:00', end_time: '10:30', room: '' })
const addingSlot = ref(false)

const DAYS = [
  { v: 1, label: 'Monday' }, { v: 2, label: 'Tuesday' }, { v: 3, label: 'Wednesday' },
  { v: 4, label: 'Thursday' }, { v: 5, label: 'Friday' }, { v: 6, label: 'Saturday' }, { v: 7, label: 'Sunday' },
]
const dayLabel = (v: number) => DAYS.find((d) => d.v === v)?.label || `Day ${v}`

onMounted(load)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [c, s] = await Promise.all([api.getCourses(), api.getStudents()])
    courses.value = c
    students.value = s
  } catch (e: any) {
    error.value = e?.message || 'Unable to load courses.'
  } finally {
    loading.value = false
  }
}

const filteredStudents = computed(() => {
  const q = studentFilter.value.toLowerCase().trim()
  if (!q) return students.value
  return students.value.filter((s) => `${s.full_name} ${s.student_id} ${s.department}`.toLowerCase().includes(q))
})

async function toggleExpand(course: any) {
  if (expandedId.value === course.id) {
    expandedId.value = null
    return
  }
  expandedId.value = course.id
  studentFilter.value = ''
  draftStudents.value = new Set((course.students || []).map((n: any) => Number(n)))
  newSlot.value = { day_of_week: 1, start_time: '09:00', end_time: '10:30', room: course.room || '' }
  slots.value = Array.isArray(course.schedule_slots) ? [...course.schedule_slots] : []
  slotsLoading.value = true
  try {
    slots.value = await api.getScheduleSlots(course.id)
  } catch {
    /* keep whatever came on the course object */
  } finally {
    slotsLoading.value = false
  }
}

function toggleStudent(id: number) {
  const set = draftStudents.value
  if (set.has(id)) set.delete(id)
  else set.add(id)
  draftStudents.value = new Set(set)
}

async function saveEnrollment(course: any) {
  savingEnrollment.value = true
  try {
    const updated = await api.setCourseStudents(course.id, [...draftStudents.value])
    const i = courses.value.findIndex((c) => c.id === course.id)
    if (i !== -1) courses.value[i] = { ...courses.value[i], students: updated.students ?? [...draftStudents.value] }
    emit('notify', `Enrollment updated for ${course.course_code}.`)
  } catch (e: any) {
    emit('notify', `Error: ${e?.message || 'could not update enrollment'}`)
  } finally {
    savingEnrollment.value = false
  }
}

async function handleAdd() {
  if (!newCourse.value.code.trim() || !newCourse.value.name.trim()) {
    emit('notify', 'Course code and name are required.')
    return
  }
  adding.value = true
  try {
    await api.createCourse({
      code: newCourse.value.code.trim(),
      name: newCourse.value.name.trim(),
      credits: Number(newCourse.value.credits) || 3,
      lecturer: newCourse.value.lecturer,
    })
    showAdd.value = false
    newCourse.value = { code: '', name: '', credits: 3, lecturer: '' }
    await load()
    emit('notify', 'Course created.')
  } catch (e: any) {
    emit('notify', `Error creating course: ${e?.message || 'failed'}`)
  } finally {
    adding.value = false
  }
}

async function handleDeleteCourse(course: any) {
  if (!window.confirm(`Delete ${course.course_code} — ${course.course_name}? This cannot be undone.`)) return
  try {
    await api.deleteCourse(course.id)
    courses.value = courses.value.filter((c) => c.id !== course.id)
    if (expandedId.value === course.id) expandedId.value = null
    emit('notify', 'Course deleted.')
  } catch (e: any) {
    emit('notify', `Error: ${e?.message || 'could not delete course'}`)
  }
}

async function handleAddSlot(course: any) {
  if (!newSlot.value.room.trim()) {
    emit('notify', 'Enter a room for the schedule slot.')
    return
  }
  addingSlot.value = true
  try {
    await api.createScheduleSlot({ course: course.id, ...newSlot.value })
    slots.value = await api.getScheduleSlots(course.id)
    newSlot.value = { day_of_week: 1, start_time: '09:00', end_time: '10:30', room: course.room || '' }
    emit('notify', 'Schedule slot added.')
  } catch (e: any) {
    emit('notify', `Error: ${e?.payload?.non_field_errors?.[0] || e?.message || 'could not add slot'}`)
  } finally {
    addingSlot.value = false
  }
}

async function handleDeleteSlot(course: any, slot: any) {
  try {
    await api.deleteScheduleSlot(slot.id)
    slots.value = slots.value.filter((s) => s.id !== slot.id)
    emit('notify', 'Schedule slot removed.')
  } catch (e: any) {
    emit('notify', `Error: ${e?.message || 'could not remove slot'}`)
  }
}

const fmtTime = (t: string) => (t ? String(t).slice(0, 5) : '')
</script>

<template>
  <section>
    <div class="flex items-end justify-between gap-5 mb-6">
      <div>
        <h1 class="text-3xl tracking-tight">Courses</h1>
        <p class="mt-1.5 text-gray-500">Create courses, enrol students, and define weekly schedule slots.</p>
      </div>
      <button class="btn-dark" @click="showAdd = true">＋ New Course</button>
    </div>

    <p v-if="loading" class="text-gray-500">Loading courses...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <div v-if="!loading" class="space-y-4">
      <p v-if="courses.length === 0" class="card p-10 text-center text-gray-400">
        No courses yet. Use “New Course” to add one.
      </p>

      <article v-for="course in courses" :key="course.id" class="card overflow-hidden">
        <!-- Summary row -->
        <div class="p-5 flex items-center gap-4">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <strong class="text-lg">{{ course.course_code }}</strong>
              <span class="text-gray-500 truncate">{{ course.course_name }}</span>
            </div>
            <p class="font-mono text-[11px] text-gray-500 mt-1">
              {{ course.credits }} CR ·
              {{ (course.students?.length || 0) }} student{{ (course.students?.length || 0) === 1 ? '' : 's' }} ·
              {{ (course.schedule_slots?.length || 0) }} slot{{ (course.schedule_slots?.length || 0) === 1 ? '' : 's' }}
              <template v-if="course.professor"> · {{ course.professor }}</template>
            </p>
          </div>
          <button class="btn-outline" @click="toggleExpand(course)">
            {{ expandedId === course.id ? 'Close' : 'Manage' }}
          </button>
          <button v-if="isAdmin" class="font-mono text-[11px] uppercase text-danger hover:underline" @click="handleDeleteCourse(course)">Delete</button>
        </div>

        <!-- Manage panel -->
        <div v-if="expandedId === course.id" class="border-t border-line bg-gray-50 p-5 grid lg:grid-cols-2 gap-6">
          <!-- Enrolment -->
          <div>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Enrolled students</h3>
              <span class="font-mono text-xs text-gray-500">{{ draftStudents.size }} selected</span>
            </div>
            <input v-model="studentFilter" class="input-field mt-3" placeholder="Filter by name, ID, department..." />
            <div class="mt-3 border border-line rounded-md bg-white max-h-64 overflow-y-auto divide-y divide-line">
              <label
                v-for="s in filteredStudents"
                :key="s.id"
                class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50"
              >
                <input type="checkbox" class="accent-cyan" :checked="draftStudents.has(Number(s.id))" @change="toggleStudent(Number(s.id))" />
                <span class="min-w-0">
                  <strong class="block text-sm truncate">{{ s.full_name }}</strong>
                  <small class="font-mono text-[11px] text-gray-500">{{ s.student_id }} · {{ s.department }}</small>
                </span>
              </label>
              <p v-if="filteredStudents.length === 0" class="px-3 py-4 text-center text-sm text-gray-400">No matching students.</p>
            </div>
            <button class="btn-dark mt-3" :disabled="savingEnrollment" @click="saveEnrollment(course)">
              {{ savingEnrollment ? 'Saving...' : 'Save Enrolment' }}
            </button>
          </div>

          <!-- Schedule -->
          <div>
            <h3 class="font-semibold">Weekly schedule</h3>
            <p v-if="slotsLoading" class="text-sm text-gray-500 mt-3">Loading slots...</p>
            <div v-else class="mt-3 space-y-2">
              <div
                v-for="slot in slots"
                :key="slot.id"
                class="flex items-center gap-3 bg-white border border-line rounded-md px-3 py-2 text-sm"
              >
                <span class="font-medium w-24">{{ slot.day_of_week_display || dayLabel(slot.day_of_week) }}</span>
                <span class="font-mono text-xs text-gray-600">{{ fmtTime(slot.start_time) }}–{{ fmtTime(slot.end_time) }}</span>
                <span class="text-gray-500 flex-1 truncate">{{ slot.room }}</span>
                <button class="text-danger text-[11px] font-mono uppercase hover:underline" @click="handleDeleteSlot(course, slot)">Remove</button>
              </div>
              <p v-if="slots.length === 0" class="text-sm text-gray-400">No slots defined.</p>
            </div>

            <div class="mt-4 bg-white border border-line rounded-md p-3 grid grid-cols-2 gap-2">
              <label class="text-[10px] font-mono uppercase text-gray-500">Day
                <select v-model.number="newSlot.day_of_week" class="input-field mt-1">
                  <option v-for="d in DAYS" :key="d.v" :value="d.v">{{ d.label }}</option>
                </select>
              </label>
              <label class="text-[10px] font-mono uppercase text-gray-500">Room
                <input v-model="newSlot.room" class="input-field mt-1" placeholder="Room A1" />
              </label>
              <label class="text-[10px] font-mono uppercase text-gray-500">Start
                <input v-model="newSlot.start_time" type="time" class="input-field mt-1" />
              </label>
              <label class="text-[10px] font-mono uppercase text-gray-500">End
                <input v-model="newSlot.end_time" type="time" class="input-field mt-1" />
              </label>
              <button class="btn-outline col-span-2 mt-1" :disabled="addingSlot" @click="handleAddSlot(course)">
                {{ addingSlot ? 'Adding...' : '＋ Add slot' }}
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <!-- New course modal -->
    <BaseModal
      :show="showAdd"
      title="New Course"
      message="Define the course. You can enrol students and add schedule slots after it is created."
      :button-text="adding ? 'Creating...' : 'Create Course'"
      @close="showAdd = false"
      @confirm="handleAdd"
    >
      <template #default>
        <div class="text-left space-y-4">
          <label class="block font-mono text-[11px] tracking-wide">
            COURSE CODE
            <input v-model="newCourse.code" class="input-field mt-2" placeholder="e.g. CS401" />
          </label>
          <label class="block font-mono text-[11px] tracking-wide">
            COURSE NAME
            <input v-model="newCourse.name" class="input-field mt-2" placeholder="e.g. Advanced Machine Learning" />
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="block font-mono text-[11px] tracking-wide">
              CREDITS
              <input v-model.number="newCourse.credits" type="number" min="1" max="12" class="input-field mt-2" />
            </label>
            <label class="block font-mono text-[11px] tracking-wide">
              LECTURER USER ID <span class="text-gray-400">(optional)</span>
              <input v-model="newCourse.lecturer" class="input-field mt-2" placeholder="e.g. 2" />
            </label>
          </div>
        </div>
      </template>
    </BaseModal>
  </section>
</template>
