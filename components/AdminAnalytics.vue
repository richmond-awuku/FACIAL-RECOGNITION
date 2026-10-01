<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useApi } from "~/composables/useApi";
import type { Student, Session, AttendanceRecord } from "~/types/database";

const emit = defineEmits<{
  notify: [message: string];
}>();

const api = useApi();

const students = ref<Student[]>([]);
const allSessions = ref<(Session & { courses: any })[]>([]);
const allRecords = ref<
  (AttendanceRecord & {
    students: Student;
    sessions: Session & { courses: any };
  })[]
>([]);
const searchQuery = ref("");
const departmentFilter = ref("All Departments");
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const studentData = await api.getStudents();
    students.value = studentData;

    const sessions = await api.getAllSessions();
    allSessions.value = (sessions || []) as any;

    const records = await api.getAttendanceRecords();
    allRecords.value = (records || []) as any;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

const allAtRiskStudents = computed(() => {
  return students.value
    .filter((s) => Number(s.attendance_rate) < 70)
    .filter(
      (s) =>
        departmentFilter.value === "All Departments" ||
        s.department === departmentFilter.value,
    )
    .filter(
      (s) =>
        !searchQuery.value ||
        s.student_id.toLowerCase().includes(searchQuery.value.toLowerCase()),
    );
});
const atRiskStudents = computed(() => allAtRiskStudents.value.slice(0, 10));

const absenteeismRate = (rate: number) => `${(100 - Number(rate)).toFixed(1)}%`;

const departments = computed(() => {
  const depts = new Set(students.value.map((s) => s.department));
  return ["All Departments", ...Array.from(depts)];
});

// Compute department-wise average attendance
const deptData = computed(() => {
  const deptMap: Record<string, { total: number; count: number }> = {};

  for (const s of students.value) {
    const department = s.department || "Unknown";

    if (!deptMap[department]) {
      deptMap[department] = {
        total: 0,
        count: 0,
      };
    }

    deptMap[department]!.total += Number(s.attendance_rate);
    deptMap[department]!.count++;
  }

  return Object.entries(deptMap).map(([label, { total, count }]) => ({
    label: label.slice(0, 3).toUpperCase(),
    value: count > 0 ? Math.round(total / count) : 0,
  }));
});

// Attendance records are check-ins, so show counts rather than an unsupported rate.
const trendData = computed(() => {
  const months: Record<string, number> = {};
  for (const r of allRecords.value) {
    if (!r.check_in_time) continue;
    const month = new Date(r.check_in_time).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    months[month] = (months[month] || 0) + 1;
  }
  return Object.entries(months).map(([month, count]) => ({
    month,
    count,
  }));
});

// Build SVG path from trend data
const trendPath = computed(() => {
  if (trendData.value.length < 2) return "";

  const max = Math.max(...trendData.value.map((item) => item.count), 1);

  const points = trendData.value.map((d, i) => ({
    x: 24 + i * (576 / Math.max(trendData.value.length - 1, 1)),
    y: 230 - (d.count / max) * 180,
  }));

  let path = `M${points[0]!.x} ${points[0]!.y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const curr = points[i]!;

    const cp1x = prev.x + (curr.x - prev.x) / 2;
    const cp1y = prev.y;

    path += ` C${cp1x} ${cp1y} ${cp1x} ${curr.y} ${curr.x} ${curr.y}`;
  }

  return path;
});

const trendAreaPath = computed(() => {
  if (!trendPath.value) return "";
  return trendPath.value + ` L576 230 L24 230 Z`;
});
</script>

<template>
  <section>
    <div class="flex items-center justify-between gap-5 mb-6">
      <div>
        <h1 class="text-3xl tracking-tight">Attendance Analytics</h1>
        <p class="mt-1.5 text-gray-500">
          Comprehensive overview of institutional attendance metrics.
        </p>
      </div>
      <div class="flex gap-2.5 items-center">
        <label class="font-mono text-[10px] uppercase flex flex-col gap-1.5">
          Department
          <select
            v-model="departmentFilter"
            class="border border-gray-300 bg-white px-2 py-2 rounded-md min-w-[130px] text-ink"
          >
            <option v-for="d in departments" :key="d" :value="d">
              {{ d }}
            </option>
          </select>
        </label>
      </div>
    </div>

    <p v-if="loading" class="text-gray-500">Loading analytics...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading">
      <!-- Summary metric -->
      <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
        <article class="card p-6 flex flex-col justify-between min-h-[120px]">
          <small class="font-mono text-xs text-gray-500"
            >ATTENDANCE CHECK-INS</small
          >
          <strong class="text-4xl">{{ allRecords.length }}</strong>
        </article>
        <article class="card p-6 flex flex-col justify-between min-h-[120px]">
          <small class="font-mono text-xs text-gray-500">TOTAL SESSIONS</small>
          <strong class="text-4xl">{{ allSessions.length }}</strong>
        </article>
        <article class="card p-6 flex flex-col justify-between min-h-[120px]">
          <small class="font-mono text-xs text-gray-500"
            >AT-RISK STUDENTS</small
          >
          <strong class="text-4xl text-danger">{{
            allAtRiskStudents.length
          }}</strong>
        </article>
      </div>

      <!-- Charts -->
      <div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.85fr]">
        <!-- Trend chart -->
        <article class="card p-6 h-[377px]">
          <div class="flex justify-between items-center">
            <h2 class="text-xl">Attendance Trends</h2>
            <span class="bg-gray-100 px-2 py-1 font-mono text-[11px]"
              >CHECK-INS BY MONTH</span
            >
          </div>
          <div class="h-[280px] relative pt-6 pb-6 pl-9">
            <div
              class="absolute inset-6 left-9 bottom-10 flex flex-col justify-between"
            >
              <i class="border-t border-gray-200" v-for="i in 5" :key="i" />
            </div>
            <svg
              v-if="trendPath"
              viewBox="0 0 600 260"
              preserveAspectRatio="none"
              class="w-full h-[235px] relative z-10 overflow-visible"
            >
              <path :d="trendAreaPath" fill="#dff8fb" stroke="none" />
              <path
                :d="trendPath"
                fill="none"
                stroke="#08c5ec"
                stroke-width="2"
              />
            </svg>
            <p v-else class="text-center text-gray-400 pt-20">
              No trend data available yet.
            </p>
            <div
              v-if="trendData.length > 0"
              class="flex justify-between font-mono text-[11px] text-gray-600 px-0.5"
            >
              <span v-for="d in trendData" :key="d.month">{{ d.month }}</span>
            </div>
          </div>
        </article>

        <!-- Department chart -->
        <article class="card p-6 h-[377px]">
          <div class="flex justify-between items-center">
            <h2 class="text-xl">By Department</h2>
            <span class="bg-gray-100 px-2 py-1 font-mono text-[11px]"
              >AVG %</span
            >
          </div>
          <div
            class="h-[280px] pt-10 px-2 flex items-end justify-around border-b border-gray-300"
            style="
              background: repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent 40px,
                #e1e5e8 41px
              );
            "
          >
            <div
              v-for="item in deptData"
              :key="item.label"
              class="h-[225px] flex flex-col items-center justify-end gap-2"
            >
              <div
                class="w-8 bg-navy-light rounded-t"
                :style="{ height: item.value * 2.1 + 'px' }"
              />
              <span class="font-mono text-[11px]">{{ item.label }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- At-risk students -->
      <article class="card overflow-hidden">
        <div
          class="min-h-[94px] border-b border-line px-6 flex items-center justify-between"
        >
          <div>
            <h2 class="text-xl">⚠ At-Risk Students</h2>
            <p class="mt-1 text-gray-500 text-sm">
              Students with attendance rate below 70%
            </p>
          </div>
          <div
            class="w-[230px] h-9 border border-gray-300 rounded bg-white flex items-center gap-2.5 px-3 text-gray-500"
          >
            <span>⌕</span>
            <input
              v-model="searchQuery"
              class="border-0 outline-none w-full text-ink"
              placeholder="Search student ID..."
            />
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th class="w-[18%]">Student ID</th>
              <th class="w-[24%]">Name</th>
              <th class="w-[24%]">Department</th>
              <th class="w-[16%]">Attendance</th>
              <th class="w-[18%]">Absenteeism</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="student in atRiskStudents" :key="student.id">
              <td class="font-mono text-[13px] text-[#334155]">{{ student.student_id }}</td>
              <td class="font-medium text-[#1f2d3d]">{{ student.full_name }}</td>
              <td class="text-[#334155]">{{ student.department }}</td>
              <td class="font-mono text-[13px] text-[#334155]">
                {{ Number(student.attendance_rate).toFixed(1) }}%
              </td>
              <td>
                <span class="inline-flex rounded bg-red-100 px-2.5 py-1 text-[11px] font-mono text-[#d92d47]">
                  {{ absenteeismRate(Number(student.attendance_rate)) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <p
          v-if="atRiskStudents.length === 0"
          class="p-6 text-center text-gray-400"
        >
          No at-risk students found.
        </p>
      </article>
    </template>
  </section>
</template>
