import { build } from "esbuild";

build({
  entryPoints: ["src/lib/runtime/index.ts"],
  bundle: true,
  format: "esm",
  outfile: "public/runtime.js",
  platform: "browser",
  target: "es2020",
  external: ["zod"], // zod will be imported from CDN at runtime; remove to bundle
  logLevel: "info",
}).catch(() => process.exit(1));