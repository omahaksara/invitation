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


const openingMotionContracts = {
  "aksara-nocturne": "oaNocturnePortalClose",
  "atelier-editorial": "oaAtelierPageTurn",
  "botanical-garden": "oaBotanicalPetalClose",
  "elegance": "oaEleganceIrisClose",
  "sagara": "oaSagaraTideRetreat"
};
for (const [slug, animationName] of Object.entries(openingMotionContracts)) {
  const template = read("templates/" + slug + "/index.html");
  assert.ok(template.includes("@keyframes " + animationName),
    slug + ": opening choreography must have its own named keyframe.");
  assert.ok(template.includes("animation:" + animationName),
    slug + ": cover does not invoke its theme-specific opening choreography.");
  assert.ok(template.includes("prefers-reduced-motion:reduce"),
    slug + ": opening choreography lacks reduced-motion handling.");
}
const browserSmoke = read("scripts/smoke-templates.cjs");
assert.ok(browserSmoke.includes("../tests/fixtures/theme-demo.json"),
  "Browser smoke must load the isolated test fixture, not client JSON.");
assert.ok(!browserSmoke.includes("route.fetch()"),
  "Browser smoke must not fetch clients/*/data.json from the static server.");
assert.ok(browserSmoke.includes("Protected client JSON is not served by browser smoke."),
  "Browser smoke server must reject direct client JSON reads.");
assert.ok(browserSmoke.includes("mobile-360"),
  "Browser smoke must capture the 360px cover pass.");
const isolatedFixture = JSON.parse(read("tests/fixtures/theme-demo.json"));
assert.ok(Object.values(isolatedFixture.events || {}).length > 0 &&
  Object.values(isolatedFixture.events || {}).every(event =>
    !event.coordinates && event.latitude == null && event.longitude == null &&
    typeof event.mapNote === "string" && event.mapNote.length > 0
  ), "Isolated browser fixture must keep synthetic event locations unpinned before interception.");

// The 3D runtime is a progressive enhancement: each pilot must declare a
// real cover surface and at least one independently layered visual element.
const depthPilots = {
  karsa: { surface: "#cover", layers: ["#cover-image", ".cover-gradient", ".cover-ampersand"] },
  "royal-vintage": { surface: ".hero", layers: [".hero-cover-image", ".hero .hero-content"] },
  sirein: { surface: ".sirein-cover", layers: [".sirein-cover__image", ".sirein-cover__veil", ".sirein-cover__content"] },
  "botanical-garden": { surface: "#cover-section", layers: [".cover-photo", ".cover-grain", ".cover-orbit"] },
  nexus: { surface: ".nexus-cover", layers: [".nexus-cover__visual", ".nexus-cover__panel", ".nexus-cover__line"] },
  "aksara-nocturne": { surface: ".cover", layers: [".cover > img", ".arch"] }
};
for (const [slug, contract] of Object.entries(depthPilots)) {
  const template = read("templates/" + slug + "/index.html");
  const declaration = template.match(/depthMotion\(\{ surface: "([^"]+)", layers: \[([\s\S]*?)\] \}\)/);
  assert.ok(declaration, slug + ": konfigurasi 3D harus mendeklarasikan surface dan layers secara eksplisit.");
  assert.equal(declaration[1], contract.surface, slug + ": surface 3D berubah tanpa memperbarui kontrak uji.");
  for (const selector of contract.layers) {
    assert.ok(declaration[2].includes('selector: "' + selector + '"'),
      slug + ": layer 3D tidak terdaftar: " + selector);
    const token = selector.split(/\s|>/)[0].replace(/^\./, "").replace(/^#/, "");
    assert.ok(template.includes(token), slug + ": selector layer tidak ditemukan di template: " + selector);
  }
}
assert.ok(runtime.includes("data-oa-depth-surface"), "Runtime tidak menandai surface 3D aktif.");
assert.ok(runtime.includes("data-oa-depth-layer"), "Runtime tidak menandai layer 3D aktif.");
assert.ok(runtime.includes("pointermove") && runtime.includes("pointerleave"),
  "Runtime tidak mengelola tilt pointer dan reset saat pointer keluar.");
assert.ok(runtime.includes("cancelAnimationFrame(frame)"),
  "Runtime tidak membatalkan frame animasi saat cleanup.");
assert.ok(runtime.includes("void surface.offsetWidth"),
  "Entrance 3D harus mengunci state awal sebelum transisi reveal.");
assert.ok(runtime.includes("previousSurfaceVars"),
  "Cleanup 3D harus memulihkan custom properties surface sebelumnya.");
console.log("Theme program contract passed for " + programs.length + " themes and " + Object.keys(depthPilots).length + " 3D depth pilots.");


// Army / Aksav are protected legacy client themes: keep their templates out of
// theme-owned motion programs and exclude them from the generic depth fallback.
const protectedLegacyThemes = ["army", "aksav"];
for (const slug of protectedLegacyThemes) {
  const template = read("templates/" + slug + "/index.html");
  assert.ok(!template.includes('OAThemePrograms.register("' + slug + '"'),
    slug + ": protected legacy template must not register a new theme program.");
}
assert.ok(runtime.includes('const protectedLegacyThemes = new Set(["army", "aksav"]);'),
  "Protected legacy themes must be explicit in the shared theme runtime.");
assert.ok(runtime.includes("!protectedLegacyThemes.has(slug)"),
  "Generic 3D depth fallback must skip protected legacy themes.");
