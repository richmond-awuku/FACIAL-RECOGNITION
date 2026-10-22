<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useApi } from "~/composables/useApi";

const api = useApi();
const logs = ref<any[]>([]);
const count = ref(0);
const page = ref(1);
const pageSize = ref(50);
const loading = ref(false);
const error = ref("");
const filters = reactive({ event_type: "", outcome: "", user: "", since: "", until: "" });
const pageCount = computed(() => Math.max(1, Math.ceil(count.value / pageSize.value)));

async function loadLogs() {
  loading.value = true;
  error.value = "";
  try {
    const response = await api.getSystemAuditLogs({ ...filters, page: page.value, page_size: pageSize.value });
    logs.value = Array.isArray(response) ? response : response?.results ?? [];
    count.value = Number(response?.count ?? logs.value.length);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unable to load system audit events.";
    logs.value = [];
    count.value = 0;
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  loadLogs();
}

function clearFilters() {
  Object.assign(filters, { event_type: "", outcome: "", user: "", since: "", until: "" });
  applyFilters();
}

function actor(log: any) {
  return typeof log.actor === "string" ? log.actor : log.actor?.full_name || log.actor?.username || log.actor?.email || log.actor_name || log.user_name || log.user?.email || "System";
}

function affectedAccount(log: any) {
  return typeof log.affected_account === "string" ? log.affected_account : log.affected_account?.full_name || log.affected_account?.email || log.affected_user?.email || "—";
}

function details(log: any) {
  const safeDetails = log.details;
  return typeof safeDetails === "string" ? safeDetails : safeDetails ? JSON.stringify(safeDetails) : "—";
}

function eventTime(log: any) {
  const value = log.timestamp || log.created_at;
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

onMounted(loadLogs);
</script>

<template>
  <section class="space-y-5">
    <header>
      <h1 class="text-3xl font-semibold text-[#1d2b3a] sm:text-[38px]">System Audit</h1>
      <p class="mt-1 text-sm text-[#64748b]">Cross-system activity and security events.</p>
    </header>

    <form class="grid grid-cols-1 gap-3 border-y border-[#dfe5eb] py-4 sm:grid-cols-2 xl:grid-cols-6" @submit.prevent="applyFilters">
      <label class="text-xs font-medium text-gray-600">Event type
        <input v-model="filters.event_type" class="input-field mt-1" placeholder="e.g. LOGIN" />
      </label>
      <label class="text-xs font-medium text-gray-600">Outcome
        <select v-model="filters.outcome" class="input-field mt-1">
          <option value="">All outcomes</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </select>
      </label>
      <label class="text-xs font-medium text-gray-600">User
        <input v-model="filters.user" class="input-field mt-1" placeholder="User ID or name" />
      </label>
      <label class="text-xs font-medium text-gray-600">Since
        <input v-model="filters.since" type="date" class="input-field mt-1" />
      </label>
      <label class="text-xs font-medium text-gray-600">Until
        <input v-model="filters.until" type="date" class="input-field mt-1" />
      </label>
      <div class="flex items-end gap-2">
        <button type="submit" class="btn-dark flex-1">Apply</button>
        <button type="button" class="btn-outline" aria-label="Clear filters" title="Clear filters" @click="clearFilters">×</button>
      </div>
    </form>

    <p v-if="loading" class="py-8 text-center text-sm text-gray-500">Loading system audit events...</p>
    <p v-else-if="error" class="py-4 text-sm text-danger" role="alert">{{ error }}</p>
    <div v-else class="panel-surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table min-w-[1050px]">
          <thead><tr><th>Event</th><th>Outcome</th><th>Actor</th><th>Affected account</th><th>Request</th><th>Details</th><th>Timestamp</th></tr></thead>
          <tbody>
            <tr v-for="(log, index) in logs" :key="log.id ?? index">
              <td class="font-medium">{{ log.event_type || log.event || "Audit event" }}</td>
              <td>{{ log.outcome || "—" }}<span v-if="log.http_status || log.status_code"> · {{ log.http_status || log.status_code }}</span></td>
              <td>{{ actor(log) }}</td>
              <td>{{ affectedAccount(log) }}</td>
              <td class="max-w-[220px] break-words font-mono text-xs">{{ [log.method, log.route || log.path, log.ip_address, log.user_agent].filter(Boolean).join(" · ") || "—" }}</td>
              <td class="max-w-[260px] break-words text-xs">{{ details(log) }}</td>
              <td class="whitespace-nowrap font-mono text-xs text-gray-500">{{ eventTime(log) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="!logs.length" class="p-6 text-center text-sm text-gray-500">No system audit events match these filters.</p>
      <footer class="flex flex-col gap-3 border-t border-[#dfe5eb] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span class="text-gray-500">{{ count }} events · Page {{ page }} of {{ pageCount }}</span>
        <div class="flex gap-2">
          <button type="button" class="btn-outline" :disabled="loading || page <= 1" @click="page--; loadLogs()">Previous</button>
          <button type="button" class="btn-outline" :disabled="loading || page >= pageCount" @click="page++; loadLogs()">Next</button>
        </div>
      </footer>
    </div>
  </section>
</template>