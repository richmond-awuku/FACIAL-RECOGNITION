<script setup lang="ts">
import { ref } from 'vue'

withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  autocomplete?: string
  required?: boolean
  id?: string
}>(), {
  placeholder: '••••••••',
  autocomplete: 'current-password',
  required: false,
})

defineEmits<{ 'update:modelValue': [value: string] }>()

const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      :type="visible ? 'text' : 'password'"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      class="input-field pr-11"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      tabindex="-1"
      class="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-cyan-dark transition-colors"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <!-- eye -->
      <svg v-if="!visible" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <!-- eye-off -->
      <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.5 18.5 0 0 0 2 12s3.5 7 10 7a9.12 9.12 0 0 0 5.39-1.61" />
        <line x1="2" y1="2" x2="22" y2="22" />
      </svg>
    </button>
  </div>
</template>
