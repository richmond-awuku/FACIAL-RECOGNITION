<script setup lang="ts">
import { ref } from 'vue'
import { usePortal } from '~/composables/usePortal'

const emit = defineEmits<{
  login: []
  switchToStudent: []
}>()

const { adminLogin } = usePortal()

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)
const errorMsg = ref('')

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    const result = await adminLogin(email.value, password.value)
    if (!result.success) {
      errorMsg.value = result.error || 'Login failed.'
      return
    }
    emit('login')
  } catch (e: any) {
    errorMsg.value = e.message || 'An unexpected error occurred.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative grid min-h-screen place-items-center bg-navy p-4 sm:p-8">
    <div class="fixed inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(#1680a3 1px, transparent 1px); background-size: 34px 34px;"></div>

    <div class="relative z-10 flex w-full max-w-[1028px] shadow-2xl rounded-xl overflow-hidden">
      <!-- Visual panel -->
      <div class="hidden w-[430px] min-h-[645px] p-14 flex-col justify-between text-white lg:flex" style="background: linear-gradient(150deg, #0b355a, #02172c 72%);">
        <div class="relative z-10">
          <div class="flex items-center gap-3">
            <span class="text-3xl text-cyan">♢</span>
            <strong class="text-2xl">SecureCheck AI</strong>
          </div>
          <small class="block mt-1 font-mono text-xs tracking-widest text-cyan">STAFF PORTAL</small>
        </div>
        <p class="relative z-10 text-gray-200 leading-relaxed max-w-[310px]">
          Authorized personnel only. All access attempts are logged and monitored by the Aegis security framework.
        </p>
        <button
          class="relative z-10 self-start text-white border border-navy-300 rounded px-4 py-3 font-mono text-xs hover:bg-navy-700 transition-colors"
          @click="$emit('switchToStudent')"
        >
          ♧ Login as Student
        </button>
      </div>

      <!-- Form panel -->
      <form class="min-h-[600px] w-full bg-surface p-6 pt-8 sm:p-10 lg:w-[598px] lg:p-16 lg:pt-14" @submit.prevent="handleSubmit">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-3xl text-cyan">♢</span>
          <strong class="text-2xl">SecureCheck AI</strong>
        </div>

        <div class="mt-12 mb-8">
          <h1 class="text-4xl tracking-tight">Sign In</h1>
          <p class="text-gray-600 mt-2 text-base">Enter your staff credentials to continue.</p>
        </div>

        <label class="block text-ink font-mono text-[11px] tracking-wide mt-5">
          STAFF EMAIL
          <input v-model="email" type="email" required class="input-field mt-2" placeholder="you@institution.edu" />
        </label>

        <label class="block text-ink font-mono text-[11px] tracking-wide mt-5">
          PASSWORD
          <PasswordInput v-model="password" class="mt-2" autocomplete="current-password" :required="true" />
        </label>

        <p v-if="errorMsg" class="mt-4 text-sm text-danger">{{ errorMsg }}</p>

        <label class="flex items-center gap-2.5 mt-5 text-sm text-ink">
          <input v-model="remember" type="checkbox" class="w-[18px] h-[18px] accent-cyan" />
          Remember Me on this device
        </label>

        <button type="submit" :disabled="loading" class="w-full bg-navy-light text-white rounded-md py-3.5 mt-8 text-lg font-bold hover:bg-navy transition-colors disabled:opacity-50">
          {{ loading ? 'Working...' : 'Authenticate' }} <span class="text-cyan ml-4">→</span>
        </button>

        <p class="mt-4 text-center text-xs text-gray-500">
          Need an account? Ask a system administrator to add you under Settings → Staff Accounts.
        </p>

      </form>
    </div>
  </div>
</template>
