import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isGitHubPages = mode === "production" && process.env.GITHUB_ACTIONS;

  return {
    base: isGitHubPages ? "/qr-poc/" : "/",
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
      },
    },
  };
});
