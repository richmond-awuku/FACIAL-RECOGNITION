<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useApi } from "~/composables/useApi";
import { usePortal } from "~/composables/usePortal";

const emit = defineEmits<{ notify: [message: string] }>();
const { currentStudent } = usePortal();
const api = useApi();
const loading = ref(true);
const submitting = ref(false);
const error = ref("");
const tickets = ref<any[]>([]);
const courses = ref<any[]>([]);
const showForm = ref(false);
const category = ref("Missed Attendance");
const referenceId = ref("");
const description = ref("");

onMounted(async () => {
  if (!currentStudent.value) return;
  try {
    const [savedTickets, savedCourses] = await Promise.all([
      api.getSupportTickets(currentStudent.value.id),
      api.getStudentCourses(currentStudent.value.id),
    ]);
    tickets.value = savedTickets;
    courses.value = savedCourses;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Unable to load support requests.";
  } finally {
    loading.value = false;
  }
});

async function submitTicket() {
  if (!currentStudent.value || !description.value.trim()) {
    emit("notify", "Please describe your issue before submitting.");
    return;
  }
  submitting.value = true;
  try {
    await api.createSupportTicket({
      student_id: currentStudent.value.id,
      category: category.value,
      reference_id: referenceId.value,
      description: description.value.trim(),
    });
    tickets.value = await api.getSupportTickets(currentStudent.value.id);
    showForm.value = false;
    description.value = "";
    referenceId.value = "";
    emit("notify", "Support request submitted successfully.");
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Unable to submit your request.";
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-start justify-between gap-5">
      <div>
        <p
          class="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-dark"
        >
          Support
        </p>
        <h1 class="text-4xl font-semibold mt-2">Support &amp; Overrides</h1>
        <p class="text-gray-500 mt-2">
          Contest a missed attendance record or raise a technical issue.
        </p>
      </div>
      <button class="btn-dark" @click="showForm = !showForm">
        {{ showForm ? "Cancel" : "New Request" }}
      </button>
    </div>
    <p
      v-if="error"
      class="border border-red-200 bg-red-50 text-danger rounded-md px-4 py-3 text-sm"
    >
      {{ error }}
    </p>

    <div v-if="showForm" class="card p-6 space-y-5">
      <h2 class="text-xl font-semibold border-b border-line pb-4">
        Submit a New Request
      </h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <label class="block text-xs font-mono uppercase text-gray-500"
          >Category<select v-model="category" class="input-field mt-2">
            <option>Missed Attendance</option>
            <option>Incorrect Identification</option>
            <option>Biometric Enrollment</option>
            <option>Technical Issue</option>
            <option>Other</option>
          </select></label
        >
        <label class="block text-xs font-mono uppercase text-gray-500"
          >Related module<select v-model="referenceId" class="input-field mt-2">
            <option value="">General</option>
            <option v-for="c in courses" :key="c.id" :value="c.course_code">
              {{ c.course_code }} — {{ c.course_name }}
            </option>
          </select></label
        >
      </div>
      <label class="block text-xs font-mono uppercase text-gray-500"
        >Description<textarea
          v-model="description"
          rows="4"
          class="input-field mt-2"
          placeholder="Describe what happened and include any relevant details..."
        ></textarea>
      </label>
      <button class="btn-primary" :disabled="submitting" @click="submitTicket">
        {{ submitting ? "Submitting..." : "Submit Request" }}
      </button>
    </div>

    <div v-if="loading" class="card p-8 text-gray-500">
      Loading your support requests...
    </div>
    <div v-else-if="tickets.length === 0" class="card p-12 text-center">
      <p class="text-gray-500">
        You have not submitted any support requests yet.
      </p>
      <p class="text-sm text-gray-400 mt-2">
        Use the "New Request" button above to contest a missed attendance record
        or report an issue.
      </p>
    </div>
    <div v-else class="card overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th class="w-[18%]">Category</th>
            <th class="w-[18%]">Reference</th>
            <th class="w-[46%]">Description</th>
            <th class="w-[18%]">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tickets" :key="t.id">
            <td class="font-medium text-[#1f2d3d]">{{ t.category }}</td>
            <td class="text-gray-500 font-mono text-[12px]">{{ t.reference_id || "General" }}</td>
            <td class="text-gray-600">{{ t.description }}</td>
            <td>
              <span
                :class="[
                  'inline-flex rounded border px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.08em]',
                  t.status === 'Resolved' || t.status === 'Closed'
                    ? 'border-cyan-light bg-cyan-light/20 text-cyan-dark'
                    : t.status === 'In Review'
                      ? 'border-gray-300 bg-gray-100 text-gray-600'
                      : 'border-red-300 bg-red-50 text-danger',
                ]"
              >{{ t.status }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card p-6">
      <h2 class="text-xl font-semibold border-b border-line pb-4">
        Frequently Asked Questions
      </h2>
      <div class="divide-y divide-line">
        <details
          v-for="faq in [
            {
              q: 'Why was my attendance marked as absent?',
              a: 'If the system could not identify you within the session window, your attendance is recorded as absent. Submit a Missed Attendance request with details for your lecturer to review.',
            },
            {
              q: 'How accurate is the facial recognition?',
              a: 'The system uses high-fidelity matching with a configurable confidence threshold. Matches below the threshold are flagged for manual review by your lecturer.',
            },
            {
              q: 'How is my biometric data protected?',
              a: 'Your biometric template is encrypted at rest and never shared in raw form. You can request data deletion at any time through account settings.',
            },
          ]"
          :key="faq.q"
          class="py-4"
        >
          <summary class="cursor-pointer font-medium">{{ faq.q }}</summary>
          <p class="text-sm text-gray-600 mt-2">{{ faq.a }}</p>
        </details>
      </div>
    </div>
  </section>
</template>
