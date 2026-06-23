export default defineNuxtConfig({
  compatibilityDate: '2025-04-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
  nitro: {
    preset: 'static',
    output: {
      dir: 'dist',
      publicDir: 'dist',
    },
  },
  app: {
    baseURL: '/',
  },
})
