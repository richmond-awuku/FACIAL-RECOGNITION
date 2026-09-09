<script setup lang="ts">
import { usePortal } from '~/composables/usePortal'

const { portal, currentUser } = usePortal()

const searchPlaceholder = computed(() =>
  portal.value === 'student' ? 'Search portal...' : 'Search system data...'
)
</script>

<template>
  <header class="h-[60px] border-b border-gray-300 flex items-center justify-between px-7 bg-gray-50">
    <div class="w-[365px] flex items-center gap-3.5 text-gray-500">
      <span class="text-2xl -rotate-12">⌕</span>
      <input
        :placeholder="searchPlaceholder"
        class="bg-transparent border-0 outline-none w-full text-ink"
      />
    </div>
    <div class="flex items-center gap-6">
      <button class="text-xl text-ink hover:text-cyan transition-colors">?</button>
      <div
        class="w-8 h-8 rounded-full bg-cyan-light text-[10px] font-bold border-2 border-cyan flex items-center justify-center"
      >
        {{ currentUser?.id || 'AU' }}
      </div>
    </div>
  </header>
</template>
