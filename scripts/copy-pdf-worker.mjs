// Copies the pdf.js worker into /public so it is served from our own origin and always
// matches the installed pdfjs-dist version. Runs on install, dev and build.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs");
mkdirSync("public", { recursive: true });
copyFileSync(source, join("public", "pdf.worker.min.mjs"));
