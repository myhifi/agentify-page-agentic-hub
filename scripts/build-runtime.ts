import { build } from "esbuild";

build({
  entryPoints: ["src/lib/runtime/index.ts"],
  bundle: true,
  format: "esm",
  outfile: "public/runtime.js",
  platform: "browser",
  target: "es2020",
  logLevel: "info",
}).catch(() => process.exit(1));