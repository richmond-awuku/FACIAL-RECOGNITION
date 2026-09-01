<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePortal } from '~/composables/usePortal'
import { useDatabase } from '~/composables/useDatabase'
import type { AttendanceRecord, Session, Course } from '~/types/database'

const emit = defineEmits<{
  notify: [message: string]
  navigate: [view: string]
}>()

const { currentStudent } = usePortal()
const { getAttendanceByStudent, getStudentCourses } = useDatabase()

const attendance = ref<(AttendanceRecord & { sessions: Session & { courses: Course } })[]>([])
const courses = ref<Course[]>([])
const loading = ref(true)
const error = ref('')
const showManualOverride = ref(false)

onMounted(async () => {
  if (!currentStudent.value) {
    loading.value = false
    return
  }
  try {
    const [attData, courseData] = await Promise.all([
      getAttendanceByStudent(currentStudent.value.id),
      getStudentCourses(currentStudent.value.id),
    ])
    attendance.value = attData
    courses.value = courseData
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const initials = computed(() => {
  const name = currentStudent.value?.full_name || ''
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
})

const formatScanTime = (iso: string, index: number) => {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  if (isToday) return `TODAY, ${timeStr}`
  if (isYesterday) return `YESTERDAY, ${timeStr}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + timeStr
}

const recentAttendance = computed(() => attendance.value.slice(0, 4))
</script>

<template>
  <section>
    <div class="mb-6">
      <h1 class="text-4xl tracking-tight">Overview</h1>
      <p class="mt-2 text-gray-500">System Status: <span class="text-cyan font-mono">ONLINE_SECURE</span></p>
    </div>

    <p v-if="loading" class="text-gray-500">Loading your data...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading && currentStudent">
      <!-- Top grid -->
      <div class="grid grid-cols-[2fr_0.95fr] gap-6 my-8">
        <!-- Identity card -->
        <article class="card flex items-center gap-6 p-6 relative overflow-hidden min-h-[204px]">
          <div class="absolute -right-12 -top-20 w-[290px] h-[290px] rounded-full bg-cyan-light/10"></div>
          <div class="relative z-10 w-[125px] h-[125px] rounded-full flex items-center justify-center text-3xl font-extrabold text-white border-[3px] border-gray-200" style="background: linear-gradient(145deg, #d5e8ef, #5f8092);">
            {{ initials }}
          </div>
          <div class="relative z-10">
            <h2 class="text-xl mb-1.5">{{ currentStudent.full_name }}</h2>
            <p class="font-mono mb-4">▣ {{ currentStudent.student_id }}</p>
            <b class="status-tag" :class="currentStudent.face_enrolled ? 'status-verified' : 'status-pending'">
              ◉ {{ currentStudent.face_enrolled ? 'Face Enrollment Verified' : 'Face Enrollment Pending' }}
            </b>
          </div>
          <div class="relative z-10 ml-auto w-[106px] h-[106px] rounded-full border-cyan flex flex-col justify-center items-center" style="border-width: 9px;">
            <strong class="text-2xl">{{ Number(currentStudent.attendance_rate).toFixed(0) }}%</strong>
            <span class="font-mono text-[11px]">ATTENDANCE</span>
          </div>
        </article>

        <!-- Actions -->
        <article class="card p-6 flex flex-col gap-3.5">
          <small class="font-mono text-[11px]">SYSTEM ACTIONS</small>
          <button class="bg-white border border-gray-300 p-3 text-ink hover:bg-gray-50 transition-colors" @click="showManualOverride = true">
            ⌾ Request Manual Override
          </button>
          <button class="bg-white border border-gray-300 p-3 text-danger hover:bg-red-50 transition-colors" @click="$emit('notify', 'Issue report form opened.')">
            ⚠ Report Issue
          </button>
        </article>
      </div>

      <!-- Bottom grid -->
      <div class="grid grid-cols-2 gap-6">
        <!-- Today's schedule -->
        <article class="card overflow-hidden">
          <div class="bg-gray-100 min-h-[46px] px-6 flex items-center">
            <h3 class="font-mono text-xs uppercase">▣ My Courses</h3>
          </div>
          <div class="table-head grid-cols-[0.7fr_1.8fr_0.9fr]">
            <span>Code</span><span>Course</span><span>Credits</span>
          </div>
          <div
            v-for="course in courses"
            :key="course.id"
            class="table-row grid-cols-[0.7fr_1.8fr_0.9fr] min-h-[68px]"
          >
            <span class="font-mono">{{ course.course_code }}</span>
            <strong>{{ course.course_name }}<small class="block text-gray-500 font-mono text-[11px] mt-1">{{ course.professor }} | {{ course.room }}</small></strong>
            <span>{{ course.credits }} CR</span>
          </div>
          <p v-if="courses.length === 0" class="p-6 text-center text-gray-400">No courses enrolled.</p>
        </article>

        <!-- Telemetry -->
        <article class="card pb-2.5">
          <div class="bg-gray-100 min-h-[46px] px-6 flex items-center">
            <h3 class="font-mono text-xs uppercase">⟲ Telemetry: Recent Scans</h3>
          </div>
          <div
            v-for="(scan, index) in recentAttendance"
            :key="scan.id"
            class="flex gap-4 my-5 mx-5 relative"
          >
            <span class="w-3 h-3 border-2 border-cyan rounded-full bg-white z-10 flex-shrink-0 mt-1" />
            <div v-if="index < recentAttendance.length - 1" class="absolute left-1.5 top-4 border-l border-gray-300 h-[61px]"></div>
            <div class="flex-1 border border-line p-2.5 px-3 flex flex-col gap-2">
              <small class="font-mono text-[10px] text-gray-500">
                {{ formatScanTime(scan.check_in_time, index) }}
                <b class="float-right font-normal">CONFIDENCE: {{ scan.confidence_score ? Number(scan.confidence_score).toFixed(1) + '%' : 'N/A' }}</b>
              </small>
              <strong>{{ scan.sessions?.courses?.course_name || 'Unknown Course' }}</strong>
              <em class="text-cyan font-mono text-[10px] not-italic">{{ scan.status === 'Present' ? 'MATCH FOUND' : scan.status.toUpperCase() }}</em>
            </div>
          </div>
          <p v-if="recentAttendance.length === 0" class="p-6 text-center text-gray-400">No scan history yet.</p>
        </article>
      </div>

      <!-- Manual override modal -->
      <BaseModal
        :show="showManualOverride"
        title="Request Manual Override"
        message="Send a secure request to an administrator to review your attendance record."
        button-text="Send Request"
        @close="showManualOverride = false"
        @confirm="showManualOverride = false; $emit('notify', 'Manual override request sent.')"
      />
    </template>
  </section>
</template>
