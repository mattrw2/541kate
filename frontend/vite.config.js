import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// Build output goes to `build/` (not Vite's default `dist/`) so the existing
// deploy config keeps working.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 3000 },
  build: { outDir: "build" },
})
