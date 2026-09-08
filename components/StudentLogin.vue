<script setup lang="ts">
import { ref } from 'vue'
import { usePortal } from '~/composables/usePortal'

const emit = defineEmits<{
  login: []
  switchToAdmin: []
}>()

const { studentLogin } = usePortal()

const matricNumber = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleSubmit = async () => {
  errorMsg.value = ''
  if (!matricNumber.value.trim()) {
    errorMsg.value = 'Please enter your student ID.'
    return
  }
  if (!password.value) {
    errorMsg.value = 'Please enter your password.'
    return
  }
  loading.value = true
  try {
    const result = await studentLogin(matricNumber.value.trim(), password.value)
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
  <div class="min-h-screen grid place-items-center p-10 bg-navy relative">
    <div class="fixed inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(#1680a3 1px, transparent 1px); background-size: 34px 34px;"></div>

    <div class="relative z-10 flex shadow-2xl rounded-xl overflow-hidden">
      <!-- Visual panel -->
      <div class="w-[430px] min-h-[645px] p-14 flex flex-col items-center justify-center gap-5 text-navy" style="background: linear-gradient(135deg, #dcecf7, #aacce3);">
        <div class="text-7xl text-navy relative z-10">⬡</div>
        <h2 class="text-4xl text-center relative z-10 font-bold">Seamless Campus Flow</h2>
        <p class="relative z-10 max-w-[400px] leading-relaxed text-lg text-navy text-center">
          Your Aegis ID provides secure, frictionless access to university facilities, attendance tracking, and essential student services.
        </p>
        <small class="absolute bottom-12 left-12 font-mono text-[11px] tracking-widest text-navy">● SECURE NODE ACTIVE</small>
      </div>

      <!-- Form panel -->
      <form class="w-[598px] min-h-[645px] bg-surface p-16 pt-12" @submit.prevent="handleSubmit">
        <div class="flex items-center gap-3">
          <span class="text-3xl text-cyan">♢</span>
          <strong class="text-2xl">Aegis ID</strong>
        </div>

        <div class="mt-24 mb-8">
          <h1 class="text-4xl tracking-tight">Student Portal</h1>
          <p class="text-gray-600 mt-2">Enter your Student ID and password to access your secure dashboard.</p>
        </div>

        <label class="block text-ink font-mono text-[11px] tracking-wide mt-6">
          STUDENT ID
          <input v-model="matricNumber" type="text" required class="input-field mt-2" placeholder="e.g. STU-8943-AI" />
        </label>

        <label class="block text-ink font-mono text-[11px] tracking-wide mt-5">
          PASSWORD
          <PasswordInput v-model="password" class="mt-2" autocomplete="current-password" :required="true" />
        </label>

        <p v-if="errorMsg" class="mt-4 text-sm text-danger">{{ errorMsg }}</p>

        <button type="submit" :disabled="loading" class="w-full bg-navy text-white rounded-md py-3.5 mt-8 font-mono text-xs uppercase tracking-wider hover:bg-navy-light transition-colors disabled:opacity-50">
          {{ loading ? 'Verifying...' : 'Sign In' }} <span class="text-cyan ml-4">→</span>
        </button>

        <div class="flex items-center gap-4 mt-10 mb-7 text-gray-500 font-mono text-[11px]">
          <div class="h-px bg-gray-300 flex-1"></div>
          <span>OR</span>
          <div class="h-px bg-gray-300 flex-1"></div>
        </div>

        <button
          type="button"
          class="w-full border border-gray-300 bg-white py-3 rounded-md font-mono text-xs hover:bg-gray-50 transition-colors"
          @click="$emit('switchToAdmin')"
        >
          ♙ Admin / Staff Login
        </button>

        <div class="flex justify-center gap-7 mt-12 text-sm">
          <span class="text-gray-500">ⓘ Help</span>
          <span class="text-cyan">♧ Student Support</span>
        </div>
      </form>
    </div>
  </div>
</template>
