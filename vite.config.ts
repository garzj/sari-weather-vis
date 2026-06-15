import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// relative base so the build runs from any subpath of the origin
export default defineConfig({
  base: './',
  plugins: [react()],
})
