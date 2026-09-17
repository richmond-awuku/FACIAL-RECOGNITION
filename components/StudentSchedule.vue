<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePortal } from '~/composables/usePortal'
import { useApi } from '~/composables/useApi'
import type { Course, AttendanceRecord } from '~/types/database'

const emit = defineEmits<{
  notify: [message: string]
}>()

const { currentStudent } = usePortal()
const api = useApi()

const courses = ref<Course[]>([])
const attendance = ref<AttendanceRecord[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  if (!currentStudent.value) {
    loading.value = false
    return
  }
  try {
    const [courseData, attData, scheduleData] = await Promise.all([
      api.getStudentCourses(currentStudent.value.id),
      api.getAttendanceByStudent(currentStudent.value.id),
      api.getMySchedule(),
    ])
    courses.value = courseData
    attendance.value = attData
    schedule.value = scheduleData
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

// Compute per-course attendance rate from real records
const courseRate = computed(() => {
  const rates: Record<string, number> = {}
  for (const course of courses.value) {
    const courseRecords = attendance.value.filter(a =>
      a.sessions?.courses?.id === course.id
    )
    if (courseRecords.length > 0) {
      const present = courseRecords.filter(a => a.status === 'Present').length
      rates[course.id] = Math.round((present / courseRecords.length) * 100)
    } else {
      rates[course.id] = 0
    }
  }
  return rates
})

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '16:00']
const schedule = ref<any[]>([])

const courseBlocks = computed(() => {
  return schedule.value.map((item: any) => {
    const course = courses.value.find((c) => String(c.id) === String(item.course || item.course_id))
      || courses.value.find((c) => c.course_code === item.course_code)
    const day = Math.max(0, Math.min(4, Number(item.day_of_week ?? item.day ?? 1) - 1))
    const hour = Number(String(item.start_time || '08:00').slice(0, 2))
    return {
      course: course || { id: item.course || item.course_id, course_code: item.course_code || 'Course', course_name: item.course_name || '' },
      day,
      slot: Math.max(0, timeSlots.findIndex((time) => Number(time.slice(0, 2)) >= hour)),
      rate: course ? courseRate.value[course.id] || 0 : 0,
      room: item.room,
    }
  })
})
</script>

<template>
  <section>
    <div class="flex items-end justify-between gap-5 mb-6">
      <div>
        <h1 class="text-3xl tracking-tight">Course Schedule</h1>
        <p class="mt-1.5 text-gray-500">Current Semester • Biometric Verification Active</p>
      </div>
    </div>

    <p v-if="loading" class="text-gray-500">Loading schedule...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading">
      <div class="grid grid-cols-[1.7fr_0.85fr] gap-7 max-lg:grid-cols-1">
        <!-- Calendar -->
        <article class="card overflow-hidden min-h-[670px] relative">
          <div class="grid grid-cols-[90px_repeat(5,1fr)] min-h-[70px] bg-gray-100 border-b border-line text-center font-mono text-xs pt-4">
            <span class="text-right pr-4 pt-1">Time</span>
            <span v-for="(day, i) in weekDays" :key="i" class="border-l border-line">
              {{ day }}<br /><span class="text-gray-500">Day {{ i + 1 }}</span>
            </span>
          </div>

          <div
            v-for="time in timeSlots"
            :key="time"
            class="grid grid-cols-[90px_repeat(5,1fr)] h-16"
          >
            <span class="text-right pr-4 pt-3 font-mono text-xs border-r border-line">{{ time }}</span>
            <i v-for="i in 5" :key="i" class="border-b border-r border-gray-200" />
          </div>

          <!-- Course blocks positioned on calendar -->
          <div
            v-for="block in courseBlocks"
            :key="block.course.id"
            class="absolute p-2.5 border border-gray-300 bg-gray-100 rounded w-[93px] h-[57px] font-mono text-xs max-md:static max-md:mb-2 max-md:w-full"
            :style="{ left: 107 + block.day * 108 + 'px', top: 70 + block.slot * 64 + 'px' }"
          >
            <strong>{{ block.course.course_code }}</strong>
            <span class="block truncate">{{ block.course.course_name }}</span>
            <small v-if="block.room" class="block truncate">{{ block.room }}</small>
            <b v-if="block.rate > 0" class="text-cyan text-[10px] block mt-0.5">◉ {{ block.rate }}%</b>
          </div>
        </article>

        <!-- Course cards -->
        <aside class="flex flex-col gap-4">
          <article
            v-for="course in courses"
            :key="course.id"
            class="card p-6"
          >
            <div class="flex justify-between items-start gap-2.5">
              <h2 class="text-lg">{{ course.course_code }}: {{ course.course_name }}</h2>
              <b class="bg-gray-100 px-2 py-1.5 font-mono text-[11px] rounded">{{ course.credits }} CR</b>
            </div>
            <p class="font-mono text-xs leading-relaxed min-h-[35px] mt-2">{{ course.professor }} | {{ course.room }}</p>
            <label class="flex justify-between font-mono text-[11px] mt-3">
              Attendance Rate <span>{{ courseRate[course.id] || 0 }}%</span>
            </label>
            <div class="h-2 bg-gray-100 rounded my-2">
              <i class="block h-full rounded bg-cyan" :style="{ width: (courseRate[course.id] || 0) + '%' }" />
            </div>
            <div class="border border-line bg-surface p-3 flex gap-2.5 text-cyan mt-4">
              ◉ <span class="text-ink">
                <strong class="block">Biometrically Verified</strong>
                <small class="text-gray-500 font-mono text-[10px] block mt-1">Active auto-check-in enabled</small>
              </span>
            </div>
          </article>
          <p v-if="courses.length === 0" class="text-center text-gray-400 p-6">No courses enrolled.</p>
        </aside>
      </div>
    </template>
  </section>
</template>
