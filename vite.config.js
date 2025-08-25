import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwind(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TyDy',
        short_name: 'TyDy',
        description: 'Simplifica, verifica y gestiona tareas fácilmente.',
        start_url: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0A2A47",
        icons: [
          {
            src: "/web-app-manifest-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/web-app-manifest-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "/favicon-96x96.png",
            sizes: "96x96",
            type: "image/png"
          },
          {
            src: "/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png"
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
      },
    })
  ],
})
