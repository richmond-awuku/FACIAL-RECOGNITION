<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useApi } from "~/composables/useApi";
import { usePortal } from "~/composables/usePortal";

type AdminProfile = { full_name: string; department: string; admin_id: string };
type Notifications = {
  session_starts: boolean;
  system_health: boolean;
  at_risk_summaries: boolean;
  real_time_intervention: boolean;
};
type Biometrics = {
  confidence_threshold: number;
  anti_spoofing_sensitivity: "Low" | "Standard" | "High";
  auto_schedule_enabled: boolean;
  archival_days: number;
  telemetry_sharing: boolean;
};

type CameraNode = {
  id: string;
  name: string;
  location: string;
  status?: "online" | "offline" | "degraded";
  firmware: string;
};

const emit = defineEmits<{ notify: [message: string] }>();
const api = useApi();
const { isAdmin, adminSignUp } = usePortal();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const profile = reactive<AdminProfile>({
  full_name: "",
  department: "",
  admin_id: "",
});
const notifications = reactive<Notifications>({
  session_starts: true,
  system_health: true,
  at_risk_summaries: true,
  real_time_intervention: false,
});
const biometrics = reactive<Biometrics>({
  confidence_threshold: 85,
  anti_spoofing_sensitivity: "Standard",
  auto_schedule_enabled: false,
  archival_days: 90,
  telemetry_sharing: false,
});
const nodes = ref<CameraNode[]>([]);
const showNodeForm = ref(false);
const nodeDraft = ref({ name: "", location: "", firmware: "" });

// ── Password change ──────────────────────────────────────
const oldPassword = ref("");
const newPassword = ref("");
const changingPw = ref(false);
const pwError = ref("");

async function changePassword() {
  pwError.value = "";
  if (!oldPassword.value || !newPassword.value) {
    pwError.value = "Enter your current and new password.";
    return;
  }
  changingPw.value = true;
  try {
    await api.changePassword(oldPassword.value, newPassword.value);
    oldPassword.value = "";
    newPassword.value = "";
    emit("notify", "Password changed.");
  } catch (err: any) {
    const p = err?.payload;
    pwError.value =
      p?.old_password?.[0] ||
      p?.old_password ||
      p?.new_password?.[0] ||
      p?.new_password ||
      err?.message ||
      "Unable to change password.";
  } finally {
    changingPw.value = false;
  }
}

function addNode() {
  if (!nodeDraft.value.name.trim() || !nodeDraft.value.location.trim()) {
    error.value = "Enter a camera node name and location.";
    return;
  }
  nodes.value.push({
    id: `NODE-${Date.now().toString(36).toUpperCase()}`,
    name: nodeDraft.value.name.trim(),
    location: nodeDraft.value.location.trim(),
    firmware: nodeDraft.value.firmware.trim(),
  });
  nodeDraft.value = { name: "", location: "", firmware: "" };
  showNodeForm.value = false;
  error.value = "";
}

// ── Staff accounts (admin only) ──────────────────────────
const newStaffName = ref("");
const newStaffEmail = ref("");
const newStaffRole = ref<"ADMIN" | "LECTURER">("LECTURER");
const creatingStaff = ref(false);
const staffError = ref("");
const staffInfo = ref("");

async function createStaffAccount() {
  staffError.value = "";
  staffInfo.value = "";
  if (!newStaffName.value.trim() || !newStaffEmail.value.trim()) {
    staffError.value = "Enter a full name and email.";
    return;
  }
  creatingStaff.value = true;
  try {
    const result = await adminSignUp(
      newStaffEmail.value,
      newStaffName.value,
      newStaffRole.value,
    );
    if (!result.success) {
      staffError.value = result.error || "Could not create account.";
      return;
    }
    staffInfo.value =
      result.info ||
      "Account created. They will receive a temporary password by email.";
    newStaffName.value = "";
    newStaffEmail.value = "";
    newStaffRole.value = "LECTURER";
    emit("notify", "Staff account created.");
  } finally {
    creatingStaff.value = false;
  }
}

onMounted(async () => {
  try {
    const [savedProfile, savedNotifications, savedBiometrics, savedNodes] =
      await Promise.all([
        api.getSystemSetting<AdminProfile>("admin_profile"),
        api.getSystemSetting<Notifications>("admin_notifications"),
        api.getSystemSetting<Biometrics>("biometric_settings"),
        api.getSystemSetting<{ nodes: CameraNode[] }>("node_settings"),
      ]);
    if (savedProfile) Object.assign(profile, savedProfile);
    if (savedNotifications) Object.assign(notifications, savedNotifications);
    if (savedBiometrics) Object.assign(biometrics, savedBiometrics);
    if (savedNodes?.nodes) nodes.value = savedNodes.nodes;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Unable to load settings.";
  } finally {
    loading.value = false;
  }
});

async function saveSettings() {
  saving.value = true;
  error.value = "";
  try {
    await Promise.all([
      api.saveSystemSetting("admin_profile", { ...profile }),
      api.saveSystemSetting("admin_notifications", { ...notifications }),
      api.saveSystemSetting("biometric_settings", { ...biometrics }),
      api.saveSystemSetting("node_settings", { nodes: nodes.value }),
    ]);
    emit("notify", "Settings saved successfully.");
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Unable to save settings.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-start justify-between gap-6">
      <div>
        <p
          class="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-dark"
        >
          System configuration
        </p>
        <h1 class="text-4xl font-semibold tracking-tight mt-2">Settings</h1>
        <p class="text-gray-500 mt-2">
          Manage institutional alerts, biometric safeguards, and data retention.
        </p>
      </div>
      <button
        class="btn-dark"
        :disabled="saving || loading"
        @click="saveSettings"
      >
        {{ saving ? "Saving..." : "Save Changes" }}
      </button>
    </div>

    <p
      v-if="error"
      class="border border-red-200 bg-red-50 text-danger rounded-md px-4 py-3 text-sm"
    >
      {{ error }}
    </p>
    <ProfileImageUpload />
    <div v-if="loading" class="card p-8 text-gray-500">
      Loading system settings...
    </div>
    <div v-else class="grid lg:grid-cols-[280px_1fr] gap-6">
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">
            Personal Information
          </h2>
          <label class="block mt-5 text-xs font-mono uppercase text-gray-500"
            >Full name<input
              v-model="profile.full_name"
              class="input-field mt-2"
          /></label>
          <label class="block mt-4 text-xs font-mono uppercase text-gray-500"
            >Department<input
              v-model="profile.department"
              class="input-field mt-2"
          /></label>
          <label class="block mt-4 text-xs font-mono uppercase text-gray-500"
            >Administrator ID<input
              v-model="profile.admin_id"
              class="input-field mt-2"
          /></label>
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">
            Password
          </h2>
          <label class="block mt-5 text-xs font-mono uppercase text-gray-500"
            >Current password<PasswordInput
              v-model="oldPassword"
              class="mt-2"
              autocomplete="current-password"
          /></label>
          <label class="block mt-4 text-xs font-mono uppercase text-gray-500"
            >New password<PasswordInput
              v-model="newPassword"
              class="mt-2"
              autocomplete="new-password"
          /></label>
          <p v-if="pwError" class="mt-3 text-sm text-danger">{{ pwError }}</p>
          <button
            class="btn-outline mt-3"
            :disabled="changingPw"
            @click="changePassword"
          >
            {{ changingPw ? "Updating…" : "Update Password" }}
          </button>
        </div>
        <div v-if="isAdmin" class="card p-6 bg-cyan-light/10">
          <h2 class="text-xl font-semibold border-b border-line pb-4">
            Biometric Security
          </h2>
          <div class="mt-5 rounded-md border border-cyan-light bg-white p-4">
            <div class="flex justify-between font-medium">
              <span>Recognition match threshold</span
              ><strong>{{ biometrics.confidence_threshold }}%</strong>
            </div>
            <input
              v-model.number="biometrics.confidence_threshold"
              type="range"
              min="60"
              max="99"
              class="w-full mt-4 accent-cyan"
            />
            <p class="text-xs text-gray-500 mt-2">
              The backend applies its configured similarity threshold; displayed
              scores do not decide attendance acceptance.
            </p>
          </div>
          <label class="block mt-5 text-xs font-mono uppercase text-gray-500"
            >Anti-spoofing sensitivity<select
              v-model="biometrics.anti_spoofing_sensitivity"
              class="input-field mt-2"
            >
              <option>Low</option>
              <option>Standard</option>
              <option>High</option>
            </select></label
          >
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">
            Notification Preferences
          </h2>
          <div class="grid sm:grid-cols-2 gap-4 mt-5">
            <label
              v-for="item in [
                {
                  key: 'session_starts',
                  label: 'Session Starts',
                  desc: 'Notify when scheduled classes begin.',
                },
                {
                  key: 'system_health',
                  label: 'System Health',
                  desc: 'Alerts for hardware or network degradation.',
                },
                {
                  key: 'at_risk_summaries',
                  label: 'At-Risk Summaries',
                  desc: 'Weekly digests for students below threshold.',
                },
                {
                  key: 'real_time_intervention',
                  label: 'Real-time Intervention',
                  desc: 'Urgent alerts during active sessions.',
                },
              ]"
              :key="item.key"
              class="flex items-start gap-3 border border-line rounded-md p-4 cursor-pointer"
            >
              <input
                v-model="notifications[item.key as keyof Notifications]"
                type="checkbox"
                class="mt-1 accent-cyan"
              />
              <span
                ><strong class="block">{{ item.label }}</strong
                ><small class="text-gray-500">{{ item.desc }}</small></span
              >
            </label>
          </div>
        </div>
        <div v-if="isAdmin" class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">
            Data Privacy & Archival
          </h2>
          <div class="grid sm:grid-cols-2 gap-4 mt-5">
            <label
              class="flex items-center justify-between rounded-md border border-line p-4"
              ><span
                ><strong class="block">Auto-schedule</strong
                ><small class="text-gray-500"
                  >Use timetable start and stop times.</small
                ></span
              ><input
                v-model="biometrics.auto_schedule_enabled"
                type="checkbox"
                class="accent-cyan"
            /></label>
            <label class="rounded-md border border-line p-4"
              ><strong class="block">Archive duration</strong
              ><small class="text-gray-500 block mb-2"
                >Raw logs before automatic purge.</small
              ><select
                v-model.number="biometrics.archival_days"
                class="input-field"
              >
                <option :value="30">30 days</option>
                <option :value="90">90 days</option>
                <option :value="180">180 days</option>
              </select></label
            >
          </div>
          <label class="flex items-center gap-3 mt-5 text-sm"
            ><input
              v-model="biometrics.telemetry_sharing"
              type="checkbox"
              class="accent-cyan"
            />
            Share anonymized telemetry for institutional analytics</label
          >
        </div>
        <div v-if="isAdmin" class="card p-6 overflow-hidden">
          <div
            class="flex items-center justify-between border-b border-line pb-4"
          >
            <div>
              <h2 class="text-xl font-semibold">Camera Node Configuration</h2>
              <p class="mt-1 text-xs text-gray-500">
                Saved settings only; live connectivity requires a backend
                device-health integration.
              </p>
            </div>
            <button class="btn-outline" @click="showNodeForm = !showNodeForm">
              + Add Node
            </button>
          </div>
          <div
            v-if="showNodeForm"
            class="grid gap-3 border-b border-line py-4 sm:grid-cols-2"
          >
            <input
              v-model="nodeDraft.name"
              class="input-field"
              placeholder="Node name"
              aria-label="Node name"
            />
            <input
              v-model="nodeDraft.location"
              class="input-field"
              placeholder="Location"
              aria-label="Node location"
            />
            <input
              v-model="nodeDraft.firmware"
              class="input-field sm:col-span-2"
              placeholder="Firmware version (optional)"
              aria-label="Firmware version"
            />
            <button class="btn-dark sm:col-span-2" @click="addNode">
              Add to saved settings
            </button>
          </div>
          <div v-if="nodes.length === 0" class="p-6 text-center text-gray-400">
            No camera nodes configured.
          </div>
          <div v-else>
            <div class="table-head grid-cols-[2fr_1.5fr_1fr_0.8fr]">
              <span>Name</span><span>Location</span><span>Firmware</span
              ><span>Configuration</span>
            </div>
            <div
              v-for="(node, i) in nodes"
              :key="i"
              class="table-row grid-cols-[2fr_1.5fr_1fr_0.8fr] text-sm"
            >
              <strong>{{ node.name }}</strong>
              <span class="text-gray-500">{{ node.location }}</span>
              <span class="font-mono text-xs">{{ node.firmware || "—" }}</span>
              <div class="flex gap-2">
                <span class="text-xs text-gray-500">Saved</span>
                <button
                  class="text-danger text-xs font-mono uppercase hover:underline"
                  @click="nodes.splice(i, 1)"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isAdmin" class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">
            Staff Accounts
          </h2>
          <p class="text-sm text-gray-500 mt-4">
            Add a new admin or lecturer. They receive a one-time password by
            email and choose their own on first sign-in.
          </p>
          <div class="grid sm:grid-cols-2 gap-4 mt-4">
            <label class="block text-xs font-mono uppercase text-gray-500"
              >Full name<input
                v-model="newStaffName"
                class="input-field mt-2"
                placeholder="Jane Doe"
            /></label>
            <label class="block text-xs font-mono uppercase text-gray-500"
              >Email<input
                v-model="newStaffEmail"
                type="email"
                class="input-field mt-2"
                placeholder="jane@institution.edu"
            /></label>
          </div>
          <label
            class="block mt-4 text-xs font-mono uppercase text-gray-500 max-w-[200px]"
          >
            Role
            <select v-model="newStaffRole" class="input-field mt-2">
              <option value="LECTURER">Lecturer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <p v-if="staffError" class="mt-3 text-sm text-danger">
            {{ staffError }}
          </p>
          <p v-if="staffInfo" class="mt-3 text-sm text-cyan-dark">
            {{ staffInfo }}
          </p>
          <button
            class="btn-outline mt-4"
            :disabled="creatingStaff"
            @click="createStaffAccount"
          >
            {{ creatingStaff ? "Creating…" : "Create Account" }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
