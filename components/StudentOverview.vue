<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { usePortal } from "~/composables/usePortal";
import { useApi } from "~/composables/useApi";
import type { AttendanceRecord, Session, Course } from "~/types/database";

const emit = defineEmits<{
  notify: [message: string];
  navigate: [view: string];
}>();

const { currentStudent } = usePortal();
const api = useApi();

const overrideCategory = ref("Missed Attendance");
const overrideDescription = ref("");
const submittingOverride = ref(false);

const attendance = ref<
  (AttendanceRecord & { sessions: Session & { courses: Course } })[]
>([]);
const courses = ref<Course[]>([]);
const loading = ref(true);
const error = ref("");
const showManualOverride = ref(false);

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

const initials = computed(() => {
  const name = currentStudent.value?.full_name || "";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

const formatScanTime = (iso: string, index: number) => {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  if (isToday) return `TODAY, ${timeStr}`;
  if (isYesterday) return `YESTERDAY, ${timeStr}`;
  return (
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    ", " +
    timeStr
  );
};

const recentAttendance = computed(() => attendance.value.slice(0, 4));

async function submitOverride() {
  if (!currentStudent.value || !overrideDescription.value.trim()) {
    emit("notify", "Please describe the issue before submitting.");
    return;
  }
  submittingOverride.value = true;
  try {
    await api.createSupportTicket({
      student_id: currentStudent.value.id,
      category: overrideCategory.value,
      description: overrideDescription.value.trim(),
    });
    showManualOverride.value = false;
    overrideDescription.value = "";
    emit("notify", "Manual override request submitted for review.");
  } catch (e: any) {
    emit("notify", `Error: ${e.message}`);
  } finally {
    submittingOverride.value = false;
  }
}
</script>

<template>
  <section>
    <div class="mb-6">
      <h1 class="text-4xl tracking-tight">Overview</h1>
      <p class="mt-2 text-gray-500">
        System Status: <span class="text-cyan font-mono">ONLINE_SECURE</span>
      </p>
    </div>

    <p v-if="loading" class="text-gray-500">Loading your data...</p>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <template v-if="!loading && currentStudent">
      <!-- Top grid -->
      <div class="grid grid-cols-[2fr_0.95fr] gap-6 my-8">
        <!-- Identity card -->
        <article
          class="card flex items-center gap-6 p-6 relative overflow-hidden min-h-[204px]"
        >
          <div
            class="absolute -right-12 -top-20 w-[290px] h-[290px] rounded-full bg-cyan-light/10"
          ></div>
          <div
            class="relative z-10 w-[125px] h-[125px] rounded-full flex items-center justify-center text-3xl font-extrabold text-white border-[3px] border-gray-200"
            style="background: linear-gradient(145deg, #d5e8ef, #5f8092)"
          >
            {{ initials }}
          </div>
          <div class="relative z-10">
            <h2 class="text-xl mb-1.5">{{ currentStudent.full_name }}</h2>
            <p class="font-mono mb-4">▣ {{ currentStudent.student_id }}</p>
            <b
              class="status-tag"
              :class="
                currentStudent.face_enrolled
                  ? 'status-verified'
                  : 'status-pending'
              "
            >
              ◉
              {{
                currentStudent.face_enrolled
                  ? "Face Enrollment Verified"
                  : "Face Enrollment Pending"
              }}
            </b>
          </div>
          <div
            class="relative z-10 ml-auto w-[106px] h-[106px] rounded-full border-cyan flex flex-col justify-center items-center"
            style="border-width: 9px"
          >
            <strong class="text-2xl"
              >{{ Number(currentStudent.attendance_rate).toFixed(0) }}%</strong
            >
            <span class="font-mono text-[11px]">ATTENDANCE</span>
          </div>
        </article>

        <!-- Actions -->
        <article class="card p-6 flex flex-col gap-3.5">
          <small class="font-mono text-[11px]">SYSTEM ACTIONS</small>
          <button
            class="bg-white border border-gray-300 p-3 text-ink hover:bg-gray-50 transition-colors"
            @click="showManualOverride = true"
          >
            ⌾ Request Manual Override
          </button>
          <button
            class="bg-white border border-gray-300 p-3 text-danger hover:bg-red-50 transition-colors"
            @click="emit('navigate', 'support')"
          >
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

          <table class="data-table">
            <thead>
              <tr>
                <th class="w-[24%]">Code</th>
                <th class="w-[52%]">Course</th>
                <th class="w-[24%]">Credits</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="course in courses" :key="course.id">
                <td class="font-mono text-[12px] text-[#334155]">{{ course.course_code }}</td>
                <td>
                  <div class="font-medium text-[#1f2d3d]">{{ course.course_name }}</div>
                  <small class="block text-[11px] text-gray-500 font-mono mt-1">{{ course.professor }} | {{ course.room }}</small>
                </td>
                <td>{{ course.credits }} CR</td>
              </tr>
            </tbody>
          </table>

          <p v-if="courses.length === 0" class="p-6 text-center text-gray-400">
            No courses enrolled.
          </p>
        </article>

        <!-- Telemetry -->
        <article class="card overflow-hidden">
          <div class="bg-gray-100 min-h-[46px] px-6 flex items-center">
            <h3 class="font-mono text-xs uppercase">
              ⟲ Telemetry: Recent Scans
            </h3>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th class="w-[28%]">Time</th>
                <th class="w-[34%]">Course</th>
                <th class="w-[18%]">Status</th>
                <th class="w-[20%]">Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(scan, index) in recentAttendance" :key="scan.id">
                <td class="font-mono text-[11px] text-[#64748b]">{{ formatScanTime(scan.check_in_time, index) }}</td>
                <td class="font-medium text-[#1f2d3d]">{{ scan.sessions?.courses?.course_name || "Unknown Course" }}</td>
                <td>
                  <span class="inline-flex rounded bg-cyan-light/20 px-2 py-1 text-[10px] font-mono text-cyan-dark">
                    {{ scan.status === "Present" ? "MATCH FOUND" : scan.status.toUpperCase() }}
                  </span>
                </td>
                <td class="font-mono text-[11px] text-[#334155]">
                  {{ scan.confidence_score ? Number(scan.confidence_score).toFixed(1) + "%" : "N/A" }}
                </td>
              </tr>
            </tbody>
          </table>

          <p
            v-if="recentAttendance.length === 0"
            class="p-6 text-center text-gray-400"
          >
            No scan history yet.
          </p>
        </article>
      </div>

      <!-- Manual override modal -->
      <BaseModal
        :show="showManualOverride"
        title="Request Manual Override"
        message="Send a secure request to an administrator to review your attendance record."
        :button-text="submittingOverride ? 'Submitting...' : 'Send Request'"
        @close="showManualOverride = false"
        @confirm="submitOverride"
      >
        <template #default>
          <div class="text-left">
            <label class="block font-mono text-[11px] tracking-wide mt-4">
              CATEGORY
              <select v-model="overrideCategory" class="input-field mt-2">
                <option>Missed Attendance</option>
                <option>Incorrect Identification</option>
                <option>Biometric Enrollment</option>
                <option>Other</option>
              </select>
            </label>
            <label class="block font-mono text-[11px] tracking-wide mt-4">
              DESCRIPTION
              <textarea
                v-model="overrideDescription"
                rows="4"
                class="input-field mt-2"
                placeholder="Describe what happened and include any relevant details..."
              ></textarea>
            </label>
          </div>
        </template>
      </BaseModal>
    </template>
  </section>
</template>
