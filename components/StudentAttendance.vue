<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePortal } from '~/composables/usePortal'
import { useApi } from '~/composables/useApi'
import type { AttendanceRecord, Session, Course } from '~/types/database'

const emit = defineEmits<{
  notify: [message: string]
}>()

const { currentStudent } = usePortal()
const api = useApi()

const attendance = ref<(AttendanceRecord & { sessions: Session & { courses: Course } })[]>([])
const courses = ref<Course[]>([])
const searchQuery = ref('')
const courseFilter = ref('All Courses')
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!currentStudent.value) {
    loading.value = false
    return
  }
  try {
    const [attData, courseData] = await Promise.all([
      api.getAttendanceByStudent(currentStudent.value.id),
      api.getStudentCourses(currentStudent.value.id),
    ])
    attendance.value = attData
    courses.value = courseData
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const courseOptions = computed(() => ['All Courses', ...courses.value.map(c => c.course_name)])

const filteredAttendance = computed(() => {
  return attendance.value.filter(a => {
    const q = searchQuery.value.toLowerCase()
    const courseName = a.sessions?.courses?.course_name || ''
    const matchesSearch = !q || `${a.check_in_time} ${courseName}`.toLowerCase().includes(q)
    const matchesCourse = courseFilter.value === 'All Courses' || courseName === courseFilter.value
    return matchesSearch && matchesCourse
  })
})

const globalRate = computed(() => {
  if (attendance.value.length === 0) return '0'
  const present = attendance.value.filter(a => a.status === 'Present').length
  return ((present / attendance.value.length) * 100).toFixed(1)
})

const statusClass = (status: string) => {
  if (status === 'Present') return 'bg-cyan-light/20 text-cyan-dark border-cyan-light'
  if (status === 'Absent') return 'bg-red-50 text-danger border-red-300'
  return 'bg-gray-100 text-gray-600 border-gray-300'
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// Build trend chart from real data
const trendPoints = computed(() => {
  if (attendance.value.length === 0) return []
  const recent = attendance.value.slice(0, 6).reverse()
  return recent.map((r, i) => {
    const x = 18 + (i * (562 / Math.max(recent.length - 1, 1)))
    const y = 235 - (r.status === 'Present' ? (Number(r.confidence_score || 90) / 100) * 180 : 20)
    return { x, y }
  })
})

const trendPath = computed(() => {
  if (trendPoints.value.length < 2) return ''
  let path = `M${trendPoints.value[0].x} ${trendPoints.value[0].y}`
  for (let i = 1; i < trendPoints.value.length; i++) {
    const cp1x = trendPoints.value[i - 1].x + (trendPoints.value[i].x - trendPoints.value[i - 1].x) / 2
    const cp1y = trendPoints.value[i - 1].y
    path += ` C${cp1x} ${cp1y} ${cp1x} ${trendPoints.value[i].y} ${trendPoints.value[i].x} ${trendPoints.value[i].y}`
  }
  return path
})

const trendAreaPath = computed(() => {
  if (!trendPath.value) return ''
  return trendPath.value + ` L580 235 L18 235 Z`
})
</script>

<template>
  <section>
    <div class="flex items-end justify-between gap-5 mb-6">
      <div>
        <h1 class="text-3xl tracking-tight">My Attendance</h1>
        <p class="mt-1.5 text-gray-500">Detailed logging and biometric recognition telemetry for current semester.</p>
      </div>
    </div>

    <p v-if="loading" class="text-gray-500">Loading attendance data...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading">
      <!-- Top layout -->
      <div class="grid grid-cols-[1.7fr_0.8fr] gap-6 mb-6">
        <!-- Trend chart -->
        <article class="card overflow-hidden">
          <div class="h-16 border-b border-line px-6 flex items-center justify-between">
            <h2 class="text-xl">Attendance Trends</h2>
            <span class="font-mono text-xs flex items-center gap-1.5">
              <i class="w-3 h-3 bg-cyan rounded-full" /> Present
              <i class="w-3 h-3 bg-danger rounded-full ml-3" /> Absent
            </span>
          </div>
          <div class="h-[300px] mt-3 relative border border-gray-200" style="background: repeating-linear-gradient(to bottom, #fff 0, #fff 58px, #e6e9ec 59px);">
            <svg v-if="trendPath" viewBox="0 0 600 260" preserveAspectRatio="none" class="w-full h-full">
              <path :d="trendAreaPath" fill="#def7fb" stroke="none" />
              <path :d="trendPath" fill="none" stroke="#08c5ec" stroke-width="4" />
              <circle v-for="(p, i) in trendPoints" :key="i" :cx="p.x" :cy="p.y" r="7" fill="#092642" stroke="#fff" stroke-width="2" />
            </svg>
            <p v-else class="text-center text-gray-400 pt-32">No attendance data yet.</p>
          </div>
        </article>

        <aside class="flex flex-col gap-6">
          <!-- Rate card -->
          <article class="bg-navy-light text-white rounded-lg p-7 min-h-[155px]">
            <small class="text-cyan font-mono text-[11px]">GLOBAL RATE</small>
            <strong class="block text-5xl my-4">{{ globalRate }}%</strong>
            <p class="font-mono text-[11px] text-gray-300">Target threshold: 90.0%</p>
          </article>

          <!-- Filters -->
          <article class="card p-6">
            <h2 class="text-xl mb-6">Telemetry Filters</h2>
            <label class="block font-mono text-[10px] mt-4">
              COURSE SELECTION
              <select v-model="courseFilter" class="w-full p-2.5 border border-gray-300 bg-surface mt-2 text-ink">
                <option v-for="c in courseOptions" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>
          </article>
        </aside>
      </div>

      <!-- Session log -->
      <article class="card overflow-hidden">
        <div class="h-16 border-b border-line px-6 flex items-center justify-between">
          <h2 class="text-xl">Session Log</h2>
          <div class="w-[230px] h-9 border border-gray-300 rounded bg-white flex items-center gap-2.5 px-3 text-gray-500">
            <span>⌕</span>
            <input v-model="searchQuery" class="border-0 outline-none w-full text-ink" placeholder="Search logs..." />
          </div>
        </div>

        <div class="table-head grid-cols-[1.2fr_2fr_1fr_1fr]">
          <span>Date / Time</span><span>Course Name</span><span>Status</span><span>Rec. Confidence</span>
        </div>

        <div
          v-for="row in filteredAttendance"
          :key="row.id"
          class="table-row grid-cols-[1.2fr_2fr_1fr_1fr] min-h-[53px] text-xs"
        >
          <span class="font-mono">{{ formatDate(row.check_in_time) }}</span>
          <span>{{ row.sessions?.courses?.course_name || 'Unknown' }}</span>
          <b class="status-tag" :class="statusClass(row.status)">● {{ row.status }}</b>
          <span class="font-mono text-right">{{ row.confidence_score ? Number(row.confidence_score).toFixed(1) + '%' : 'N/A' }}</span>
        </div>

        <p v-if="filteredAttendance.length === 0" class="p-6 text-center text-gray-400">No attendance records found.</p>
      </article>
    </template>
  </section>
</template>
