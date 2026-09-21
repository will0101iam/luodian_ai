import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, "index.html"),
        cases: resolve(import.meta.dirname, "cases/index.html"),
        demos: resolve(import.meta.dirname, "demos/index.html"),
        about: resolve(import.meta.dirname, "about/index.html"),
      },
    },
  },
});
