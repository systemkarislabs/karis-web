export default defineNuxtConfig({
  ssr: false,
  nitro: { preset: "node-server" },
  compatibilityDate: "2025-05-12",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/i18n",
  ],
  css: ["~/assets/css/main.css"],
  i18n: {
    defaultLocale: "pt-BR",
    locales: [{ code: "pt-BR", name: "Português" }],
    vueI18n: "./i18n.config.ts",
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || "http://localhost:3000",
    },
  },
  routeRules: {
    "/**": {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
    "/_nuxt/**": {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
    "/super-admin/**": { ssr: false },
  },
  typescript: {
    strict: true,
    shim: false,
  },
  tailwindcss: {
    cssPath: "~/assets/css/main.css",
    configPath: "tailwind.config.ts",
  },
  app: {
    head: {
      title: "Karis Atende",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "description", content: "Plataforma de atendimento inteligente com IA para WhatsApp" },
      ],
      link: [
        { rel: "icon", href: "/favicon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
      ],
    },
  },
});
