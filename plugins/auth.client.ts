// localStorage is only available in the browser. Restore after hydration so
// the server and initial client render use the same unauthenticated state.
export default defineNuxtPlugin((nuxtApp) => {
  const { restoreSession } = usePortal()
  nuxtApp.hook('app:mounted', restoreSession)
})
