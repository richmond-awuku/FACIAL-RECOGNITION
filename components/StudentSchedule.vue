<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()
const schedule = ref<any[]>([])
const loading = ref(true)
const error = ref('')

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

onMounted(async () => {
  try {
    schedule.value = await api.getMySchedule()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load your schedule.'
  } finally {
    loading.value = false
  }
})

const scheduleItems = computed(() => schedule.value.map((item, index) => {
  const course = typeof item.course === 'object' ? item.course : item
  const rawDay = Number(item.day_of_week)
  const day = item.day_of_week_display || weekdays[rawDay - 1] || 'Day not specified'
  return {
    id: item.id ?? `${item.course ?? course.code ?? index}-${index}`,
    day,
    start: item.start_time || '',
    end: item.end_time || '',
    code: item.course_code || course.code || course.course_code || '',
    name: item.course_name || course.name || course.course_name || '',
    room: item.room || '',
    lecturer: item.lecturer_name || course.lecturer_name || course.professor || '',
  }
}).sort((a, b) => {
  const dayOrder = weekdays.indexOf(a.day) - weekdays.indexOf(b.day)
  return dayOrder || a.start.localeCompare(b.start)
}))
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-3xl tracking-tight">Course Schedule</h1>
      <p class="mt-1.5 text-gray-500">Schedule slots assigned to your enrolled courses.</p>
    </div>
    <p v-if="loading" class="text-sm text-gray-500">Loading schedule...</p>
    <p v-else-if="error" role="alert" class="text-sm text-danger">{{ error }}</p>
    <div v-else-if="scheduleItems.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="item in scheduleItems" :key="item.id" class="card p-5">
        <p class="font-mono text-xs uppercase tracking-wide text-cyan-dark">{{ item.day }}</p>
        <h2 class="mt-2 text-lg font-semibold">{{ item.code }}<template v-if="item.code && item.name">: </template>{{ item.name || 'Course' }}</h2>
        <p v-if="item.start || item.end" class="mt-2 text-sm text-gray-600">
          {{ item.start }}<template v-if="item.end"> – {{ item.end }}</template>
        </p>
        <p v-if="item.room" class="mt-1 text-sm text-gray-500">Room: {{ item.room }}</p>
        <p v-if="item.lecturer" class="mt-1 text-sm text-gray-500">{{ item.lecturer }}</p>
      </article>
    </div>
    <article v-else class="card p-8 text-center text-gray-500">No schedule slots were returned for your courses.</article>
  </section>
</template>
