<script setup lang="ts">
import { ref } from 'vue'
import { usePortal } from '~/composables/usePortal'

const emit = defineEmits<{ signOut: [] }>()

const { completePasswordChange, needsCurrentPassword, currentUser } = usePortal()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleSubmit = async () => {
  errorMsg.value = ''
  if (needsCurrentPassword.value && !currentPassword.value) {
    errorMsg.value = 'Enter your current (temporary) password.'
    return
  }
  if (!newPassword.value) {
    errorMsg.value = 'Enter a new password.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = 'The new passwords do not match.'
    return
  }
  loading.value = true
  try {
    const res = await completePasswordChange(newPassword.value, currentPassword.value || undefined)
    if (!res.success) errorMsg.value = res.error || 'Unable to change password.'
    // On success the portal state flips and app.vue swaps this view out.
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center p-10 bg-navy relative">
    <div class="fixed inset-0 opacity-15 pointer-events-none" style="background-image: radial-gradient(#1680a3 1px, transparent 1px); background-size: 34px 34px;"></div>

    <form class="relative z-10 w-full max-w-[440px] bg-surface rounded-xl shadow-2xl p-12" @submit.prevent="handleSubmit">
      <div class="flex items-center gap-3">
        <span class="text-3xl text-cyan">♢</span>
        <strong class="text-2xl">SecureCheck AI</strong>
      </div>

      <div class="mt-10 mb-6">
        <h1 class="text-3xl tracking-tight">Set a new password</h1>
        <p class="text-gray-600 mt-2 text-sm">
          Your account was created with a temporary password. Choose a new one to continue{{ currentUser?.name ? `, ${currentUser.name}` : '' }}.
        </p>
      </div>

      <label v-if="needsCurrentPassword" class="block text-ink font-mono text-[11px] tracking-wide mt-5">
        CURRENT / TEMPORARY PASSWORD
        <PasswordInput v-model="currentPassword" class="mt-2" autocomplete="current-password" :required="true" />
      </label>

      <label class="block text-ink font-mono text-[11px] tracking-wide mt-5">
        NEW PASSWORD
        <PasswordInput v-model="newPassword" class="mt-2" autocomplete="new-password" :required="true" />
      </label>

      <label class="block text-ink font-mono text-[11px] tracking-wide mt-5">
        CONFIRM NEW PASSWORD
        <PasswordInput v-model="confirmPassword" class="mt-2" autocomplete="new-password" :required="true" />
      </label>

      <p v-if="errorMsg" class="mt-4 text-sm text-danger">{{ errorMsg }}</p>

      <button type="submit" :disabled="loading" class="w-full bg-navy-light text-white rounded-md py-3.5 mt-8 text-lg font-bold hover:bg-navy transition-colors disabled:opacity-50">
        {{ loading ? 'Updating…' : 'Update Password' }} <span class="text-cyan ml-3">→</span>
      </button>

      <button type="button" class="w-full text-center mt-4 text-sm text-gray-600 hover:text-cyan transition-colors" @click="$emit('signOut')">
        Sign out instead
      </button>
    </form>
  </div>
</template>
