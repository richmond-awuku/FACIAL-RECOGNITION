<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useApi } from "~/composables/useApi";

interface AuditLog {
  id: number | string;
  who: string;
  what: string;
  timestamp: string;
  outcome: string;
  subject: string | null;
  record_type: string | null;
  record_id: string | null;
  record_ids: string[];
}

const api = useApi();
const logs = ref<AuditLog[]>([]);
const count = ref(0);
const page = ref(1);
const pageSize = ref(50);
const loading = ref(false);
const error = ref("");
const filters = reactive({
  search: "",
  period: "",
  outcome: "",
  date_from: "",
  date_to: "",
});
const pageCount = computed(() =>
  Math.max(1, Math.ceil(count.value / pageSize.value)),
);

async function loadLogs() {
  loading.value = true;
  error.value = "";
  try {
    const customRange = filters.period === "custom";
    const response = await api.getSystemAuditLogs({
      search: filters.search,
      outcome: filters.outcome,
      period: customRange ? "" : filters.period,
      date_from: customRange ? filters.date_from : "",
      date_to: customRange ? filters.date_to : "",
      page: page.value,
      page_size: pageSize.value,
    });
    logs.value = Array.isArray(response)
      ? response
      : Array.isArray(response?.results)
        ? response.results
        : [];
    count.value = Number(response?.count ?? logs.value.length);
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : "Unable to load system audit events.";
    logs.value = [];
    count.value = 0;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  error.value = "";
  if (filters.period === "custom") {
    if (!filters.date_from && !filters.date_to) {
      error.value = "Choose a start date, an end date, or both.";
      return;
    }
    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_from > filters.date_to
    ) {
      error.value = "The end date must be on or after the start date.";
      return;
    }
  }
  page.value = 1;
  loadLogs();
}

function clearFilters() {
  Object.assign(filters, {
    search: "",
    period: "",
    outcome: "",
    date_from: "",
    date_to: "",
  });
  applyFilters();
}

function eventTime(log: AuditLog) {
  const date = new Date(log.timestamp);
  return Number.isNaN(date.getTime()) ? log.timestamp : date.toLocaleString();
}

onMounted(loadLogs);
</script>

<template>
  <section class="space-y-5">
    <header>
      <h1 class="text-3xl font-semibold text-[#1d2b3a] sm:text-[38px]">
        System Audit
      </h1>
      <p class="mt-1 text-sm text-[#64748b]">
        Who did what, when, and which record was affected.
      </p>
    </header>

    <form
      class="grid grid-cols-1 gap-3 border-y border-[#dfe5eb] py-4 sm:grid-cols-2 xl:grid-cols-5"
      @submit.prevent="applyFilters"
    >
      <label class="text-xs font-medium text-gray-600">
        Search
        <input
          v-model="filters.search"
          class="input-field mt-1"
          placeholder="Name, action, subject, or record ID"
        />
      </label>
      <label class="text-xs font-medium text-gray-600">
        Date range
        <select v-model="filters.period" class="input-field mt-1">
          <option value="">All time</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
          <option value="custom">Custom range</option>
        </select>
      </label>
      <template v-if="filters.period === 'custom'">
        <label class="text-xs font-medium text-gray-600">
          From
          <input
            v-model="filters.date_from"
            type="date"
            class="input-field mt-1"
          />
        </label>
        <label class="text-xs font-medium text-gray-600">
          To
          <input
            v-model="filters.date_to"
            type="date"
            class="input-field mt-1"
          />
        </label>
      </template>
      <label class="text-xs font-medium text-gray-600">
        Outcome
        <select v-model="filters.outcome" class="input-field mt-1">
          <option value="">All outcomes</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
      </label>
      <div class="flex items-end gap-2">
        <button type="submit" class="btn-dark flex-1">Apply</button>
        <button
          type="button"
          class="btn-outline"
          aria-label="Clear filters"
          title="Clear filters"
          @click="clearFilters"
        >
          ×
        </button>
      </div>
    </form>

    <p v-if="loading" class="py-8 text-center text-sm text-gray-500">
      Loading system audit events...
    </p>
    <p v-else-if="error" class="py-4 text-sm text-danger" role="alert">
      {{ error }}
    </p>
    <div v-else class="panel-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table min-w-[760px]">
          <thead>
            <tr>
              <th>ID</th>
              <th>Who</th>
              <th>What</th>
              <th>Subject</th>
              <th>Outcome</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="font-mono text-xs text-gray-500">
                {{ log.id }}
              </td>
              <td class="font-medium">
                {{ log.who || "Unknown user" }}
              </td>
              <td class="max-w-[360px] break-words font-medium">
                {{ log.what || "Activity recorded" }}
              </td>
              <td>
                {{ log.subject || "—" }}
              </td>
              <td>
                <span
                  class="rounded-full px-2 py-1 text-xs font-medium"
                  :class="
                    log.outcome?.toLowerCase() === 'success'
                      ? 'bg-emerald-50 text-emerald-700'
                      : log.outcome?.toLowerCase() === 'failure'
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ log.outcome || "—" }}
                </span>
              </td>
              <td class="whitespace-nowrap text-xs text-gray-500">
                {{ eventTime(log) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!logs.length" class="p-6 text-center text-sm text-gray-500">
        No system audit events match these filters.
      </p>
      <footer
        class="flex flex-col gap-3 border-t border-[#dfe5eb] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <span class="text-gray-500"
          >{{ count }} events · Page {{ page }} of {{ pageCount }}</span
        >
        <div class="flex gap-2">
          <button
            type="button"
            class="btn-outline"
            :disabled="loading || page <= 1"
            @click="
              page--;
              loadLogs();
            "
          >
            Previous
          </button>
          <button
            type="button"
            class="btn-outline"
            :disabled="loading || page >= pageCount"
            @click="
              page++;
              loadLogs();
            "
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  </section>
</template>
