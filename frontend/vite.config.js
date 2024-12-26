import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    strictPort: true,
    port: 5173,
    hmr: {
      clientPort: 5173,
      protocol: "ws",
    },
  },
});
