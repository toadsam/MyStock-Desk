import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export default defineConfig({
  cacheDir: process.env.VITE_CACHE_DIR ?? join(tmpdir(), 'stockflow-vite-cache'),
  plugins: [react(), tailwindcss()],
})
