// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";

// Repunta los módulos Supabase autogenerados al proyecto Supabase propio
// (ver src/config/supabase.runtime.ts). No se modifican los archivos generados.
const supabaseOverrides: Record<string, string> = {
  "@/integrations/supabase/client": "src/integrations/supabase/client.custom.ts",
  "@/integrations/supabase/client.server": "src/integrations/supabase/client.server.custom.ts",
  "@/integrations/supabase/auth-middleware": "src/integrations/supabase/auth-middleware.custom.ts",
  "../supabase/client": "src/integrations/supabase/client.custom.ts",
  "./client": "src/integrations/supabase/client.custom.ts",
};

function supabaseRepointPlugin() {
  return {
    name: "supabase-repoint-own-project",
    enforce: "pre" as const,
    resolveId(source: string, importer?: string) {
      const target = supabaseOverrides[source];
      if (!target) return null;
      // Las rutas relativas solo se redirigen dentro de src/integrations/**
      if (source.startsWith(".") && !importer?.includes("/src/integrations/")) return null;
      return path.resolve(process.cwd(), target);
    },
  };
}

export default defineConfig({
  vite: {
    plugins: [supabaseRepointPlugin()],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
