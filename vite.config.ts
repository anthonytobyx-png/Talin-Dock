import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { offlineShell } from "./scripts/offline";
export default defineConfig({
  plugins: [react(), offlineShell()],
  build: { target: "safari15", cssTarget: "safari15" },
});
