<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useApi } from "~/composables/useApi";
import type { Student, Session, AttendanceRecord } from "~/types/database";

const emit = defineEmits<{
  startSession: [];
  viewLog: [];
}>();

const api = useApi();

const students = ref<Student[]>([]);
const activeSessions = ref<(Session & { courses: any })[]>([]);
const recentRecords = ref<(AttendanceRecord & { students: Student })[]>([]);
const todayCheckIns = ref(0);
const loading = ref(true);
const error = ref("");

const totalRoster = computed(() => students.value.length);
const activeCount = computed(() => activeSessions.value.length);

onMounted(async () => {
  try {
    const [studentData, sessionData, attendanceRecords] = await Promise.all([
      api.getStudents(),
      api.getActiveSessions(),
      api.getAttendanceRecords(),
    ]);
    students.value = studentData;
    activeSessions.value = sessionData;
    const today = new Date().toLocaleDateString();
    todayCheckIns.value = attendanceRecords.filter((record) => {
      const timestamp = record.check_in_time || record.created_at;
      return record.status === "Present" &&
        timestamp &&
        new Date(timestamp).toLocaleDateString() === today;
    }).length;

    if (sessionData.length > 0) {
      const records = await api.getAttendanceBySession(sessionData[0].id);
      recentRecords.value = ((records || []) as any).slice(0, 5);
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatTime = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const formatConfidence = (score: number | null) => {
  if (score === null) return "N/A";
  return `${Number(score).toFixed(1)}%`;
};
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-end justify-between gap-5">
      <div>
        <h1 class="text-[42px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Overview</h1>
        <p class="mt-1.5 text-[#64748b] text-[15px]">
          System status and live metrics for today.
        </p>
      </div>
      <span class="font-mono text-[11px] uppercase tracking-[0.18em] text-[#4b5563]">
        {{ loading ? 'Loading live data' : error ? 'Live data unavailable' : 'Live data loaded' }}
      </span>
    </div>

    <p v-if="loading" class="text-gray-500">Loading system data...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.1fr_1.1fr_1.1fr_1.35fr] xl:gap-5">
        <article class="overview-card">
          <div class="flex items-start justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">
            <span>Total roster</span>
            <span class="text-lg text-[#94a3b8]">▣</span>
          </div>
          <div>
            <div class="overview-stat">{{ totalRoster }}</div>
            <p class="mt-2 text-[15px] text-[#64748b]">Enrolled across all sessions</p>
          </div>
        </article>

        <article class="overview-card">
          <div class="flex items-start justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">
            <span>Today's check-ins</span>
            <span class="text-lg text-[#2fb3d4]">↗</span>
          </div>
          <div>
            <div class="overview-stat flex items-end gap-2">
              <span>{{ todayCheckIns }}</span>
            </div>
            <p class="mt-2 text-[15px] text-[#64748b]">Attendance records returned today</p>
          </div>
        </article>

        <article class="overview-card">
          <div class="flex items-start justify-between text-[11px] font-mono uppercase tracking-[0.14em] text-[#64748b]">
            <span>Active sessions</span>
            <span class="text-lg text-[#94a3b8]">◌</span>
          </div>
          <div>
            <div class="overview-stat">{{ String(activeCount).padStart(2, "0") }}</div>
            <p class="mt-2 text-[15px] text-[#64748b]">Currently scanning</p>
          </div>
        </article>

        <article class="col-span-1 rounded-[18px] bg-[#0e1f31] p-6 text-white shadow-inner shadow-[#0e1f31]">
          <div class="mb-8 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] text-[#88dff3]">
            <span class="text-lg">▣</span>
            <span>Sentinel Engine</span>
          </div>
          <div class="space-y-3">
            <h3 class="text-[32px] font-semibold tracking-[-0.06em]">Initialize Scanner</h3>
            <p class="text-[15px] leading-relaxed text-[#d7ebf4]">
              Connect to lecture hall camera feeds to begin attendance verification.
            </p>
            <button
              class="mt-4 inline-flex w-full items-center justify-center gap-2 border border-[#6dd5ee] bg-transparent px-4 py-3 text-[11px] font-mono uppercase tracking-[0.18em] text-[#6dd5ee] transition hover:bg-[#1a2e44]"
              @click="$emit('startSession')"
            >
              <span>ϟ</span> Connect Feed
            </button>
          </div>
        </article>
      </div>

      <article class="panel-surface overflow-hidden">
        <div class="flex h-16 items-center justify-between border-b border-[#e5e7eb] px-6">
          <h2 class="text-[31px] font-semibold tracking-[-0.06em] text-[#1d2b3a]">Recent Activity</h2>
          <button class="text-[14px] font-medium text-[#1f2d3d] hover:text-[#2fb3d4]" @click="$emit('viewLog')">
            View Log →
          </button>
        </div>

        <div class="overflow-x-auto">
        <table class="activity-table min-w-[680px]">
          <thead>
            <tr>
              <th class="w-[11%]">Status</th>
              <th class="w-[30%]">Student Profile</th>
              <th class="w-[18%]">System ID</th>
              <th class="w-[18%]">Timestamp</th>
              <th class="w-[12%]">Confidence</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in recentRecords" :key="record.id" class="activity-row">
              <td>
                <span class="inline-block h-2.5 w-2.5 rounded-full" :class="record.status === 'Present' ? 'bg-[#2fb3d4]' : 'bg-[#94a3b8]'" />
              </td>
              <td>
                <div class="flex items-center gap-3">
                  <span class="avatar-pill">{{ initials(record.students?.full_name || "?") }}</span>
                  <span class="text-[15px] font-medium text-[#1f2d3d]">{{ record.students?.full_name || "Unknown" }}</span>
                </div>
              </td>
              <td class="font-mono text-[13px] text-[#334155]">{{ record.students?.student_id || "N/A" }}</td>
              <td class="font-mono text-[13px] text-[#64748b]">{{ formatTime(record.check_in_time) }}</td>
              <td>
                <span class="inline-flex rounded border border-[#cbe6f1] bg-[#e9f8ff] px-2 py-1 text-[11px] font-mono text-[#1a6f8f]">
                  {{ formatConfidence(record.confidence_score) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        </div>

        <p v-if="recentRecords.length === 0" class="p-6 text-center text-gray-400">
          No recent activity.
        </p>
      </article>
    </template>
  </section>
</template>
