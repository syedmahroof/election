import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Laravel Valet uses ./public as the document root when this folder exists.
// Build must output here so https://firaz.test/ serves index.html.
export default defineConfig({
  plugins: [react()],
  publicDir: "static",
  build: {
    outDir: "public",
    emptyOutDir: true,
  },
});
