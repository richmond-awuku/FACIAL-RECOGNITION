<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { usePortal } from "~/composables/usePortal";
import { useApi } from "~/composables/useApi";
import { formatMatchSimilarity } from "~/composables/useConfidence";
import type { AttendanceRecord, Session, Course } from "~/types/database";

const emit = defineEmits<{
  notify: [message: string];
}>();

const { currentStudent } = usePortal();
const api = useApi();

const attendance = ref<
  (AttendanceRecord & { sessions: Session & { courses: Course } })[]
>([]);
const courses = ref<Course[]>([]);
const searchQuery = ref("");
const courseFilter = ref("All Courses");
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  if (!currentStudent.value) {
    loading.value = false;
    return;
  }
  try {
    const [attData, courseData] = await Promise.all([
      api.getAttendanceByStudent(currentStudent.value.id),
      api.getStudentCourses(currentStudent.value.id),
    ]);
    attendance.value = attData;
    courses.value = courseData;
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

const courseOptions = computed(() => [
  "All Courses",
  ...courses.value.map((c) => c.course_name),
]);

const filteredAttendance = computed(() => {
  return attendance.value.filter((a) => {
    const q = searchQuery.value.toLowerCase();
    const courseName = a.sessions?.courses?.course_name || "";
    const matchesSearch =
      !q || `${a.check_in_time} ${courseName}`.toLowerCase().includes(q);
    const matchesCourse =
      courseFilter.value === "All Courses" || courseName === courseFilter.value;
    return matchesSearch && matchesCourse;
  });
});

const statusClass = (status: string) => {
  if (status === "Present")
    return "bg-cyan-light/20 text-cyan-dark border-cyan-light";
  if (status === "Absent") return "bg-red-50 text-danger border-red-300";
  return "bg-gray-100 text-gray-600 border-gray-300";
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  );
};

</script>

<template>
  <section>
    <div class="flex items-end justify-between gap-5 mb-6">
      <div>
        <h1 class="text-3xl tracking-tight">My Attendance</h1>
        <p class="mt-1.5 text-gray-500">
          Detailed logging and biometric recognition telemetry for current
          semester.
        </p>
      </div>
    </div>

    <p v-if="loading" class="text-gray-500">Loading attendance data...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading">
      <!-- Top layout -->
      <div class="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_0.8fr]">
        <article class="card flex min-h-[300px] flex-col justify-center p-8 text-center">
          <h2 class="text-xl font-semibold">Attendance Summary</h2>
          <strong class="my-4 text-5xl">{{ attendance.length }}</strong>
          <p class="text-sm text-gray-500">
            Records returned by your account. An attendance rate and target require course-session totals from the backend.
          </p>
        </article>

        <aside class="flex flex-col gap-6">
          <!-- Rate card -->
          <article
            class="bg-navy-light text-white rounded-lg p-7 min-h-[155px]"
          >
            <small class="text-cyan font-mono text-[11px]">RECORDED CHECK-INS</small>
            <strong class="block text-5xl my-4">{{ attendance.length }}</strong>
            <p class="font-mono text-[11px] text-gray-300">
              Returned by the attendance API
            </p>
          </article>

          <!-- Filters -->
          <article class="card p-6">
            <h2 class="text-xl mb-6">Telemetry Filters</h2>
            <label class="block font-mono text-[10px] mt-4">
              COURSE SELECTION
              <select
                v-model="courseFilter"
                class="w-full p-2.5 border border-gray-300 bg-surface mt-2 text-ink"
              >
                <option v-for="c in courseOptions" :key="c" :value="c">
                  {{ c }}
                </option>
              </select>
            </label>
          </article>
        </aside>
      </div>

      <!-- Session log -->
      <article class="card overflow-hidden">
        <div
          class="h-16 border-b border-line px-6 flex items-center justify-between"
        >
          <h2 class="text-xl">Session Log</h2>
          <div
            class="w-[230px] h-9 border border-gray-300 rounded bg-white flex items-center gap-2.5 px-3 text-gray-500"
          >
            <span>⌕</span>
            <input
              v-model="searchQuery"
              class="border-0 outline-none w-full text-ink"
              placeholder="Search logs..."
            />
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th class="w-[30%]">Date / Time</th>
              <th class="w-[34%]">Course Name</th>
              <th class="w-[18%]">Status</th>
              <th class="w-[18%]">Match similarity</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredAttendance" :key="row.id">
              <td class="font-mono text-[12px] text-[#334155]">{{ formatDate(row.check_in_time) }}</td>
              <td class="text-[#1f2d3d]">{{ row.sessions?.courses?.course_name || "Unknown" }}</td>
              <td>
                <span class="inline-flex items-center gap-2 rounded border px-2 py-1 text-[10px] font-mono uppercase tracking-[0.08em]" :class="statusClass(row.status)">
                  <span class="inline-block h-2 w-2 rounded-full" :class="row.status === 'Present' ? 'bg-[#2fb3d4]' : row.status === 'Absent' ? 'bg-[#ef4444]' : 'bg-[#94a3b8]'" />
                  {{ row.status }}
                </span>
              </td>
              <td class="font-mono text-[12px] text-[#334155] text-right">
                {{ formatMatchSimilarity(row.confidence_score) }}
              </td>
            </tr>
          </tbody>
        </table>

        <p
          v-if="filteredAttendance.length === 0"
          class="p-6 text-center text-gray-400"
        >
          No attendance records found.
        </p>
      </article>
    </template>
  </section>
</template>
