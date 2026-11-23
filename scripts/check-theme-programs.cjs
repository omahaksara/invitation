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
assert.ok(runtime.includes("navigation: context.navigation || document.getElementById(\"oa-floating-controls\")"),
  "Program tema harus menerima handle navigasi bersama tanpa mengambil alih perilakunya.");
assert.ok(engine.includes("overlay.dataset.oaTheme"),
  "Overlay galeri harus mengekspos identitas tema untuk presentasi khusus.");
assert.ok(engine.includes('document.documentElement.style.overflow = "hidden"') && engine.includes("previousOverflow.html"),
  "Dialog galeri harus mengunci scroll sementara dan memulihkan nilai overflow sebelumnya.");

const programs = [
  "karsa",
  "royal-vintage",
  "aksara-nocturne",
  "sirein",
  "botanical-garden",
  "nexus",
  "aksara-signature",
  "aksara-velora",
  "atelier-editorial",
  "lumina",
  "kencana-jawa",
  "sagara",
  "serena-ivory",
  "groom",
  "kinze",
  "aurelia-noir",
  "lumiere-bloom",
  "romantic-floral",
  "aksav",
  "army",
  "earty",
  "lume",
  "nox",
  "taupe",
  "calestial",
  "elegance",
  "gebyok-candra",
  "jendela-senja",
  "luma",
  "sunda-watercolor",
  "velvet-romance"
];
for (const slug of programs) {
  const template = read("templates/" + slug + "/index.html");
  assert.ok(template.includes('register("' + slug + '"'),
    slug + ": program tema belum terdaftar pada template.");
  assert.ok(template.includes("addCleanup(") || template.includes("return () =>"),
    slug + ": program tema tidak membersihkan resource saat dilepas.");
  assert.ok(template.includes("navigation.classList.add(\"oa-nav-"),
    slug + ": tema belum memasang presentasi navigasi independen.");
  const overlaySelector = ".oa-gallery-lightbox[data-oa-theme=\"" + slug + "\"]";
  const escapedOverlaySelector = ".oa-gallery-lightbox[data-oa-theme=\\\"" + slug + "\\\"]";
  assert.ok(template.includes(overlaySelector) || template.includes(escapedOverlaySelector),
    slug + ": overlay galeri belum memiliki presentasi khusus tema.");
  const navClass = (template.match(/navigation\.classList\.add\("(oa-nav-[a-z0-9-]+)"\)/) || [])[1];
  assert.ok(navClass, slug + ": program tema belum memasang kelas navigasi.");
  assert.ok(template.includes("#oa-floating-controls." + navClass),
    slug + ": kelas navigasi tidak memiliki aturan presentasi khusus.");
  assert.ok(template.includes("prefers-reduced-motion:reduce"),
    slug + ": navigasi atau overlay belum menyediakan fallback gerak minim.");
}
console.log("Theme program contract passed for " + programs.length + " themes.");
