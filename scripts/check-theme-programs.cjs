const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const runtime = read("core/theme-programs.js");
const engine = read("core/app.js");

for (const contract of [
  "function register(",
  "function activate(",
  "function deactivate(",
  "function readonlyData(",
  "new AbortController()",
  "prefers-reduced-motion",
  "IntersectionObserver",
  "pagehide"
]) {
  assert.ok(runtime.includes(contract), "Runtime theme program kehilangan kontrak: " + contract);
}
assert.ok(engine.includes("window.OAThemePrograms.activate("),
  "Engine belum mengaktifkan program tema setelah render.");
assert.ok(engine.includes("await activateTemplateScripts(app)"),
  "Script tema harus diaktifkan sebelum render dan registrasi program.");

const programs = [
  "karsa",
  "royal-vintage",
  "aksara-nocturne",
  "sirein",
  "botanical-garden",
  "nexus"
];
for (const slug of programs) {
  const template = read("templates/" + slug + "/index.html");
  assert.ok(template.includes('register("' + slug + '"'),
    slug + ": program tema belum terdaftar pada template.");
  assert.ok(template.includes("addCleanup("),
    slug + ": program tema tidak membersihkan resource saat dilepas.");
  assert.ok(template.includes("reducedMotion"),
    slug + ": program tema belum menerima preferensi reduced-motion.");
}
console.log("Theme program contract passed for " + programs.length + " themes.");
