<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'

type AdminProfile = { full_name: string; department: string; admin_id: string }
type Notifications = { session_starts: boolean; system_health: boolean; at_risk_summaries: boolean; real_time_intervention: boolean }
type Biometrics = { confidence_threshold: number; anti_spoofing_sensitivity: 'Low' | 'Standard' | 'High'; auto_schedule_enabled: boolean; archival_days: number; telemetry_sharing: boolean }

const emit = defineEmits<{ notify: [message: string] }>()
const { getSystemSetting, saveSystemSetting } = useDatabase()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const profile = reactive<AdminProfile>({ full_name: '', department: '', admin_id: '' })
const notifications = reactive<Notifications>({ session_starts: true, system_health: true, at_risk_summaries: true, real_time_intervention: false })
const biometrics = reactive<Biometrics>({ confidence_threshold: 85, anti_spoofing_sensitivity: 'Standard', auto_schedule_enabled: false, archival_days: 90, telemetry_sharing: false })

onMounted(async () => {
  try {
    const [savedProfile, savedNotifications, savedBiometrics] = await Promise.all([
      getSystemSetting<AdminProfile>('admin_profile'),
      getSystemSetting<Notifications>('admin_notifications'),
      getSystemSetting<Biometrics>('biometric_settings'),
    ])
    if (savedProfile) Object.assign(profile, savedProfile)
    if (savedNotifications) Object.assign(notifications, savedNotifications)
    if (savedBiometrics) Object.assign(biometrics, savedBiometrics)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load settings.'
  } finally {
    loading.value = false
  }
})

async function saveSettings() {
  saving.value = true
  error.value = ''
  try {
    await Promise.all([
      saveSystemSetting('admin_profile', { ...profile }),
      saveSystemSetting('admin_notifications', { ...notifications }),
      saveSystemSetting('biometric_settings', { ...biometrics }),
    ])
    emit('notify', 'Settings saved successfully.')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to save settings.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-start justify-between gap-6">
      <div>
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan-dark">System configuration</p>
        <h1 class="text-4xl font-semibold tracking-tight mt-2">Settings</h1>
        <p class="text-gray-500 mt-2">Manage institutional alerts, biometric safeguards, and data retention.</p>
      </div>
      <button class="btn-dark" :disabled="saving || loading" @click="saveSettings">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
    </div>

    <p v-if="error" class="border border-red-200 bg-red-50 text-danger rounded-md px-4 py-3 text-sm">{{ error }}</p>
    <div v-if="loading" class="card p-8 text-gray-500">Loading system settings...</div>
    <div v-else class="grid lg:grid-cols-[280px_1fr] gap-6">
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Personal Information</h2>
          <label class="block mt-5 text-xs font-mono uppercase text-gray-500">Full name<input v-model="profile.full_name" class="input-field mt-2" /></label>
          <label class="block mt-4 text-xs font-mono uppercase text-gray-500">Department<input v-model="profile.department" class="input-field mt-2" /></label>
          <label class="block mt-4 text-xs font-mono uppercase text-gray-500">Administrator ID<input v-model="profile.admin_id" class="input-field mt-2" /></label>
        </div>
        <div class="card p-6 bg-cyan-light/10">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Biometric Security</h2>
          <div class="mt-5 rounded-md border border-cyan-light bg-white p-4">
            <div class="flex justify-between font-medium"><span>Recognition threshold</span><strong>{{ biometrics.confidence_threshold }}%</strong></div>
            <input v-model.number="biometrics.confidence_threshold" type="range" min="60" max="99" class="w-full mt-4 accent-cyan" />
            <p class="text-xs text-gray-500 mt-2">Matches below this confidence are sent for manual review.</p>
          </div>
          <label class="block mt-5 text-xs font-mono uppercase text-gray-500">Anti-spoofing sensitivity<select v-model="biometrics.anti_spoofing_sensitivity" class="input-field mt-2"><option>Low</option><option>Standard</option><option>High</option></select></label>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Notification Preferences</h2>
          <div class="grid sm:grid-cols-2 gap-4 mt-5">
            <label v-for="item in [{ key: 'session_starts', label: 'Session Starts', desc: 'Notify when scheduled classes begin.' }, { key: 'system_health', label: 'System Health', desc: 'Alerts for hardware or network degradation.' }, { key: 'at_risk_summaries', label: 'At-Risk Summaries', desc: 'Weekly digests for students below threshold.' }, { key: 'real_time_intervention', label: 'Real-time Intervention', desc: 'Urgent alerts during active sessions.' }]" :key="item.key" class="flex items-start gap-3 border border-line rounded-md p-4 cursor-pointer">
              <input v-model="notifications[item.key as keyof Notifications]" type="checkbox" class="mt-1 accent-cyan" />
              <span><strong class="block">{{ item.label }}</strong><small class="text-gray-500">{{ item.desc }}</small></span>
            </label>
          </div>
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Data Privacy & Archival</h2>
          <div class="grid sm:grid-cols-2 gap-4 mt-5">
            <label class="flex items-center justify-between rounded-md border border-line p-4"><span><strong class="block">Auto-schedule</strong><small class="text-gray-500">Use timetable start and stop times.</small></span><input v-model="biometrics.auto_schedule_enabled" type="checkbox" class="accent-cyan" /></label>
            <label class="rounded-md border border-line p-4"><strong class="block">Archive duration</strong><small class="text-gray-500 block mb-2">Raw logs before automatic purge.</small><select v-model.number="biometrics.archival_days" class="input-field"><option :value="30">30 days</option><option :value="90">90 days</option><option :value="180">180 days</option></select></label>
          </div>
          <label class="flex items-center gap-3 mt-5 text-sm"><input v-model="biometrics.telemetry_sharing" type="checkbox" class="accent-cyan" /> Share anonymized telemetry for institutional analytics</label>
        </div>
      </div>
    </div>
  </section>
</template>
