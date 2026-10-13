export default defineNuxtConfig({
  compatibilityDate: "2024-04-03",
  devtools: { enabled: false },
  ssr: false,
  nitro: {
    preset: "vercel",
  },

  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css"],

  runtimeConfig: {
    public: {
      backendUrl:
        process.env.NUXT_PUBLIC_BACKEND_URL ||
        "https://facial-recorgnition-and-attendance-system.onrender.com",
    },
  },
});
