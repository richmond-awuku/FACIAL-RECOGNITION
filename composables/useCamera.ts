import { ref } from 'vue'

// Minimal webcam helper shared by the student self-enroll flow and the
// admin roster "verify" (staff-supervised enrollment) flow.
export function useCamera() {
  const videoRef = ref<HTMLVideoElement | null>(null)
  const ready = ref(false)
  const cameraError = ref('')
  let stream: MediaStream | null = null

  function getStream(constraints: MediaStreamConstraints): Promise<MediaStream> {
    const md: any = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined
    if (md?.getUserMedia) return md.getUserMedia(constraints)
    // Legacy prefixed fallback (older Safari/Chrome).
    const legacy: any = typeof navigator !== 'undefined'
      ? (navigator as any).getUserMedia || (navigator as any).webkitGetUserMedia || (navigator as any).mozGetUserMedia
      : undefined
    if (legacy) return new Promise((res, rej) => legacy.call(navigator, constraints, res, rej))
    return Promise.reject(new Error('NO_MEDIA_DEVICES'))
  }

  async function open() {
    cameraError.value = ''
    ready.value = false
    try {
      stream = await getStream({ video: { width: 640, height: 480, facingMode: 'user' } })
      if (videoRef.value) {
        videoRef.value.srcObject = stream
        await videoRef.value.play()
      }
      ready.value = true
    } catch (e: any) {
      const secure = typeof window !== 'undefined' && window.isSecureContext
      if (e?.message === 'NO_MEDIA_DEVICES' || !secure) {
        cameraError.value = secure
          ? 'This browser does not expose a camera API.'
          : 'Camera needs a secure page. Open the app at http://localhost (not a LAN IP) or over HTTPS.'
      } else if (e?.name === 'NotAllowedError') {
        cameraError.value = 'Camera permission denied. Allow it in the browser and retry.'
      } else if (e?.name === 'NotFoundError' || e?.name === 'DevicesNotFoundError') {
        cameraError.value = 'No camera was found on this device.'
      } else {
        cameraError.value = 'Unable to access camera. ' + (e?.message || 'Please grant camera permission and retry.')
      }
    }
  }

  function close() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      stream = null
    }
    ready.value = false
  }

  function grabFrame(quality = 0.9, maxWidth?: number): Promise<Blob | null> {
    return new Promise((resolve) => {
      const v = videoRef.value
      if (!v || !v.videoWidth) return resolve(null)
      const canvas = document.createElement('canvas')
      const scale = maxWidth && v.videoWidth > maxWidth ? maxWidth / v.videoWidth : 1
      canvas.width = Math.round(v.videoWidth * scale)
      canvas.height = Math.round(v.videoHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    })
  }

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

  return { videoRef, ready, cameraError, open, close, grabFrame, wait }
}
