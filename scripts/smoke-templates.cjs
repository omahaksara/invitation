const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const themes = [
  { slug: "karsa", marker: "#open-btn", open: "#open-btn", cover: "#cover" },
  { slug: "royal-vintage", marker: ".invitation-container", open: null, cover: null },
  { slug: "sirein", marker: ".sirein-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aksara-signature", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const theme of themes) {
      const page = await browser.newPage();
      const pageErrors = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      const url = `http://127.0.0.1:4173/?c=demo-katalog&theme=${theme.slug}&to=Nama+Tamu`;
      try {
        const response = await page.goto(url, { waitUntil: "domcontentloaded" });
        assert.ok(response && response.ok(), theme.slug + ": halaman utama gagal dimuat");
        await page.waitForSelector(theme.marker, { state: "attached", timeout: 10000 });
        await page.waitForFunction(() => {
          const el = document.querySelector('[data-bind="couple.groom.nickname"]');
          return el && el.textContent.trim() === "Arkan";
        }, undefined, { timeout: 10000 });

        assert.equal((await page.locator("#nama-tamu").textContent()).trim(), "Nama Tamu",
          theme.slug + ": nama tamu tidak terbaca");
        assert.equal((await page.locator('[data-bind="couple.bride.nickname"]').first().textContent()).trim(), "Sekar",
          theme.slug + ": nama mempelai wanita tidak terbaca");
        if (theme.slug === "aksara-signature") {
          await page.waitForFunction(() => Boolean(document.querySelector("#app style")), undefined, { timeout: 5000 });
        }
        assert.ok(await page.locator("#bg-music").getAttribute("src"),
          theme.slug + ": sumber musik tidak terisi");

        if (theme.open) {
          await page.locator(theme.open).click();
          await page.waitForFunction(() => {
            const cover = document.getElementById("cover") || document.getElementById("cover-section");
            return !cover || cover.hidden || getComputedStyle(cover).display === "none";
          }, undefined, { timeout: 5000 });
        }

        const musicControl = page.locator("#music-toggle, #music-btn").first();
        await musicControl.waitFor({ state: "visible", timeout: 5000 });
        assert.equal(pageErrors.length, 0, theme.slug + ": JavaScript error: " + pageErrors.join("; "));
        console.log("PASS " + theme.slug);
      } catch (error) {
        let debug = {};
        try {
          debug = await page.evaluate(selector => {
            const el = document.querySelector(selector);
            const cover = document.getElementById("cover") || document.getElementById("cover-section");
            const style = el ? getComputedStyle(el) : null;
            return {
              appText: (document.getElementById("app")?.innerText || "").slice(0, 240),
              markerFound: Boolean(el),
              markerStyle: style ? { display: style.display, visibility: style.visibility, opacity: style.opacity, rect: el.getBoundingClientRect().toJSON() } : null,
              coverStyle: cover ? { display: getComputedStyle(cover).display, visibility: getComputedStyle(cover).visibility } : null
            };
          }, theme.marker);
        } catch {}
        const message = error && error.message ? error.message : String(error);
        failures.push(theme.slug + ": " + message);
        console.error("FAIL " + theme.slug + ": " + message + " DEBUG " + JSON.stringify(debug));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  assert.equal(failures.length, 0, failures.join("\n"));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
