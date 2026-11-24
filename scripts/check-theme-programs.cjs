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
  "depthMotion(options = {})",
  "requestAnimationFrame(render)",
  "prefers-reduced-motion:reduce",
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
  assert.ok(template.includes("addCleanup(") || /return\s*\(\s*\)\s*=>/.test(template),
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
const karsa = read("templates/karsa/index.html");
assert.ok(karsa.includes("depthMotion({ surface:"), "karsa: 3D depth motion belum dipasang.");
assert.ok(karsa.includes("depthMotion })"), "karsa: API depthMotion belum diterima oleh program tema.");
const royalvintage = read("templates/royal-vintage/index.html");
assert.ok(royalvintage.includes("depthMotion({ surface:"), "royal-vintage: 3D depth motion belum dipasang.");
assert.ok(royalvintage.includes("depthMotion })"), "royal-vintage: API depthMotion belum diterima oleh program tema.");
const sirein = read("templates/sirein/index.html");
assert.ok(sirein.includes("depthMotion({ surface:"), "sirein: 3D depth motion belum dipasang.");
assert.ok(sirein.includes("depthMotion })"), "sirein: API depthMotion belum diterima oleh program tema.");
const botanicalgarden = read("templates/botanical-garden/index.html");
assert.ok(botanicalgarden.includes("depthMotion({ surface:"), "botanical-garden: 3D depth motion belum dipasang.");
assert.ok(botanicalgarden.includes("depthMotion })"), "botanical-garden: API depthMotion belum diterima oleh program tema.");
const nexus = read("templates/nexus/index.html");
assert.ok(nexus.includes("depthMotion({ surface:"), "nexus: 3D depth motion belum dipasang.");
assert.ok(nexus.includes("depthMotion })"), "nexus: API depthMotion belum diterima oleh program tema.");
const aksaranocturne = read("templates/aksara-nocturne/index.html");
assert.ok(aksaranocturne.includes("depthMotion({ surface:"), "aksara-nocturne: 3D depth motion belum dipasang.");
assert.ok(aksaranocturne.includes("depthMotion })"), "aksara-nocturne: API depthMotion belum diterima oleh program tema.");
console.log("Theme program contract passed for " + programs.length + " themes.");
