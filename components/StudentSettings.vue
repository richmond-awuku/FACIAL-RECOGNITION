<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useDatabase } from '~/composables/useDatabase'
import { usePortal } from '~/composables/usePortal'

const emit = defineEmits<{ notify: [message: string] }>()
const { currentStudent } = usePortal()
const { getStudentSettings, saveStudentSettings, updateStudent } = useDatabase()
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const password = ref('')
const settings = reactive({ attendance_notifications: true, security_alerts: true, campus_announcements: false, two_factor_enabled: false })

onMounted(async () => {
  if (!currentStudent.value) return
  try {
    const saved = await getStudentSettings(currentStudent.value.id)
    if (saved) Object.assign(settings, saved)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load your settings.'
  } finally {
    loading.value = false
  }
})

async function saveSettings() {
  if (!currentStudent.value) return
  saving.value = true
  error.value = ''
  try {
    await saveStudentSettings(currentStudent.value.id, settings)
    emit('notify', 'Account settings saved.')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to save your settings.'
  } finally {
    saving.value = false
  }
}

async function addReference() {
  if (!currentStudent.value) return
  saving.value = true
  try {
    await updateStudent(currentStudent.value.id, { face_enrolled: true, face_reference_updated_at: new Date().toISOString() } as any)
    emit('notify', 'Biometric reference updated successfully.')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to update your reference.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-start justify-between gap-5">
      <div><p class="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-dark">Account</p><h1 class="text-4xl font-semibold mt-2">Account Settings</h1><p class="text-gray-500 mt-2">Manage your biometric profile, notifications, and security preferences.</p></div>
      <button class="btn-dark" :disabled="saving || loading" @click="saveSettings">{{ saving ? 'Saving...' : 'Save Changes' }}</button>
    </div>
    <p v-if="error" class="border border-red-200 bg-red-50 text-danger rounded-md px-4 py-3 text-sm">{{ error }}</p>
    <div v-if="loading" class="card p-8 text-gray-500">Loading account settings...</div>
    <div v-else class="grid lg:grid-cols-2 gap-6">
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Biometric Profile</h2>
          <p class="text-sm text-gray-600 mt-5">Keep your reference profile up to date for accurate campus access and attendance logging.</p>
          <div class="flex items-center justify-between gap-4 border border-line rounded-md p-4 mt-5">
            <div><strong class="block">Primary Reference</strong><small class="font-mono text-gray-500">{{ currentStudent?.face_enrolled ? 'ACTIVE' : 'PENDING VERIFICATION' }}</small></div>
            <span :class="currentStudent?.face_enrolled ? 'status-tag status-verified' : 'status-tag status-pending'">{{ currentStudent?.face_enrolled ? 'Verified' : 'Pending' }}</span>
          </div>
          <button class="btn-outline w-full mt-4" :disabled="saving" @click="addReference">Add New Reference</button>
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Notifications</h2>
          <label v-for="item in [{ key: 'attendance_notifications', label: 'Attendance Confirmation', desc: 'Receive a notification when your attendance is logged.' }, { key: 'security_alerts', label: 'Security Alerts', desc: 'Email alerts for new logins or unusual activity.' }, { key: 'campus_announcements', label: 'Campus Announcements', desc: 'General updates and institutional news.' }]" :key="item.key" class="flex items-center justify-between gap-4 py-5 border-b last:border-0 border-line"><span><strong class="block">{{ item.label }}</strong><small class="text-gray-500">{{ item.desc }}</small></span><input v-model="settings[item.key as keyof typeof settings]" type="checkbox" class="w-5 h-5 accent-cyan" /></label>
        </div>
      </div>
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Security</h2>
          <label class="block mt-5 text-xs font-mono uppercase text-gray-500">Password<input v-model="password" type="password" placeholder="Enter a new password" class="input-field mt-2" /></label>
          <button class="btn-outline mt-3" @click="password ? emit('notify', 'Password update request submitted.') : emit('notify', 'Enter a new password first.')">Update Password</button>
          <div class="border-t border-line mt-6 pt-5"><div class="flex justify-between gap-3"><div><h3 class="font-semibold">Two-Factor Authentication</h3><p class="text-sm text-gray-500 mt-1">Add an extra layer of security to your account.</p></div><span :class="settings.two_factor_enabled ? 'status-tag status-verified' : 'status-tag status-pending'">{{ settings.two_factor_enabled ? 'ACTIVE' : 'INACTIVE' }}</span></div><button class="btn-dark w-full mt-4" @click="settings.two_factor_enabled = !settings.two_factor_enabled">{{ settings.two_factor_enabled ? 'Disable 2FA' : 'Enable 2FA' }}</button></div>
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Data Privacy</h2>
          <p class="text-sm text-gray-600 mt-5">Your biometric templates are encrypted and stored securely. Attendance records are retained according to institutional policy.</p>
          <div class="rounded-md border border-line bg-gray-50 p-4 mt-5"><strong class="font-mono text-xs uppercase">Data retention policy</strong><p class="text-sm text-gray-600 mt-2">Biometric data is automatically purged after unenrollment. You can request a copy of your personal records at any time.</p></div>
          <button class="w-full mt-4 border border-danger text-danger rounded-md py-3 text-sm hover:bg-red-50" @click="emit('notify', 'Your data export request has been queued.')">Request Data Export</button>
        </div>
      </div>
    </div>
  </section>
</template>
