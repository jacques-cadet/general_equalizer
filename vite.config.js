import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Library build: dist/index.js (ESM), dist/index.cjs, dist/style.css. React stays a peer dependency.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: { entry: "src/index.js", formats: ["es", "cjs"], fileName: (f) => (f === "es" ? "index.js" : "index.cjs"), cssFileName: "style" },
    rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"] },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: { environment: "node" },
});
