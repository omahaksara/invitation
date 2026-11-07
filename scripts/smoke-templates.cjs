const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const screenshotDir = "artifacts/visual";
fs.mkdirSync(screenshotDir, { recursive: true });

async function captureScreenshot(page, file) {
  try {
    await page.screenshot({ path: file, fullPage: false, animations: "disabled", timeout: 5000 });
  } catch (error) {
    console.warn("WARN screenshot skipped " + file + ": " + (error?.message || error));
  }
}


async function auditCover(page, theme, device) {
  const cover = page.locator(theme.cover).first();
  assert.equal(await cover.count(), 1, theme.slug + ": elemen cover utama tidak ditemukan");
  assert.equal(await cover.isVisible(), true, theme.slug + ": cover tidak terlihat sebelum dibuka");
  const openButton = page.locator(theme.open).first();
  assert.equal(await openButton.count(), 1, theme.slug + ": tombol buka undangan tidak ditemukan");
  assert.equal(await openButton.isVisible(), true, theme.slug + ": tombol buka tidak terlihat di cover");
  const metrics = await page.evaluate(({ coverSelector, openSelector }) => {
    const root = document.querySelector(coverSelector);
    const button = document.querySelector(openSelector);
    if (!root || !button) return null;
    const box = root.getBoundingClientRect();
    const action = button.getBoundingClientRect();
    return {
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: document.documentElement.clientHeight,
      documentWidth: document.documentElement.scrollWidth,
      cover: { x: box.x, y: box.y, width: box.width, height: box.height },
      button: { x: action.x, y: action.y, width: action.width, height: action.height },
      textLength: (root.innerText || "").trim().length
    };
  }, { coverSelector: theme.cover, openSelector: theme.open });
  assert.ok(metrics && metrics.cover.width > 0 && metrics.cover.height > 0,
    theme.slug + ": ukuran cover kosong " + JSON.stringify(metrics));
  assert.ok(metrics.documentWidth <= metrics.viewportWidth + 2,
    theme.slug + ": cover menyebabkan overflow horizontal " + JSON.stringify(metrics));
  assert.ok(metrics.textLength > 0,
    theme.slug + ": cover tidak memiliki teks/nama yang terbaca");
  assert.ok(metrics.button.width > 0 && metrics.button.height > 0 &&
    metrics.button.x >= -2 && metrics.button.x + metrics.button.width <= metrics.viewportWidth + 2 &&
    metrics.button.y >= -2 && metrics.button.y + metrics.button.height <= metrics.viewportHeight + 2,
    theme.slug + ": tombol buka terpotong/keluar viewport " + JSON.stringify(metrics));
  await captureScreenshot(page, path.join(screenshotDir, `${theme.slug}-cover-${device}.png`));
}

const themes = [
  { slug: "karsa", marker: "#open-btn", open: "#open-btn", cover: "#cover" },
  { slug: "royal-vintage", marker: ".invitation-container", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "serena-ivory", marker: ".serena-ivory-page", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "sirein", marker: ".sirein-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "atelier-editorial", marker: ".atelier-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "groom", marker: ".sirein-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "kinze", marker: ".kinze-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aksara-signature", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "botanical-garden", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "velvet-romance", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "romantic-floral", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "elegance", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aurelia-noir", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "lumiere-bloom", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aksara-velora", marker: ".velora-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aksara-nocturne", marker: ".nocturne", open: "#open-btn", cover: "#cover" },
  { slug: "kencana-jawa", marker: ".kj-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "lumina", marker: ".lumina-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "calestial", marker: ".celestial-royale", open: "#open-btn", cover: "#cover" },
{ slug: "sagara", marker: ".sg-cover-photo", open: "#open-btn", cover: "#cover" },
  { slug: "lume", marker: ".lume", open: "#open-btn", cover: "#cover" },
  { slug: "nox", marker: ".nox", open: "#open-btn", cover: "#cover" },
  { slug: "taupe", marker: ".taupe", open: "#open-btn", cover: "#cover" },
  { slug: "earty", marker: "#cover", open: "#open-btn", cover: "#cover" },
];

// Keep the browser matrix and theme-specific dock styling synchronized with the registry.
const themeRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/registry.json"), "utf8"));
const activeThemeSlugs = (themeRegistry.themes || [])
  .filter(theme => theme && theme.status === "active")
  .map(theme => theme.slug)
  .sort();
const browserThemeSlugs = themes.map(theme => theme.slug).sort();
assert.deepEqual(browserThemeSlugs, activeThemeSlugs,
  "Browser smoke matrix must cover every active registry theme exactly once.");
const sharedThemeCss = fs.readFileSync(path.join(__dirname, "../core/global.css"), "utf8");
for (const slug of activeThemeSlugs) {
  assert.ok(sharedThemeCss.includes(`.oa-floating-controls[data-theme="${slug}"]`),
    slug + ": tema aktif belum memiliki identitas visual dock khusus.");
  const themeFontTokens = sharedThemeCss.match(new RegExp(`html\\[data-oa-theme=["']${slug}["']\\]\\s*\\{[^}]*\\}`, "m"))?.[0] || "";
  const themeRevealTokens = sharedThemeCss.match(new RegExp(`html\\[data-oa-theme=["']${slug}["']\\]\\s*\\{[^}]*--oa-reveal-time:[^}]*\\}`, "m"))?.[0] || "";
  assert.ok(themeFontTokens.includes("--oa-font-display") && themeFontTokens.includes("--oa-font-body"),
    slug + ": token tipografi tema belum lengkap.");
  assert.ok(themeRevealTokens.includes("--oa-reveal-ease"),
    slug + ": token animasi reveal tema belum lengkap.");
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const failures = [];
  try {
    for (const theme of themes) {
      const page = await browser.newPage();
      const pageErrors = [];
      // Preserve the exact predicate in timeout diagnostics so a shared desktop
      // failure can be traced to its real interaction rather than guessed.
      const originalWaitForFunction = page.waitForFunction.bind(page);
      page.waitForFunction = async (predicate, ...args) => {
        try {
          return await originalWaitForFunction(predicate, ...args);
        } catch (error) {
          const label = String(predicate).replace(/\\s+/g, " ").slice(0, 220);
          throw new Error("waitForFunction predicate [" + label + "]: " + (error?.message || error));
        }
      };
      page.on("pageerror", error => pageErrors.push(error.message));
      const url = `http://127.0.0.1:4173/?c=demo-katalog&theme=${theme.slug}&to=Nama+Tamu`;
      try {
        const response = await page.goto(url, { waitUntil: "commit", timeout: 15000 });
        assert.ok(response && response.ok(), theme.slug + ": halaman utama gagal dimuat");
        await page.waitForSelector(theme.marker, { state: "attached", timeout: 10000 });
        if (theme.slug === "atelier-editorial") {
          assert.equal(await page.locator(".atelier-page").count(), 1,
            "atelier-editorial: namespace halaman mandiri tidak ditemukan");
          assert.equal(await page.locator(".sirein-page, .sirein-cover, .sirein-button").count(), 0,
            "atelier-editorial: masih memakai namespace CSS Sirein");
          assert.ok(await page.locator(".atelier-cover .atelier-button").count() > 0,
            "atelier-editorial: tombol cover dengan namespace mandiri tidak ditemukan");
        }
        await page.waitForFunction(() => {
          const el = document.querySelector('[data-bind="couple.groom.nickname"]');
          return el && el.textContent.trim() === "Arkan";
        }, undefined, { timeout: 10000 });

        assert.equal((await page.locator("#nama-tamu").textContent()).trim(), "Nama Tamu",
          theme.slug + ": nama tamu tidak terbaca");
        assert.equal(await page.locator("#rsvp-form").count(), 1,
          theme.slug + ": formulir RSVP bersama tidak tersedia");
        assert.equal(await page.locator("#wishes-form").count(), 1,
          theme.slug + ": formulir buku tamu bersama tidak tersedia");
        assert.ok(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior === "smooth"),
          theme.slug + ": smooth scrolling belum aktif");
        assert.ok(await page.locator(".oa-scroll-reveal").count() > 0,
          theme.slug + ": animasi saat scroll belum dipasang");
        assert.equal((await page.locator('[data-bind="couple.bride.nickname"]').first().textContent()).trim(), "Sekar",
          theme.slug + ": nama mempelai wanita tidak terbaca");
        const storyAudit = await page.evaluate(() => ({
          total: Array.isArray(window.__invitationData?.story) ? window.__invitationData.story.length : 0,
          photos: Array.isArray(window.__invitationData?.story) ? window.__invitationData.story.filter(item => item && (item.foto || item.photo || item.image)).length : 0
        }));
        assert.equal(await page.locator("#story-list article, .story-list article").count(), storyAudit.total,
          theme.slug + ": jumlah Love Story tidak sesuai data.json");
        assert.equal(await page.locator("#story-list .oa-story-photo, .story-list .oa-story-photo").count(), storyAudit.photos,
          theme.slug + ": foto Love Story tidak sesuai data.json");
        assert.equal((await page.locator("#story-list article, .story-list article").first().textContent()).includes("Pertemuan yang Sederhana"), true,
          theme.slug + ": judul Love Story tidak terbaca");
        if (theme.slug === "aksara-signature") {
          await page.waitForFunction(() => Boolean(document.querySelector("#app style")), undefined, { timeout: 5000 });
        }
        assert.ok(await page.locator("#bg-music").getAttribute("src"),
          theme.slug + ": sumber musik tidak terisi");
        // The shared controls appear only after the invitation is opened.
        // The demo must use client-local image assets in every theme, never legacy remote photo URLs.
        const imageAudit = await page.evaluate(() => ({
          cover: document.querySelector('img[data-bind="cover.image"]')?.src || "",
          groom: document.querySelector('img[data-bind="couple.groom.photo"]')?.src || "",
          bride: document.querySelector('img[data-bind="couple.bride.photo"]')?.src || "",
          gallery: Array.from(document.querySelectorAll(".gallery-grid img")).map(img => img.src),
          images: Array.from(document.querySelectorAll("img[src]")).map(img => img.src)
        }));
        const localPrefix = "http://127.0.0.1:4173/clients/demo-katalog/";
        assert.ok(imageAudit.cover.startsWith(localPrefix), theme.slug + ": foto sampul bukan aset lokal " + imageAudit.cover);
        assert.ok(imageAudit.groom.startsWith(localPrefix), theme.slug + ": foto pria bukan aset lokal " + imageAudit.groom);
        assert.ok(imageAudit.bride.startsWith(localPrefix), theme.slug + ": foto wanita bukan aset lokal " + imageAudit.bride);
        assert.equal(imageAudit.gallery.length, 4, theme.slug + ": galeri demo harus berisi 4 foto");
        assert.ok(imageAudit.gallery.every(src => src.startsWith(localPrefix)),
          theme.slug + ": galeri memakai URL lama " + JSON.stringify(imageAudit.gallery));
        // Foto pasangan/galeri wajib berasal dari folder demo. Logo pembayaran dan
        // ornamen visual boleh berasal dari pustaka aset lokal repository.
        const allowedLocalImagePrefixes = [
          localPrefix,
          "http://127.0.0.1:4173/assets/payment/",
          "http://127.0.0.1:4173/assets/themes/",
          "http://127.0.0.1:4173/assets/ornaments/"
        ];
        assert.ok(imageAudit.images.every(src => allowedLocalImagePrefixes.some(prefix => src.startsWith(prefix))),
          theme.slug + ": ditemukan gambar dari luar pustaka aset lokal demo " + JSON.stringify(imageAudit.images));

        const imageLoadAudit = await page.evaluate(async () => {
          const images = Array.from(document.querySelectorAll("#app img[src]"));
          images.forEach(image => { image.loading = "eager"; });
          await Promise.all(images.map(image => image.decode().catch(() => null)));
          return images.map(image => ({
            src: image.currentSrc || image.src,
            width: image.naturalWidth,
            height: image.naturalHeight,
            complete: image.complete
          }));
        });
        assert.ok(imageLoadAudit.length > 0, theme.slug + ": tidak ada gambar yang diuji.");
        assert.ok(imageLoadAudit.every(image => image.complete && image.width > 0 && image.height > 0),
          theme.slug + ": ada gambar yang gagal dimuat " + JSON.stringify(imageLoadAudit.filter(image => !image.width || !image.height)));

        await auditCover(page, theme, "desktop");

        if (theme.open) {
          // Shared navigation and quick controls must remain hidden behind the cover.
          assert.equal(await page.locator("#oa-floating-controls").count(), 1,
            theme.slug + ": navigasi bersama harus disiapkan tepat satu kali");
          assert.equal(await page.locator("#oa-floating-controls").isVisible(), false,
            theme.slug + ": navigasi muncul sebelum cover dibuka");
          assert.equal(await page.locator("#oa-quick-controls").count(), 0,
            theme.slug + ": kontrol cepat terpisah tidak boleh menduplikasi dock bersama.");
          await page.locator(theme.open).click();
          await page.waitForFunction(() => {
            const cover = document.getElementById("cover") || document.getElementById("cover-section");
            return !cover || cover.hidden || getComputedStyle(cover).display === "none";
          }, undefined, { timeout: 5000 });
        }
        await page.waitForSelector("#oa-floating-controls", { state: "visible", timeout: 5000 });
        const performanceAudit = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll("#app, #app *"));
          const backdrop = [];
          const slowTransitions = [];
          for (const element of elements) {
            const style = getComputedStyle(element);
            const effect = style.backdropFilter || style.webkitBackdropFilter;
            if (effect && effect !== "none" && !/^blur\\(0(?:px)?\\)$/.test(effect)) backdrop.push(element.tagName.toLowerCase() + (element.className && typeof element.className === "string" ? "." + element.className.trim().replace(/\\s+/g, ".") : ""));
            const durations = style.transitionDuration.split(",").map(value => parseFloat(value) * (value.includes("ms") ? .001 : 1));
            if (durations.some(value => value > .55)) slowTransitions.push(element.tagName.toLowerCase() + (element.className && typeof element.className === "string" ? "." + element.className.trim().replace(/\\s+/g, ".") : ""));
          }
          return { backdrop, slowTransitions: slowTransitions.slice(0, 12) };
        });
        assert.equal(performanceAudit.backdrop.length, 0, theme.slug + ": efek backdrop blur berat masih aktif " + JSON.stringify(performanceAudit.backdrop));
        assert.equal(performanceAudit.slowTransitions.length, 0, theme.slug + ": transisi tema masih lebih dari 0,55 detik " + JSON.stringify(performanceAudit.slowTransitions));
        await page.emulateMedia({ reducedMotion: "reduce" });
        const reducedMotionAudit = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll("#app, #app *"));
          const seconds = value => Math.max(0, ...String(value || "0s").split(",").map(part => parseFloat(part) * (part.includes("ms") ? .001 : 1)).filter(Number.isFinite));
          return {
            transition: Math.max(0, ...elements.map(element => seconds(getComputedStyle(element).transitionDuration))),
            animation: Math.max(0, ...elements.map(element => seconds(getComputedStyle(element).animationDuration))),
            scroll: getComputedStyle(document.documentElement).scrollBehavior
          };
        });
        assert.ok(reducedMotionAudit.transition <= .001 && reducedMotionAudit.animation <= .001 && reducedMotionAudit.scroll === "auto",
          theme.slug + ": preferensi reduced-motion belum dihormati " + JSON.stringify(reducedMotionAudit));
        await page.emulateMedia({ reducedMotion: "no-preference" });
        const motionAudit = await page.evaluate(() => ({
          left: document.querySelectorAll('#app [data-oa-motion="left"]').length,
          right: document.querySelectorAll('#app [data-oa-motion="right"]').length,
          up: document.querySelectorAll('#app [data-oa-motion="up"]').length,
          photos: document.querySelectorAll('#app img.oa-motion-photo').length
        }));
        assert.ok(motionAudit.left + motionAudit.right > 0 && motionAudit.up > 0,
          theme.slug + ": animasi arah samping dan naik belum diterapkan");
        const autoScroll = page.locator('#oa-floating-controls [data-oa-action="auto"]');
        if (await autoScroll.isEnabled()) {
          // The invitation should begin scrolling automatically after it is opened.
          await page.waitForFunction(() => {
            const button = document.querySelector('#oa-floating-controls [data-oa-action="auto"]');
            // A short invitation may reach its end before the assertion runs.
            // Accept either an active control or proof that the page has begun moving.
            return button?.getAttribute("aria-pressed") === "true" || window.scrollY > 24;
          }, undefined, { timeout: 3500 });
          const autoState = await page.evaluate(() => ({
            pressed: document.querySelector('#oa-floating-controls [data-oa-action="auto"]')?.getAttribute("aria-pressed"),
            scrollY: window.scrollY
          }));
          assert.ok(autoState.pressed === "true" || autoState.scrollY > 24,
            theme.slug + ": auto-scroll tidak mulai otomatis setelah undangan dibuka");
          await autoScroll.click();
          assert.equal(await autoScroll.getAttribute("aria-pressed"), "false",
            theme.slug + ": tombol auto-scroll tidak menjeda gulir otomatis");
          await autoScroll.click();
          assert.equal(await autoScroll.getAttribute("aria-pressed"), "true",
            theme.slug + ": tombol auto-scroll tidak dapat dimulai manual");
          await page.waitForTimeout(120);
          assert.equal(await autoScroll.getAttribute("aria-pressed"), "true",
            theme.slug + ": auto-scroll berhenti tanpa interaksi pengguna");
          await autoScroll.click();
          assert.equal(await autoScroll.getAttribute("aria-pressed"), "false",
            theme.slug + ": tombol auto-scroll tidak berhenti");
        }
        await captureScreenshot(page, path.join(screenshotDir, `${theme.slug}-desktop.png`));
        assert.equal(await page.locator('#oa-floating-controls [data-oa-action="top"]').count(), 1,
          theme.slug + ": tombol kembali ke atas tidak tersedia");
        assert.equal(await page.locator('#oa-floating-controls [data-oa-action="next"]').count(), 1,
          theme.slug + ": tombol lanjut tidak tersedia");
        assert.equal(await page.locator('#oa-floating-controls [data-oa-action="share"]').count(), 1,
          theme.slug + ": tombol bagikan tidak tersedia");
        assert.equal(await page.locator('#oa-floating-controls [data-oa-action="auto"]').count(), 1,
          theme.slug + ": tombol auto-scroll tidak tersedia");
        assert.equal(await page.locator('#oa-floating-controls [data-oa-action="music"]').count(), 1,
          theme.slug + ": tombol musik universal tidak tersedia");

        // A shared dock is only valid when the theme's former floating controls
        // are actually retired, not merely covered by the new controls.
        const legacyAudit = await page.evaluate(() => {
          const legacy = Array.from(document.querySelectorAll(".oa-legacy-navigation, .oa-legacy-music-control"));
          const visibleLegacy = legacy.filter(element => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return !element.closest("[hidden], [aria-hidden='true'], [inert]") &&
              style.display !== "none" && style.visibility !== "hidden" &&
              style.pointerEvents !== "none" && rect.width > 0 && rect.height > 0;
          });
          const sharedButtons = Array.from(document.querySelectorAll(
            "#oa-floating-controls button"
          )).filter(button => {
            const style = getComputedStyle(button);
            const rect = button.getBoundingClientRect();
            return !button.closest("[hidden], [aria-hidden='true'], [inert]") &&
              style.display !== "none" && style.visibility !== "hidden" &&
              style.pointerEvents !== "none" && rect.width > 0 && rect.height > 0;
          });
          const blockedShared = sharedButtons.filter(button => {
            const rect = button.getBoundingClientRect();
            const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
            const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
            const top = document.elementFromPoint(x, y);
            return !top || (top !== button && !button.contains(top));
          }).map(button => button.getAttribute("aria-label") || button.textContent.trim());
          return {
            legacyCount: legacy.length,
            visibleLegacy: visibleLegacy.map(element => element.id || element.className),
            blockedShared
          };
        });
        assert.equal(legacyAudit.visibleLegacy.length, 0,
          theme.slug + ": kontrol tema lama masih terlihat " + JSON.stringify(legacyAudit.visibleLegacy));
        assert.equal(legacyAudit.blockedShared.length, 0,
          theme.slug + ": tombol navigasi bersama tertutup elemen lain " + JSON.stringify(legacyAudit.blockedShared));

        assert.ok(await page.locator('#oa-floating-controls [data-oa-feature="loveStory"]').count(),
          theme.slug + ": pintasan cerita tidak tersedia");
        for (const feature of ["events", "countdown", "gallery", "rsvp", "guestbook", "gifts"]) {
          assert.ok(await page.locator('#oa-floating-controls [data-oa-feature="' + feature + '"]').count(),
            theme.slug + ": pintasan " + feature + " tidak tersedia");
        }
        const quoteData = await page.evaluate(() => window.__invitationData?.quote || {});
        const quoteEnabled = await page.evaluate(() => {
          const flags = window.__invitationData?.features || {};
          return flags.quotes !== false && flags.quote !== false;
        });
        if (quoteEnabled && (quoteData.text || quoteData.arab)) {
          const moreButton = page.locator('#oa-floating-controls [data-oa-action="more"]');
          if (await moreButton.count()) await moreButton.click();
          const quoteButton = page.locator('#oa-floating-controls [data-oa-feature="quotes"]');
          assert.equal(await quoteButton.count(), 1, theme.slug + ": pintasan quotes tidak tersedia");
        }
        const navigation = page.locator("#oa-floating-controls");
        const shortcutAudit = await navigation.locator('[data-oa-action="jump"]').evaluateAll(buttons => buttons.map(button => {
          const targetId = button.dataset.target || "";
          const targets = targetId ? Array.from(document.querySelectorAll("[id]")).filter(element => element.id === targetId) : [];
          const target = targets[0] || null;
          const style = target ? getComputedStyle(target) : null;
          const rect = target ? target.getBoundingClientRect() : null;
          return {
            feature: button.dataset.oaFeature,
            targetId,
            targetCount: targets.length,
            visible: Boolean(target && !target.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.height > 0)
          };
        }));
        assert.ok(shortcutAudit.length > 0, theme.slug + ": tidak ada pintasan bagian");
        for (const shortcut of shortcutAudit) {
          assert.ok(shortcut.targetId, theme.slug + ": pintasan " + shortcut.feature + " tidak memiliki target");
          assert.equal(shortcut.targetCount, 1, theme.slug + ": target pintasan " + shortcut.feature + " tidak unik/ada");
          assert.equal(shortcut.visible, true, theme.slug + ": target pintasan " + shortcut.feature + " tidak terlihat");
        }
        if (quoteEnabled && (quoteData.text || quoteData.arab)) {
          const moreButton = navigation.locator('[data-oa-action="more"]');
          if (await moreButton.count() && await moreButton.getAttribute("aria-expanded") !== "true") await moreButton.click();
          const quoteButton = navigation.locator('[data-oa-feature="quotes"]');
          const quoteTargetId = await quoteButton.getAttribute("data-target");
          if (theme.slug === "karsa") {
            assert.equal(quoteTargetId, "quote-section", theme.slug + ": pintasan kutipan tidak mengarah ke section kutipan");
          }
          await quoteButton.click();
          await page.waitForFunction(id => {
            const target = document.getElementById(id);
            if (!target) return false;
            const rect = target.getBoundingClientRect();
            // Long sections may begin far above the viewport while still occupying it.
            // Intersection is the correct criterion; proximity of the top edge is not.
            return rect.bottom > 0 && rect.top < window.innerHeight;
          }, quoteTargetId, { timeout: 5000 });
        }
        assert.equal(await navigation.count(), 1, theme.slug + ": navigasi bersama tidak tersedia");

        assert.equal(await navigation.locator('[data-oa-action="top"]').count(), 1,
          theme.slug + ": tombol kembali ke atas tidak tersedia");
        assert.equal(await navigation.locator('[data-oa-action="next"]').count(), 1,
          theme.slug + ": tombol bagian berikutnya tidak tersedia");

        const musicControl = page.locator('#oa-floating-controls [data-oa-action="music"]').first();
        await musicControl.waitFor({ state: "visible", timeout: 5000 });

        // Exercise real click handlers, not only the presence/count of controls.
        const jumpTargets = await navigation.locator('[data-oa-action="jump"]').evaluateAll(buttons =>
          buttons.map(button => button.dataset.target).filter(Boolean));
        for (const targetId of jumpTargets) {
          const targetButton = navigation.locator('[data-oa-action="jump"][data-target="' + targetId + '"]');
          if (!(await targetButton.isVisible())) {
            const more = navigation.locator('[data-oa-action="more"]');
            if (await more.getAttribute("aria-expanded") !== "true") await more.click();
          }
          await targetButton.click();
          await page.waitForFunction(id => {
            const target = document.getElementById(id);
            if (!target) return false;
            const rect = target.getBoundingClientRect();
            // A valid jump places the destination in view; its top need not be near 0
            // because section heights and scroll snapping differ between themes.
            return rect.bottom > 0 && rect.top < window.innerHeight;
          }, targetId, { timeout: 5000 });
        }

        const moreButton = navigation.locator('[data-oa-action="more"]');
        if (await moreButton.getAttribute("aria-expanded") !== "true") await moreButton.click();
        await navigation.locator('[data-oa-action="top"]').click();
        await page.waitForFunction(() => window.scrollY < 24, undefined, { timeout: 5000 });
        if (await moreButton.getAttribute("aria-expanded") !== "true") await moreButton.click();
        await navigation.locator('[data-oa-action="next"]').click();
        await page.waitForFunction(() => window.scrollY > 24, undefined, { timeout: 5000 });

        await page.evaluate(() => {
          window.__oaSharePayload = null;
          const stub = async payload => { window.__oaSharePayload = payload; };
          try { Object.defineProperty(window.navigator, "share", { configurable: true, writable: true, value: stub }); } catch (_) {}
          if (window.navigator.share !== stub) {
            try { Object.defineProperty(Object.getPrototypeOf(window.navigator), "share", { configurable: true, writable: true, value: stub }); } catch (_) {}
          }
          window.__oaShareStubReady = window.navigator.share === stub;
        });
        assert.equal(await page.evaluate(() => window.__oaShareStubReady), true,
          theme.slug + ": Web Share API stub could not be installed for the interaction test.");
        // The shared dock has a direct share action; verify it independently.
        if (await moreButton.getAttribute("aria-expanded") !== "true") await moreButton.click();
        await navigation.locator('[data-oa-action="share"]').click();
        await page.waitForFunction(() => Boolean(window.__oaSharePayload?.url), undefined, { timeout: 5000 });
        const dockSharePayload = await page.evaluate(() => window.__oaSharePayload);
        assert.ok(dockSharePayload?.url, theme.slug + ": dock share action did not invoke Web Share API.");
        const dockSharedUrl = new URL(dockSharePayload.url);
        assert.ok(dockSharedUrl.origin === "https://omahaksara.github.io" &&
          dockSharedUrl.pathname.startsWith("/i/demo-katalog/") &&
          dockSharedUrl.pathname.includes("Nama%20Tamu"),
          theme.slug + ": dock share action did not produce the canonical invitation URL.");
        // The in-content share button is a separate entry point; test it too.
        await page.evaluate(() => { window.__oaSharePayload = null; });
        const shareButton = page.locator("#oa-share-invitation");
        await shareButton.scrollIntoViewIfNeeded();
        await shareButton.click();
        await page.waitForFunction(() => Boolean(window.__oaSharePayload?.url), undefined, { timeout: 5000 });
        const sharePayload = await page.evaluate(() => window.__oaSharePayload);
        const sharedUrl = sharePayload?.url ? new URL(sharePayload.url) : null;
        assert.ok(sharedUrl && sharedUrl.origin === "https://omahaksara.github.io" &&
          sharedUrl.pathname.startsWith("/i/demo-katalog/") &&
          sharedUrl.pathname.includes("Nama%20Tamu"),
          theme.slug + ": aksi bagikan undangan tidak mengirim URL undangan kanonis yang valid.");

        await page.evaluate(() => {
          const audio = document.getElementById("bg-music");
          audio.__playing = false;
          audio.__playCalls = 0;
          audio.__pauseCalls = 0;
          Object.defineProperty(audio, "paused", { configurable: true, get() { return !this.__playing; } });
          audio.play = function() {
            this.__playCalls++;
            this.__playing = true;
            this.dispatchEvent(new Event("play"));
            return Promise.resolve();
          };
          audio.pause = function() {
            this.__pauseCalls++;
            this.__playing = false;
            this.dispatchEvent(new Event("pause"));
          };
        });
        await musicControl.click();
        await page.waitForFunction(() => document.querySelector('#oa-floating-controls [data-oa-action="music"]')?.getAttribute("aria-pressed") === "true");
        assert.equal(await page.evaluate(() => document.getElementById("bg-music").__playCalls), 1,
          theme.slug + ": tombol musik tidak memanggil play().");
        await musicControl.click();
        await page.waitForFunction(() => document.querySelector('#oa-floating-controls [data-oa-action="music"]')?.getAttribute("aria-pressed") === "false");
        assert.equal(await page.evaluate(() => document.getElementById("bg-music").__pauseCalls), 1,
          theme.slug + ": tombol musik tidak memanggil pause().");
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
        const message = error && error.stack ? error.stack : (error && error.message ? error.message : String(error));
        failures.push(theme.slug + ": " + message);
        console.error("FAIL " + theme.slug + ": " + message + " DEBUG " + JSON.stringify(debug));
      } finally {
        await page.close();
      }
    }

    // Responsive and demo-interaction pass at a common mobile viewport.
    for (const theme of themes) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 1 });
      const pageErrors = [];
      const mockGuestbook = [];
      const mockApiPosts = [];
      page.on("pageerror", error => pageErrors.push(error.message));
      // Isolate CI from the live spreadsheet while testing the real two-way API flow.
      await page.route("**/macros/s/**", async route => {
        const request = route.request();
        if (request.method() === "GET") {
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ ok: true, items: mockGuestbook.slice() }) });
          return;
        }
        if (request.method() === "POST") {
          let payload = {};
          try { payload = JSON.parse(request.postData() || "{}"); } catch {}
          mockApiPosts.push(payload);
          if (payload.action === "guestbook" && payload.name && payload.message) {
            mockGuestbook.unshift({ name: payload.name, message: payload.message });
          }
          await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ ok: true }) });
          return;
        }
        await route.fulfill({ status: 405, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ ok: false }) });
      });
      const url = `http://127.0.0.1:4173/?c=demo-katalog&theme=${theme.slug}&to=Nama+Tamu`;
      try {
        const response = await page.goto(url, { waitUntil: "commit", timeout: 15000 });
        assert.ok(response && response.ok(), theme.slug + ": halaman mobile gagal dimuat");
        await page.waitForSelector(theme.marker, { state: "attached", timeout: 10000 });
        await auditCover(page, theme, "mobile");
        if (theme.open) {
          await page.locator(theme.open).click();
          await page.waitForFunction(() => {
            const cover = document.getElementById("cover") || document.getElementById("cover-section");
            return !cover || cover.hidden || getComputedStyle(cover).display === "none";
          }, undefined, { timeout: 5000 });
        }
        await page.waitForSelector("#rsvp-form", { state: "attached", timeout: 10000 });
        await page.waitForSelector("#wishes-form", { state: "attached", timeout: 10000 });
        await captureScreenshot(page, path.join(screenshotDir, `${theme.slug}-mobile.png`));
        const layout = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          page: document.documentElement.scrollWidth,
          rsvp: document.querySelector("#rsvp-form").getBoundingClientRect().width,
          guestbook: document.querySelector("#wishes-form").getBoundingClientRect().width
        }));
        assert.ok(layout.page <= layout.viewport + 2,
          theme.slug + ": horizontal overflow di mobile " + JSON.stringify(layout));
        assert.ok(layout.rsvp > 0 && layout.rsvp <= layout.viewport,
          theme.slug + ": formulir RSVP tidak responsif " + JSON.stringify(layout));
        assert.ok(layout.guestbook > 0 && layout.guestbook <= layout.viewport,
          theme.slug + ": buku tamu tidak responsif " + JSON.stringify(layout));

        const rsvp = page.locator("#rsvp-form");
        await rsvp.locator('[name="name"]').fill("Tamu Uji");
        await rsvp.locator('[name="attendance"]').selectOption("hadir");
        await rsvp.locator('button[type="submit"]').first().click();
        await page.waitForFunction(() => /Konfirmasi berhasil|RSVP belum aktif|belum dikonfigurasi|Simulasi demo/i.test(document.querySelector("#rsvp-status")?.textContent || ""),
          undefined, { timeout: 10000 });

        const wishes = page.locator("#wishes-form");
        await wishes.locator('[name="name"]').fill("Tamu Uji");
        await wishes.locator('[name="message"]').fill("Semoga bahagia selalu.");
        await wishes.locator('button[type="submit"]').first().click();
        await page.waitForFunction(() => /Simulasi demo: ucapan ini hanya tampil sementara dan tidak disimpan\./.test(document.querySelector("#wishes-status")?.textContent || ""),
          undefined, { timeout: 10000 });
        await page.waitForFunction(() => Array.from(document.querySelectorAll("#wishes-list .wish-card")).some(card => card.innerText.includes("Semoga bahagia selalu.")),
          undefined, { timeout: 5000 });
        assert.equal(mockGuestbook.length, 0, theme.slug + ": demo tidak boleh menulis ke mock database");
        assert.equal(mockApiPosts.length, 0, theme.slug + ": demo tidak boleh mengirim RSVP/ucapan ke API");
        assert.equal(pageErrors.length, 0, theme.slug + ": JavaScript error pada mobile: " + pageErrors.join("; "));
        console.log("PASS mobile + demo forms " + theme.slug);
      } catch (error) {
        const message = error && error.message ? error.message : String(error);
        failures.push(theme.slug + " mobile: " + message);
        console.error("FAIL mobile " + theme.slug + ": " + message);
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
