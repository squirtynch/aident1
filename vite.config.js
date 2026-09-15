import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Detect if running in Tauri
const isTauri = process.env.TAURI_ENV === 'true' || process.env.TAURI_PLATFORM !== undefined;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Prevent vite from obscuring Rust errors
  clearScreen: false,
  
  // Tauri expects a fixed port
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
  
  // Environment variables
  envPrefix: ['VITE_', 'TAURI_'],
  
  build: {
    // Tauri uses Chromium on Windows and Linux and WebKit on macOS
    target: isTauri ? ['es2021', 'chrome100', 'safari13'] : ['es2021', 'chrome100'],
    // Don't minify for debug builds
    minify: !isTauri ? 'esbuild' : false,
    // Produce sourcemaps for debug builds
    sourcemap: isTauri ? !!process.env.TAURI_DEBUG : false,
  },
});
