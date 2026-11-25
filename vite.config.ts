import { cloudflare } from '@cloudflare/vite-plugin'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    cloudflare({
      // Share local bindings (D1/R2/DO) with the login worker in ../ebichu.
      persistState: { path: '../.ebichu-state' },
    }),
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
