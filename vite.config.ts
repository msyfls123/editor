import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    cloudflare(),
    ssrPlugin({
      hotReload: {
        ignore: ['./src/client/**/*.tsx']
      }
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
      alias: {
        "@": path.resolve(path.resolve(), "./src/client"),
      },
    },
})
