const { chromium } = require("playwright");
const assert = require("node:assert/strict");

const themes = [
  { slug: "karsa", marker: "#open-btn", open: "#open-btn", cover: "#cover" },
  { slug: "royal-vintage", marker: ".invitation-container", open: null, cover: null },
  { slug: "sirein", marker: ".sirein-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "aksara-signature", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "botanical-garden", marker: ".invite-shell", open: "#open-invitation-btn", cover: "#cover-section" }
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
        if (theme.slug === "aksara-signature") {
          await page.waitForFunction(() => Boolean(document.querySelector("#app style")), undefined, { timeout: 5000 });
        }
        assert.ok(await page.locator("#bg-music").getAttribute("src"),
          theme.slug + ": sumber musik tidak terisi");

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
        assert.ok(imageAudit.images.every(src => src.startsWith(localPrefix)),
          theme.slug + ": ditemukan gambar eksternal pada demo " + JSON.stringify(imageAudit.images));

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
        const response = await page.goto(url, { waitUntil: "domcontentloaded" });
        assert.ok(response && response.ok(), theme.slug + ": halaman mobile gagal dimuat");
        await page.waitForSelector(theme.marker, { state: "attached", timeout: 10000 });
        if (theme.open) {
          await page.locator(theme.open).click();
          await page.waitForFunction(() => {
            const cover = document.getElementById("cover") || document.getElementById("cover-section");
            return !cover || cover.hidden || getComputedStyle(cover).display === "none";
          }, undefined, { timeout: 5000 });
        }
        await page.waitForSelector("#rsvp-form", { state: "attached", timeout: 10000 });
        await page.waitForSelector("#wishes-form", { state: "attached", timeout: 10000 });
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
