// Copies the pdf.js worker into /public so it is served from our own origin and always
// matches the installed pdfjs-dist version. Runs on install, dev and build.
// Saved as .js, not .mjs: some hosts (e.g. Hostinger) serve .mjs as text/plain, and browsers refuse
// to start a module worker that isn't served as JavaScript.
import { copyFileSync, mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve("pdfjs-dist/package.json")), "build", "pdf.worker.min.mjs");
mkdirSync("public", { recursive: true });
copyFileSync(source, join("public", "pdf.worker.min.js"));
rmSync(join("public", "pdf.worker.min.mjs"), { force: true });
