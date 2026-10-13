<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick, reactive, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useCamera } from '~/composables/useCamera'
import { usePortal } from '~/composables/usePortal'

const emit = defineEmits<{ notify: [message: string] }>()
const { currentStudent, refreshCurrentStudent } = usePortal()
const api = useApi()
const cam = useCamera()

const loading = ref(true)
const saving = ref(false)
const error = ref('')
const settings = reactive({ attendance_notifications: true, security_alerts: true, campus_announcements: false })

// ── Password change ──────────────────────────────────────
const oldPassword = ref('')
const newPassword = ref('')
const changingPw = ref(false)
const pwError = ref('')

// ── Face reference capture ───────────────────────────────
const showCapture = ref(false)
const capturing = ref(false)
const captureError = ref('')
const captureStatus = ref('')
const videoRef = cam.videoRef

onMounted(async () => {
  if (!currentStudent.value) return
  try {
    const saved = await api.getMyStudentSettings()
    if (saved) Object.assign(settings, saved)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load your settings.'
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => closeCapture())

async function saveSettings() {
  if (!currentStudent.value) return
  saving.value = true
  error.value = ''
  try {
    await api.saveMyStudentSettings(settings)
    emit('notify', 'Account settings saved.')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to save your settings.'
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  pwError.value = ''
  if (!oldPassword.value || !newPassword.value) {
    pwError.value = 'Enter your current and new password.'
    return
  }
  changingPw.value = true
  try {
    await api.changePassword(oldPassword.value, newPassword.value)
    oldPassword.value = ''
    newPassword.value = ''
    emit('notify', 'Password changed.')
  } catch (err: any) {
    const p = err?.payload
    pwError.value = p?.old_password?.[0] || p?.old_password
      || p?.new_password?.[0] || p?.new_password
      || err?.message || 'Unable to change password.'
  } finally {
    changingPw.value = false
  }
}

async function addReference() {
  if (!currentStudent.value) return
  // A student with a verified reference can't silently swap it — that goes to
  // staff review. A PENDING student self-enrolls once, with a liveness check.
  if (currentStudent.value.face_enrolled) {
    await requestReenrollment()
    return
  }
  captureError.value = ''
  captureStatus.value = ''
  showCapture.value = true
  await nextTick()
  await cam.open()
  captureError.value = cam.cameraError.value
}

async function requestReenrollment() {
  saving.value = true
  error.value = ''
  try {
    await api.createSupportTicket({
      category: 'Biometric Re-enrollment',
      description: 'Student requested a face reference update from account settings.',
    })
    emit('notify', 'Face reference update request submitted for staff review.')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to submit your request.'
  } finally {
    saving.value = false
  }
}

function closeCapture() {
  cam.close()
  showCapture.value = false
  capturing.value = false
  captureStatus.value = ''
}

async function runCapture() {
  if (!cam.ready.value || !currentStudent.value) return
  capturing.value = true
  captureError.value = ''
  try {
    const total = 3
    const frames: Blob[] = []
    for (let i = 0; i < total; i++) {
      captureStatus.value = i === 2 ? 'Blink now — naturally' : `Hold still… ${i + 1} / ${total}`
      const blob = await cam.grabFrame()
      if (blob) frames.push(blob)
      await cam.wait(450)
    }
    if (frames.length < 3) {
      captureError.value = 'Could not capture enough frames. Try again in better lighting.'
      capturing.value = false
      return
    }
    captureStatus.value = 'Verifying…'
    const fd = new FormData()
    frames.forEach((b, i) => fd.append('frames', b, `frame-${i}.jpg`))
    await api.enrollMyFace(fd)
    await refreshCurrentStudent()
    emit('notify', 'Face reference captured — your enrollment is verified.')
    closeCapture()
  } catch (err: any) {
    const status = err?.status
    if (status === 401) captureError.value = 'Liveness check failed — blink naturally during capture and try again.'
    else if (status === 422) captureError.value = 'A face was not detected in every frame. Center your face and retry.'
    else if (status === 403) captureError.value = err?.message || 'Self-enrollment is closed for this account. Submit a re-enrollment request instead.'
    else if (status === 400) captureError.value = err?.message || 'Not enough valid frames. Try again.'
    else if (status === 404) captureError.value = 'No student profile is linked to this account.'
    else captureError.value = err?.message || 'Enrollment failed. Try again.'
    capturing.value = false
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
          <button class="btn-outline w-full mt-4" :disabled="saving" @click="addReference">
            {{ currentStudent?.face_enrolled ? 'Request Reference Update' : 'Capture Face Reference' }}
          </button>
          <p class="text-xs text-gray-500 mt-2">
            {{ currentStudent?.face_enrolled
              ? 'Updates to a verified reference are reviewed by staff.'
              : 'One-time self-enrollment. You will be asked to blink for a liveness check.' }}
          </p>
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Notifications</h2>
          <label v-for="item in [{ key: 'attendance_notifications', label: 'Attendance Confirmation', desc: 'Receive a notification when your attendance is logged.' }, { key: 'security_alerts', label: 'Security Alerts', desc: 'Email alerts for new logins or unusual activity.' }, { key: 'campus_announcements', label: 'Campus Announcements', desc: 'General updates and institutional news.' }]" :key="item.key" class="flex items-center justify-between gap-4 py-5 border-b last:border-0 border-line"><span><strong class="block">{{ item.label }}</strong><small class="text-gray-500">{{ item.desc }}</small></span><input v-model="settings[item.key as keyof typeof settings]" type="checkbox" class="w-5 h-5 accent-cyan" /></label>
        </div>
      </div>
      <div class="space-y-6">
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Security</h2>
          <label class="block mt-5 text-xs font-mono uppercase text-gray-500">Current password<PasswordInput v-model="oldPassword" class="mt-2" autocomplete="current-password" placeholder="Enter current password" /></label>
          <label class="block mt-4 text-xs font-mono uppercase text-gray-500">New password<PasswordInput v-model="newPassword" class="mt-2" autocomplete="new-password" placeholder="Enter a new password" /></label>
          <p v-if="pwError" class="mt-3 text-sm text-danger">{{ pwError }}</p>
          <button class="btn-outline mt-3" :disabled="changingPw" @click="changePassword">{{ changingPw ? 'Updating…' : 'Update Password' }}</button>
          <div class="border-t border-line mt-6 pt-5"><h3 class="font-semibold">Two-Factor Authentication</h3><p class="text-sm text-gray-500 mt-1">Two-factor enrollment is not available through the current account API.</p></div>
        </div>
        <div class="card p-6">
          <h2 class="text-xl font-semibold border-b border-line pb-4">Data Privacy</h2>
          <p class="text-sm text-gray-600 mt-5">Biometric data handling and attendance retention follow institutional policy. Contact your administrator for details.</p>
          <div class="rounded-md border border-line bg-gray-50 p-4 mt-5"><strong class="font-mono text-xs uppercase">Personal data export</strong><p class="text-sm text-gray-600 mt-2">A data-export request cannot be submitted from the current backend API.</p></div>
        </div>
      </div>
    </div>

    <!-- Face capture modal -->
    <div v-if="showCapture" class="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 backdrop-blur-sm p-6" @click.self="closeCapture">
      <div class="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
        <div class="px-6 py-5 border-b border-line flex items-center justify-between">
          <h2 class="text-xl font-semibold">Capture Face Reference</h2>
          <button class="text-gray-400 hover:text-ink text-2xl leading-none" @click="closeCapture">&times;</button>
        </div>
        <div class="p-6 space-y-4">
          <p class="text-sm text-gray-600">Face the camera in good lighting. When you see <strong>“Blink now”</strong>, blink once, naturally — this is the liveness check.</p>
          <div class="relative rounded-md overflow-hidden bg-black aspect-[4/3]">
            <video ref="videoRef" autoplay playsinline muted class="w-full h-full object-cover"></video>
            <div v-if="captureStatus" class="absolute inset-x-0 bottom-0 bg-navy/70 text-white text-center py-2 font-mono text-xs">{{ captureStatus }}</div>
          </div>
          <p v-if="captureError" class="border border-red-200 bg-red-50 text-danger rounded-md px-3 py-2 text-sm">{{ captureError }}</p>
          <div class="flex gap-3">
            <button class="btn-outline flex-1" :disabled="capturing" @click="closeCapture">Cancel</button>
            <button class="btn-dark flex-1" :disabled="capturing || !cam.ready.value" @click="runCapture">{{ capturing ? 'Capturing…' : 'Start Capture' }}</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
