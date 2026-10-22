<script setup lang="ts">
import { ref } from 'vue'
import { usePortal } from '~/composables/usePortal'

const props = withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
const { currentUser, profileImage, setProfileImage } = usePortal()
const fileInput = ref<HTMLInputElement | null>(null)
const error = ref('')
const saving = ref(false)
const initials = currentUser.value?.name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase() || 'U'

function openPicker() {
  fileInput.value?.click()
}

defineExpose({ openPicker })

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('The selected file is not a valid image.'))
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Image processing is unavailable in this browser.'))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  error.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = 'Choose an image file.'
    input.value = ''
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    error.value = 'Choose an image smaller than 10 MB.'
    input.value = ''
    return
  }
  saving.value = true
  try {
    setProfileImage(await resizeImage(file))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to save this image.'
  } finally {
    saving.value = false
    input.value = ''
  }
}

function removeImage() {
  error.value = ''
  try {
    setProfileImage(null)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to remove this image.'
  }
}
</script>

<template>
  <div>
    <input ref="fileInput" type="file" accept="image/*" class="sr-only" @change="uploadImage" />
    <section v-if="!props.compact" class="card flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
      <div class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-light text-xl font-bold text-navy" aria-label="Profile image preview">
        <img v-if="profileImage" :src="profileImage" alt="Profile" class="h-full w-full object-cover" />
        <span v-else>{{ initials }}</span>
      </div>
      <div class="min-w-0 flex-1">
        <h2 class="font-semibold">Profile photo</h2>
        <p class="mt-1 text-sm text-gray-500">Choose an image up to 10 MB. It will be resized before saving on this device.</p>
        <p v-if="error" class="mt-2 text-sm text-danger" role="alert">{{ error }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
        <button type="button" class="btn-outline" :disabled="saving" @click="fileInput?.click()">
          {{ saving ? 'Saving photo...' : profileImage ? 'Change photo' : 'Upload photo' }}
        </button>
        <button v-if="profileImage" type="button" class="btn-outline" :disabled="saving" @click="removeImage">Remove</button>
        </div>
      </div>
    </section>
    <p v-if="props.compact && error" class="sr-only" role="alert">{{ error }}</p>
  </div>
</template>