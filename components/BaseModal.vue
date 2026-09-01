<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title: string
  message: string
  icon?: string
  buttonText?: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-navy/80 grid place-items-center z-50"
      @click.self="$emit('close')"
    >
      <div class="bg-white w-full max-w-md rounded-lg p-8 relative text-center mx-4">
        <button
          class="absolute top-2.5 right-3.5 text-2xl border-0 bg-transparent"
          @click="$emit('close')"
        >×</button>
        <span class="text-4xl text-cyan block mb-2">{{ icon || '⌾' }}</span>
        <h2 class="text-xl font-bold mb-2">{{ title }}</h2>
        <p class="text-muted leading-relaxed mb-4">{{ message }}</p>
        <slot />
        <button class="btn-primary w-full mt-4" @click="$emit('confirm')">
          {{ buttonText || 'Confirm' }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
