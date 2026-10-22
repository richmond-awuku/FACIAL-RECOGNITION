<script setup lang="ts">
import { computed } from "vue";
import { formatMatchSimilarity } from "~/composables/useConfidence";
import type {
  Session,
  Course,
  AttendanceRecord,
  Student,
} from "~/types/database";

const props = defineProps<{
  session: Session & { courses?: Course };
  attendance: (AttendanceRecord & { students?: Student })[];
  reviewItems: any[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const durationMinutes = computed(() => {
  if (!props.session.started_at || !props.session.ended_at) return 0;
  const ms =
    new Date(props.session.ended_at).getTime() -
    new Date(props.session.started_at).getTime();
  return Math.max(1, Math.round(ms / 60000));
});

const presentCount = computed(
  () => props.attendance.filter((r) => r.status === "Present").length,
);
const attendanceRate = computed(() => {
  if (!props.session.total_expected) return 0;
  return Math.round((presentCount.value / props.session.total_expected) * 100);
});
const avgConfidence = computed(() => {
  const present = props.attendance.filter(
    (r) => r.status === "Present" && r.confidence_score != null,
  );
  if (present.length === 0) return props.session.avg_confidence || 0;
  return (
    Math.round(
      (present.reduce((sum, r) => sum + Number(r.confidence_score || 0), 0) /
        present.length) *
        10,
    ) / 10
  );
});
const formatTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
const formatDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

function exportCsv() {
  const columns = ["student_name", "student_id", "status", "confidence_score", "check_in_time"];
  const quote = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = props.attendance.map((record) => [
    record.students?.full_name,
    record.students?.student_id,
    record.status,
    record.confidence_score,
    record.check_in_time,
  ]);
  const csv = [columns.map(quote).join(","), ...rows.map((row) => row.map(quote).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${props.session.session_code || `session-${props.session.id}`}-attendance.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-6"
    @click.self="$emit('close')"
  >
    <div
      class="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
    >
      <div
        class="px-8 py-6 border-b border-line flex items-start justify-between"
      >
        <div>
          <p
            class="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-dark"
          >
            Session Summary
          </p>
          <h2 class="text-3xl font-semibold mt-1">
            {{ session.courses?.course_code || session.session_code }}
          </h2>
          <p class="text-gray-500 mt-1">
            {{ session.courses?.course_name || "Session" }} ·
            {{ formatDate(session.ended_at) }}
          </p>
        </div>
        <button
          class="text-gray-400 hover:text-ink text-2xl leading-none"
          @click="$emit('close')"
        >
          &times;
        </button>
      </div>

      <div class="px-8 py-6">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="card p-4 text-center">
            <p class="font-mono text-[10px] uppercase text-gray-500">
              Duration
            </p>
            <p class="text-2xl font-semibold mt-1">
              {{ durationMinutes
              }}<span class="text-sm text-gray-500 ml-1">min</span>
            </p>
          </div>
          <div class="card p-4 text-center">
            <p class="font-mono text-[10px] uppercase text-gray-500">Present</p>
            <p class="text-2xl font-semibold mt-1 text-cyan-dark">
              {{ presentCount
              }}<span class="text-sm text-gray-500 ml-1"
                >/ {{ session.total_expected }}</span
              >
            </p>
          </div>
          <div class="card p-4 text-center">
            <p class="font-mono text-[10px] uppercase text-gray-500">
              Attendance
            </p>
            <p class="text-2xl font-semibold mt-1">{{ attendanceRate }}%</p>
          </div>
          <div class="card p-4 text-center">
            <p class="font-mono text-[10px] uppercase text-gray-500">
              Avg Match Similarity
            </p>
            <p class="text-2xl font-semibold mt-1">{{ formatMatchSimilarity(avgConfidence) }}</p>
          </div>
        </div>

        <div v-if="reviewItems.length > 0" class="mt-6">
          <h3 class="font-semibold mb-3">
            Flagged for Review ({{ reviewItems.length }})
          </h3>
          <div class="card overflow-hidden">
            <div class="table-head grid-cols-[2fr_1.5fr_0.8fr]">
              <span>Student</span><span>Reason</span><span>Match similarity</span>
            </div>
            <div
              v-for="item in reviewItems"
              :key="item.id"
              class="table-row grid-cols-[2fr_1.5fr_0.8fr]"
            >
              <span class="font-medium truncate">{{
                item.students?.full_name || "Unknown"
              }}</span>
              <span class="text-gray-500 truncate">{{ item.reason }}</span>
              <span class="font-mono text-sm flex-shrink-0">{{
                formatMatchSimilarity(item.confidence_score)
              }}</span>
            </div>
          </div>
        </div>

        <h3 class="font-semibold mt-6 mb-3">Check-in Log</h3>
        <div
          v-if="attendance.length === 0"
          class="card p-6 text-center text-gray-500"
        >
          No attendance records for this session.
        </div>
        <div v-else class="card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="data-table min-w-[640px]">
              <thead>
                <tr>
                  <th class="w-[30%]">Student</th>
                  <th class="w-[22%]">Student ID</th>
                  <th class="w-[16%]">Status</th>
                  <th class="w-[18%]">Check-in</th>
                  <th class="w-[14%] text-right">Match similarity</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in attendance" :key="r.id">
                  <td class="font-medium">{{ r.students?.full_name || "Unknown" }}</td>
                  <td class="font-mono text-xs text-gray-600">{{ r.students?.student_id || "—" }}</td>
                  <td>
                    <span
                      :class="[
                        'status-tag inline-block',
                        r.status === 'Present'
                          ? 'status-verified'
                          : r.status === 'Excused'
                            ? 'status-pending'
                            : 'status-flagged',
                      ]"
                    >{{ r.status }}</span>
                  </td>
                  <td class="whitespace-nowrap font-mono text-xs text-gray-500">
                    {{ formatTime(r.check_in_time) }}
                  </td>
                  <td class="text-right font-mono text-xs text-gray-600">
                    {{ formatMatchSimilarity(r.confidence_score) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="px-8 py-5 border-t border-line flex justify-end gap-3">
        <button class="btn-outline" @click="exportCsv">
          Export Report
        </button>
        <button class="btn-dark" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>
