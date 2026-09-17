// Rehydrate the login session from localStorage tokens on a full page load /
// refresh, before the app renders, so the user isn't bounced to the login
// screen while a valid token is still on disk.
export default defineNuxtPlugin(async () => {
  const { restoreSession } = usePortal()
  await restoreSession()
})
