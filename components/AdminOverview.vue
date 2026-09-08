<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import type { Student, Session, AttendanceRecord } from '~/types/database'

const emit = defineEmits<{
  startSession: []
  viewLog: []
}>()

const api = useApi()

const students = ref<Student[]>([])
const activeSessions = ref<(Session & { courses: any })[]>([])
const recentRecords = ref<(AttendanceRecord & { students: Student })[]>([])
const loading = ref(true)
const error = ref('')

const totalRoster = computed(() => students.value.length)
const activeCount = computed(() => activeSessions.value.length)

const todayAttendance = computed(() => {
  if (recentRecords.value.length === 0) return 0
  const present = recentRecords.value.filter(r => r.status === 'Present').length
  return Math.round((present / Math.max(recentRecords.value.length, 1)) * 100)
})

onMounted(async () => {
  try {
    const [studentData, sessionData] = await Promise.all([
      api.getStudents(),
      api.getActiveSessions(),
    ])
    students.value = studentData
    activeSessions.value = sessionData

    if (sessionData.length > 0) {
      const records = await api.getAttendanceBySession(sessionData[0].id)
      recentRecords.value = ((records || []) as any).slice(0, 5)
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
})

const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

const formatTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const formatConfidence = (score: number | null) => {
  if (score === null) return 'N/A'
  return `${Number(score).toFixed(1)}%`
}
</script>

<template>
  <section>
    <div class="flex items-end justify-between gap-5 mb-6">
      <div>
        <h1 class="text-3xl tracking-tight leading-tight">Overview</h1>
        <p class="mt-1.5 text-gray-500">System status and live metrics for today.</p>
      </div>
      <span class="font-mono text-[11px] text-gray-600 flex items-center gap-1.5">
        <i class="w-2 h-2 bg-cyan rounded-full inline-block" /> SYSTEM ONLINE
      </span>
    </div>

    <p v-if="loading" class="text-gray-500">Loading system data...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading">
      <!-- Metric cards -->
      <div class="grid grid-cols-3 gap-5 mb-6">
        <article class="card p-6 min-h-[245px] flex flex-col justify-between">
          <div class="font-mono text-xs flex justify-between">
            Total Roster <span class="text-gray-400 text-lg">♙</span>
          </div>
          <strong class="text-5xl tracking-tight">{{ totalRoster }}</strong>
          <p class="text-sm text-gray-600">Enrolled across all sessions</p>
        </article>

        <article class="card p-6 min-h-[245px] flex flex-col justify-between">
          <div class="font-mono text-xs flex justify-between">
            Today's Attendance <span class="text-cyan text-lg">⌁</span>
          </div>
          <strong class="text-5xl tracking-tight">{{ todayAttendance }}<em class="text-base not-italic ml-1.5">%</em></strong>
          <p class="text-sm text-cyan">Live recognition rate</p>
        </article>

        <article class="card p-6 min-h-[245px] flex flex-col justify-between">
          <div class="font-mono text-xs flex justify-between">
            Active Sessions <span class="text-gray-400 text-lg">◌</span>
          </div>
          <strong class="text-5xl tracking-tight">{{ String(activeCount).padStart(2, '0') }}</strong>
          <p class="text-sm text-gray-600">Currently scanning</p>
        </article>

        <article class="bg-navy-light text-white p-6 rounded-lg min-h-[245px] flex flex-col justify-between relative overflow-hidden">
          <small class="text-cyan font-mono">▣ Sentinel Engine</small>
          <strong class="text-xl">Initialize Scanner</strong>
          <p class="text-gray-300 leading-relaxed text-sm">
            Connect to lecture hall camera feeds to begin attendance verification.
          </p>
          <button
            class="text-cyan border border-cyan bg-transparent py-2.5 rounded font-mono text-xs hover:bg-cyan/10 transition-colors"
            @click="$emit('startSession')"
          >
            ϟ Connect Feed
          </button>
        </article>
      </div>

      <!-- Recent Activity -->
      <article class="card overflow-hidden">
        <div class="h-16 border-b border-line px-6 flex items-center justify-between">
          <h2 class="text-xl">Recent Activity</h2>
          <button class="text-ink hover:text-cyan" @click="$emit('viewLog')">View Log →</button>
        </div>

        <div class="table-head grid-cols-[55px_2fr_1.2fr_1.25fr_0.6fr]">
          <span>Status</span><span>Student Profile</span><span>System ID</span><span>Timestamp</span><span>Confidence</span>
        </div>

        <div
          v-for="(record, index) in recentRecords"
          :key="record.id"
          class="table-row grid-cols-[55px_2fr_1.2fr_1.25fr_0.6fr] font-mono text-xs"
        >
          <span class="w-2 h-2 rounded-full inline-block" :class="record.status === 'Present' ? 'bg-cyan' : 'bg-gray-400'" />
          <span class="flex gap-3 items-center font-sans text-sm">
            <span class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-navy">
              {{ initials(record.students?.full_name || '?') }}
            </span>
            {{ record.students?.full_name || 'Unknown' }}
          </span>
          <span>{{ record.students?.student_id || 'N/A' }}</span>
          <span>{{ formatTime(record.check_in_time) }}</span>
          <span class="border border-cyan-light bg-cyan-light/20 text-cyan-dark rounded px-2 py-1 font-mono text-[11px] w-max">
            {{ formatConfidence(record.confidence_score) }}
          </span>
        </div>

        <p v-if="recentRecords.length === 0" class="p-6 text-center text-gray-400">No recent activity.</p>
      </article>
    </template>
  </section>
</template>
