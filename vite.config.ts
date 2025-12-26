import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["localhost", "127.0.0.1", "cdnn.evict.bot"],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/cdn': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
    historyApiFallback: true,
  },
  preview: {
    port: 8080,
    host: "::",
  },
  publicDir: "src/public",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
