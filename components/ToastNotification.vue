<script setup lang="ts">
const props = defineProps<{
  message: string
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="message"
        class="fixed right-6 bottom-6 bg-navy text-white px-4 py-3.5 border-l-4 border-cyan rounded-md shadow-xl z-50 text-sm"
      >
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>
