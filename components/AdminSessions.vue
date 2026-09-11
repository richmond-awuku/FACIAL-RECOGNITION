<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useApi } from "~/composables/useApi";
import type {
  Session,
  Course,
  AttendanceRecord,
  Student,
} from "~/types/database";
import SessionSummaryModal from "~/components/SessionSummaryModal.vue";

const emit = defineEmits<{
  notify: [message: string];
  viewRoster: [];
}>();

const api = useApi();

const showSummary = ref(false);
const summarySession = ref<(Session & { courses?: Course }) | null>(null);
const summaryAttendance = ref<(AttendanceRecord & { students?: Student })[]>(
  [],
);
const summaryReviewItems = ref<any[]>([]);

const session = ref<(Session & { courses: Course }) | null>(null);
const attendance = ref<(AttendanceRecord & { students: Student })[]>([]);
const courses = ref<Course[]>([]);
const students = ref<Student[]>([]);
const loading = ref(true);
const error = ref("");

// Camera state
const videoRef = ref<HTMLVideoElement | null>(null);
const cameraActive = ref(false);
const cameraError = ref("");
let stream: MediaStream | null = null;

// Start session form
const showStartForm = ref(false);
const selectedCourse = ref("");
const sessionRoom = ref("");
const expectedCount = ref(0);
const startingSession = ref(false);

// Manual entry
const showManualEntry = ref(false);
const manualStudentId = ref("");
const manualStatus = ref<"Present" | "Absent" | "Excused">("Present");

// Realtime subscription
let subscription: any = null;

// Scanning simulation
const scanProgress = ref(0);
const scanMatch = ref<{ name: string; id: string; confidence: number } | null>(
  null,
);
let scanTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  try {
    const [sessionsData, coursesData, studentsData] = await Promise.all([
      api.getActiveSessions(),
      api.getCourses(),
      api.getStudents(),
    ]);
    courses.value = coursesData;
    students.value = studentsData;

    if (sessionsData.length > 0) {
      session.value = sessionsData[0];
      const records = await api.getAttendanceBySession(sessionsData[0].id);
      attendance.value = records;
      subscribeToLiveUpdates(sessionsData[0].id);
    }
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  stopCamera();
  if (subscription?.close) subscription.close();
  if (scanTimer) clearInterval(scanTimer);
});

function subscribeToLiveUpdates(sessionId: string) {
  subscription = api.subscribeToSessionAttendance(
    sessionId,
    async (payload: any) => {
      // Fetch updated attendance list
      const records = await api.getAttendanceBySession(sessionId);
      attendance.value = records;
      await api.updateSessionStats(sessionId);
      // Refresh session data
      const sessions = await api.getActiveSessions();
      if (sessions.length > 0) session.value = sessions[0];

      // Show scan match if we have student data
      const newRecord = payload.new as AttendanceRecord & { students: Student };
      if (newRecord?.students) {
        scanMatch.value = {
          name: newRecord.students.full_name,
          id: newRecord.students.student_id,
          confidence: Number(newRecord.confidence_score || 0),
        };
        setTimeout(() => {
          scanMatch.value = null;
        }, 3000);
      }
    },
  );
}

async function startCamera() {
  cameraError.value = "";
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
    });
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }
    cameraActive.value = true;
    startScanning();
  } catch (e: any) {
    cameraError.value =
      "Unable to access camera. " +
      (e.message || "Please grant camera permissions.");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  cameraActive.value = false;
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
  }
  scanProgress.value = 0;
  scanMatch.value = null;
}

function startScanning() {
  if (scanTimer) clearInterval(scanTimer);
  scanProgress.value = 0;
  scanTimer = setInterval(() => {
    scanProgress.value = (scanProgress.value + 1) % 100;
  }, 50);
}

const presentPct = computed(() => {
  if (!session.value || !session.value.total_expected) return 0;
  return Math.round(
    (session.value.total_present / session.value.total_expected) * 100,
  );
});

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

async function handleStartSession() {
  if (!selectedCourse.value || !sessionRoom.value.trim()) {
    emit("notify", "Please select a course and enter a room.");
    return;
  }
  startingSession.value = true;
  try {
    const newSession = await api.startSession(
      selectedCourse.value,
      sessionRoom.value,
      expectedCount.value || 0,
    );
    const sessions = await api.getActiveSessions();
    if (sessions.length > 0) {
      session.value = sessions[0];
      attendance.value = await api.getAttendanceBySession(newSession.id);
      subscribeToLiveUpdates(newSession.id);
    }
    showStartForm.value = false;
    emit("notify", `Session ${newSession.session_code} started.`);
    await startCamera();
  } catch (e: any) {
    emit("notify", `Error starting session: ${e.message}`);
  } finally {
    startingSession.value = false;
  }
}

async function handleStop() {
  if (!session.value) {
    emit("notify", "No active session to stop.");
    return;
  }
  try {
    const stoppedSession = session.value;
    const stoppedAttendance = [...attendance.value];
    await api.stopSession(stoppedSession.id);
    await api.updateSessionStats(stoppedSession.id);
    const finalAttendance = await api.getAttendanceBySession(stoppedSession.id);
    const reviewItems = await api.getSessionReviewItems(stoppedSession.id);
    summarySession.value = {
      ...stoppedSession,
      status: "completed",
      ended_at: new Date().toISOString(),
    };
    summaryAttendance.value = finalAttendance;
    summaryReviewItems.value = reviewItems;
    showSummary.value = true;
    if (subscription?.close) {
      subscription.close();
      subscription = null;
    }
    stopCamera();
    session.value = null;
    attendance.value = [];
    emit("notify", "Session stopped. Summary report generated.");
  } catch (e: any) {
    emit("notify", `Error stopping session: ${e.message}`);
  }
}

async function handleManualEntry() {
  if (!session.value || !manualStudentId.value.trim()) {
    emit("notify", "Please enter a student ID.");
    return;
  }
  try {
    const student = students.value.find(
      (s) => s.student_id === manualStudentId.value.trim(),
    );
    if (!student) {
      emit("notify", `Student ${manualStudentId.value} not found in roster.`);
      return;
    }
    const confidence =
      manualStatus.value === "Present"
        ? Math.round(85 + Math.random() * 15)
        : null;
    await api.recordAttendance({
      student_id: student.id,
      session_id: session.value.id,
      status: manualStatus.value,
      confidence_score: confidence,
    });
    await api.updateSessionStats(session.value.id);
    attendance.value = await api.getAttendanceBySession(session.value.id);
    const sessions = await api.getActiveSessions();
    if (sessions.length > 0) session.value = sessions[0];
    showManualEntry.value = false;
    manualStudentId.value = "";
    emit("notify", `${student.full_name} marked ${manualStatus.value}.`);
  } catch (e: any) {
    emit("notify", `Error: ${e.message}`);
  }
}

// Simulate a facial recognition scan picking a random student
async function simulateScan() {
  if (!session.value || students.value.length === 0) return;
  const unmarked = students.value.filter(
    (s) => !attendance.value.some((a) => a.student_id === s.id),
  );
  if (unmarked.length === 0) {
    emit("notify", "All students have been marked present.");
    return;
  }
  const student = unmarked[Math.floor(Math.random() * unmarked.length)];
  const confidence = Math.round(88 + Math.random() * 12);
  try {
    await api.recordAttendance({
      student_id: student.id,
      session_id: session.value.id,
      status: "Present",
      confidence_score: confidence,
    });
    await api.updateSessionStats(session.value.id);
    attendance.value = await api.getAttendanceBySession(session.value.id);
    const sessions = await api.getActiveSessions();
    if (sessions.length > 0) session.value = sessions[0];
    scanMatch.value = {
      name: student.full_name,
      id: student.student_id,
      confidence,
    };
    setTimeout(() => {
      scanMatch.value = null;
    }, 3000);
    emit(
      "notify",
      `${student.full_name} recognized at ${confidence}% confidence.`,
    );
  } catch (e: any) {
    emit("notify", `Scan error: ${e.message}`);
  }
}
</script>

<template>
  <section>
    <!-- No active session: show start form -->
    <div
      v-if="!loading && !session"
      class="flex items-end justify-between gap-5 mb-6"
    >
      <div>
        <h1 class="text-3xl tracking-tight">Sessions</h1>
        <p class="mt-2 text-gray-500">
          No active session. Start a new attendance scanning session below.
        </p>
      </div>
    </div>

    <div v-if="loading" class="text-gray-500">Loading session data...</div>
    <p v-if="error" class="text-sm text-danger">{{ error }}</p>

    <!-- Start session form -->
    <article v-if="!loading && !session" class="card p-8 max-w-2xl">
      <h2 class="text-xl mb-6">Start New Session</h2>
      <label class="block font-mono text-[11px] tracking-wide mt-4">
        COURSE
        <select v-model="selectedCourse" class="input-field mt-2">
          <option value="" disabled>Select a course...</option>
          <option v-for="c in courses" :key="c.id" :value="c.id">
            {{ c.course_code }}: {{ c.course_name }}
          </option>
        </select>
      </label>
      <label class="block font-mono text-[11px] tracking-wide mt-4">
        ROOM
        <input
          v-model="sessionRoom"
          type="text"
          class="input-field mt-2"
          placeholder="e.g. Turing Theater"
        />
      </label>
      <label class="block font-mono text-[11px] tracking-wide mt-4">
        EXPECTED STUDENTS
        <input
          v-model.number="expectedCount"
          type="number"
          min="0"
          class="input-field mt-2"
          placeholder="e.g. 150"
        />
      </label>
      <button
        class="btn-dark mt-6"
        :disabled="startingSession"
        @click="handleStartSession"
      >
        {{ startingSession ? "Starting..." : "▶ Start Session" }}
      </button>
    </article>

    <!-- Active session view -->
    <template v-if="!loading && session">
      <div class="flex items-end justify-between gap-5 mb-6">
        <div>
          <h1 class="text-3xl tracking-tight">
            {{ session.courses?.course_name || "Session" }}
          </h1>
          <p class="mt-2 font-mono text-sm text-gray-500">
            ID: {{ session.session_code }} &nbsp;•&nbsp; ROOM:
            {{ session.room }} &nbsp;•&nbsp;
            <span class="text-cyan">● LIVE</span>
          </p>
        </div>
        <div class="flex gap-2.5">
          <button class="btn-outline" @click="showManualEntry = true">
            ≡ Manual Entry
          </button>
          <button class="btn-danger" @click="handleStop">■ Stop Session</button>
        </div>
      </div>

      <div class="grid grid-cols-[1.65fr_0.8fr] gap-6">
        <!-- Camera feed -->
        <article class="rounded-lg bg-[#001319] overflow-hidden">
          <div
            class="h-[42px] px-4 flex justify-between items-center bg-gray-100 text-gray-700 font-mono text-xs"
          >
            <span
              >CAMERA FEED :
              {{ session.room.toUpperCase().replace(/\s/g, "_") }}_CAM_1</span
            >
            <span>{{ cameraActive ? "● LIVE" : "○ OFFLINE" }} | 1080p</span>
          </div>
          <div
            class="h-[530px] relative border border-gray-700 overflow-hidden"
          >
            <!-- Video element -->
            <video
              ref="videoRef"
              class="w-full h-full object-cover"
              :class="{
                'opacity-100': cameraActive,
                'opacity-0': !cameraActive,
              }"
              autoplay
              muted
              playsinline
            />

            <!-- No camera placeholder -->
            <div
              v-if="!cameraActive"
              class="absolute inset-0 flex flex-col items-center justify-center gap-4 text-gray-500"
            >
              <span class="text-6xl">⬡</span>
              <p class="font-mono text-sm">Camera feed inactive</p>
              <p
                v-if="cameraError"
                class="text-danger text-xs max-w-xs text-center"
              >
                {{ cameraError }}
              </p>
              <button
                class="btn-outline text-white border-cyan"
                @click="startCamera"
              >
                ▶ Activate Camera
              </button>
            </div>

            <!-- Corner brackets -->
            <template v-if="cameraActive">
              <i
                class="absolute w-9 h-9 border-cyan border-solid border-t-4 border-l-4 left-5 top-5 z-10"
              />
              <i
                class="absolute w-9 h-9 border-cyan border-solid border-t-4 border-r-4 right-5 top-5 z-10"
              />
              <i
                class="absolute w-9 h-9 border-cyan border-solid border-b-4 border-l-4 left-5 bottom-5 z-10"
              />
              <i
                class="absolute w-9 h-9 border-cyan border-solid border-b-4 border-r-4 right-5 bottom-5 z-10"
              />

              <!-- Scanning line -->
              <div
                class="absolute left-0 right-0 h-0.5 bg-cyan/60 z-10"
                :style="{ top: scanProgress + '%' }"
              />

              <!-- Face match box -->
              <div
                v-if="scanMatch"
                class="absolute left-[40%] top-[30%] w-[140px] h-[160px] border-2 border-cyan z-10"
              >
                <div
                  class="absolute top-[164px] -left-4 w-[200px] p-2.5 bg-gray-200 text-ink rounded flex flex-col gap-1 z-10"
                >
                  <b class="font-mono text-xs"
                    >MATCH FOUND
                    <span class="text-cyan float-right"
                      >{{ scanMatch.confidence }}%</span
                    ></b
                  >
                  <strong class="text-sm">{{ scanMatch.name }}</strong>
                  <small class="text-gray-500 font-mono"
                    >ID: {{ scanMatch.id }}</small
                  >
                </div>
              </div>

              <!-- Scan button -->
              <button
                v-if="!scanMatch"
                class="absolute bottom-8 left-1/2 -translate-x-1/2 bg-cyan text-navy px-6 py-2.5 rounded font-mono text-xs font-bold z-10 hover:bg-cyan/80 transition-colors"
                @click="simulateScan"
              >
                ⚡ Simulate Face Scan
              </button>

              <div
                v-if="!scanMatch"
                class="absolute bottom-12 right-8 text-gray-400 font-mono text-xs z-10"
              >
                ANALYZING... {{ scanProgress }}%
              </div>
            </template>
          </div>
        </article>

        <!-- Side panel -->
        <aside class="flex flex-col gap-6">
          <!-- Metrics -->
          <article
            class="rounded-lg bg-navy-light text-white p-6 min-h-[170px]"
          >
            <small class="text-gray-300 font-mono text-[11px]"
              >SESSION METRICS</small
            >
            <div class="flex justify-between my-4">
              <strong class="text-5xl leading-none"
                >{{ session.total_present
                }}<em
                  class="block text-gray-300 font-mono text-[11px] mt-2 not-italic"
                  >/ {{ session.total_expected }} PRESENT</em
                ></strong
              >
              <b class="text-cyan text-3xl leading-none"
                >{{ Number(session.avg_confidence).toFixed(1) }}%<em
                  class="block text-gray-300 font-mono text-[11px] mt-2 not-italic"
                  >AVG CONFIDENCE</em
                ></b
              >
            </div>
            <div class="h-1 bg-navy-400 rounded">
              <i
                class="block h-full bg-cyan rounded"
                :style="{ width: presentPct + '%' }"
              />
            </div>
          </article>

          <!-- Recent check-ins -->
          <article class="card overflow-hidden flex-1">
            <div
              class="h-16 border-b border-line px-6 flex items-center justify-between"
            >
              <h3 class="font-mono text-xs uppercase">Recent Check-ins</h3>
              <span class="bg-cyan-light/30 px-2 py-1 font-mono text-[11px]"
                >LIVE LOG</span
              >
            </div>

            <div class="table-head grid-cols-[38px_1.8fr_0.9fr]">
              <span>#</span><span>Student</span><span>Time</span>
            </div>

            <div
              v-for="(record, index) in attendance"
              :key="record.id"
              class="table-row grid-cols-[38px_1.8fr_0.9fr] text-xs"
            >
              <span class="font-mono">{{ attendance.length - index }}</span>
              <strong>{{ record.students?.full_name || "Unknown" }}</strong>
              <time class="font-mono text-[11px] text-gray-500">{{
                formatTime(record.check_in_time)
              }}</time>
            </div>

            <p
              v-if="attendance.length === 0"
              class="p-6 text-center text-gray-400"
            >
              No check-ins yet.
            </p>

            <button
              class="w-full border-t border-line bg-gray-50 px-4 py-3.5 font-mono text-[11px] uppercase hover:bg-gray-100 transition-colors"
              @click="$emit('viewRoster')"
            >
              View Full Roster
            </button>
          </article>
        </aside>
      </div>
    </template>

    <!-- Session summary modal -->
    <SessionSummaryModal
      v-if="showSummary && summarySession"
      :session="summarySession"
      :attendance="summaryAttendance"
      :review-items="summaryReviewItems"
      @close="showSummary = false"
      @export="emit('notify', 'Report export queued for download.')"
    />

    <!-- Manual entry modal -->
    <BaseModal
      :show="showManualEntry"
      title="Manual Attendance Entry"
      message="Enter the student ID and status to manually mark attendance."
      button-text="Mark Attendance"
      @close="showManualEntry = false"
      @confirm="handleManualEntry"
    >
      <template #default>
        <div class="text-left">
          <label class="block font-mono text-[11px] tracking-wide mt-4">
            STUDENT ID
            <input
              v-model="manualStudentId"
              type="text"
              class="input-field mt-2"
              placeholder="e.g. STU-8829-XR"
            />
          </label>
          <label class="block font-mono text-[11px] tracking-wide mt-4">
            STATUS
            <select v-model="manualStatus" class="input-field mt-2">
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </label>
        </div>
      </template>
    </BaseModal>
  </section>
</template>
