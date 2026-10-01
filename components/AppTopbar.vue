<script setup lang="ts">
import { computed } from 'vue'
import { usePortal } from '~/composables/usePortal'

const { portal, currentUser } = usePortal()
const displayName = computed(() => currentUser.value?.name || currentUser.value?.email || '')
const initials = computed(() => displayName.value.split(/\s+/).filter(Boolean).map((part: string) => part[0]).slice(0, 2).join('').toUpperCase())
</script>

<template>
  <header class="flex min-h-[72px] items-center justify-end border-b border-[#dfe5eb] bg-[#f8fafb] px-4 sm:px-7">
    <div v-if="displayName" class="flex min-w-0 items-center gap-3">
      <span class="hidden truncate text-sm text-[#475569] sm:block">{{ displayName }}</span>
      <span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#dfe8f3] bg-[#e8f2ff] text-[10px] font-bold text-[#1f2d3d]">
        {{ initials || (portal === 'student' ? 'ST' : 'AU') }}
      </span>
    </div>
  </header>
</template>
