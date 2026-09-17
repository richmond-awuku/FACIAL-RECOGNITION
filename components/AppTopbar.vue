<script setup lang="ts">
import { usePortal } from '~/composables/usePortal'

const { portal, currentUser } = usePortal()

const searchPlaceholder = computed(() =>
  portal.value === 'student' ? 'Search portal...' : 'Search system data...'
)
</script>

<template>
  <header class="min-h-[72px] border-b border-[#dfe5eb] bg-[#f8fafb] flex items-center justify-between gap-4 px-7 max-md:flex-wrap max-md:px-4 max-md:py-3">
    <div class="w-[420px] max-w-full flex items-center gap-3.5 rounded-full border border-[#dfe5eb] bg-white px-4 py-2.5 shadow-[0_1px_0_rgba(15,23,42,0.02)]">
      <span class="text-[15px] text-[#64748b]">⌕</span>
      <input
        :placeholder="searchPlaceholder"
        class="w-full border-0 bg-transparent text-[14px] text-[#1f2d3d] placeholder:text-[#94a3b8] outline-none"
      />
    </div>

    <div class="flex items-center gap-3 max-md:ml-auto">
      <button class="flex h-9 w-9 items-center justify-center rounded-full text-lg text-[#1f2d3d] transition hover:bg-white hover:shadow-sm">◌</button>
      <button class="relative flex h-9 w-9 items-center justify-center rounded-full text-lg text-[#1f2d3d] transition hover:bg-white hover:shadow-sm">
        ⍰
        <span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#2fb3d4] text-[9px] font-bold text-white">?</span>
      </button>
      <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-[#dfe8f3] bg-[linear-gradient(135deg,#c8dfe8,#8ea8ba)] text-[10px] font-bold text-[#1f2d3d]">
        <img v-if="currentUser?.avatarUrl" :src="currentUser.avatarUrl" alt="" class="h-full w-full object-cover" />
        <span v-else>{{ currentUser?.id || 'AU' }}</span>
      </div>
    </div>
  </header>
</template>
