// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts
    server: { entry: "server" },
  },
  nitro: {
    preset: process.env["NITRO_PRESET"] || "vercel",
    externals: {
      inline: [
        "tslib",
        "@supabase/supabase-js",
        "@supabase/functions-js",
        "@supabase/postgrest-js",
        "@supabase/auth-js",
        "@supabase/realtime-js",
        "@supabase/storage-js",
      ],
    },
  },
  vite: {
    ssr: {
      noExternal: ["tslib", "@supabase/supabase-js"],
    },
    // Arena previews proxy the dev server through a generated hostname.
    server: { allowedHosts: true },
  },
});