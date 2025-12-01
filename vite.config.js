import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path must match the GitHub repository name for proper GitHub Pages deployment
  // For https://jukkan.github.io/dataverse-capacity/, the base path is '/dataverse-capacity/'
  base: '/dataverse-capacity/',
})
