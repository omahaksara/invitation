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

const allThemes = [
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
  { slug: "aksav", marker: ".aksav", open: "#open-btn", cover: "#cover" },
  { slug: "kencana-jawa", marker: ".kj-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "lumina", marker: ".lumina-cover", open: "#open-invitation-btn", cover: "#cover-section" },
  { slug: "calestial", marker: ".celestial-royale", open: "#open-btn", cover: "#cover" },
{ slug: "sagara", marker: ".sg-cover-photo", open: "#open-btn", cover: "#cover" },
  { slug: "lume", marker: ".lume", open: "#open-btn", cover: "#cover" },
  { slug: "nox", marker: ".nox", open: "#open-btn", cover: "#cover" },
  { slug: "taupe", marker: ".taupe", open: "#open-btn", cover: "#cover" },
  { slug: "earty", marker: "#cover", open: "#open-btn", cover: "#cover" },
  { slug: "jendela-senja", marker: ".js-theme", open: "#open-btn", cover: "#cover" },
];

// Keep the browser matrix and theme-specific dock styling synchronized with the registry.
const themeRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, "../templates/registry.json"), "utf8"));
const activeThemeSlugs = (themeRegistry.themes || [])
  .filter(theme => theme && theme.status === "active" && theme.slug !== "army")
  .map(theme => theme.slug)
  .sort();
const browserThemeSlugs = allThemes.filter(theme => theme.status !== "prototype").map(theme => theme.slug).sort();
assert.deepEqual(browserThemeSlugs, activeThemeSlugs,
  "Browser smoke matrix must cover every eligible active theme exactly once (Army is protected).");
assert.ok(!allThemes.some(theme => theme.slug === "army"),
  "Protected Army theme must never be loaded by this adaptive-motion browser suite.");
const sharedThemeCss = fs.readFileSync(path.join(__dirname, "../core/global.css"), "utf8");
const sharedAppJs = fs.readFileSync(path.join(__dirname, "../core/app.js"), "utf8");
assert.match(sharedAppJs, /if \(themeSlug === "army"\)\s*\{\s*setupLegacyReveal\(\);\s*return;/,
  "Army must use the unchanged legacy reveal path.");
const motionProfiles = ["cinematic", "curtain", "editorial", "organic", "soft", "bold", "dramatic"];
for (const profile of motionProfiles) {
  assert.ok(sharedThemeCss.includes(`html[data-oa-motion-profile="${profile}"]`),
    profile + ": token profil gerak adaptif belum tersedia.");
  const profileRule = sharedThemeCss.match(new RegExp(`html\\[data-oa-motion-profile=["']${profile}["']\\]\\s*\\{([^}]*)\\}`, "m"))?.[1] || "";
  for (const token of ["--oa-motion-duration", "--oa-motion-photo-distance", "--oa-motion-opening-duration"]) {
    assert.ok(profileRule.includes(token), profile + ": token " + token + " belum lengkap.");
  }
}
assert.ok(sharedThemeCss.includes('html:not(.oa-motion-ready):not([data-oa-theme="army"]) #app .oa-scroll-reveal'),
  "Motion fallback adaptif harus menjaga konten tema non-Army tetap terlihat sebelum observer siap.");
for (const slug of activeThemeSlugs) {
  assert.match(sharedAppJs, new RegExp('"'+slug+'"\\s*:\\s*"(?:' + motionProfiles.join("|") + ')"'),
    slug + ": belum memiliki identitas motion adaptif.");
  assert.ok(sharedThemeCss.includes(`.oa-floating-controls[data-theme="${slug}"]`),
    slug + ": tema aktif belum memiliki identitas visual dock khusus.");
  const themeFontTokens = sharedThemeCss.match(new RegExp(`html\\[data-oa-theme=["']${slug}["']\\]\\s*\\{[^}]*\\}`, "m"))?.[0] || "";
  const themeRevealTokens = sharedThemeCss.match(new RegExp(`html\\[data-oa-theme=["']${slug}["']\\]\\s*\\{[^}]*--oa-reveal-time:[^}]*\\}`, "m"))?.[0] || "";
  assert.ok(themeFontTokens.includes("--oa-font-display") && themeFontTokens.includes("--oa-font-body"),
    slug + ": token tipografi tema belum lengkap.");
  assert.ok(themeRevealTokens.includes("--oa-reveal-ease"),
    slug + ": token animasi reveal tema belum lengkap.");
}

const motionRepresentativeSlugs = [
  "karsa", "royal-vintage", "atelier-editorial", "botanical-garden",
  "kinze", "groom", "calestial"
];
const motionOnly = process.env.OA_MOTION_ONLY === "1";
const themes = motionOnly
  ? allThemes.filter(theme => motionRepresentativeSlugs.includes(theme.slug))
  : allThemes;
if (motionOnly) {
  assert.equal(themes.length, motionRepresentativeSlugs.length,
    "Motion smoke harus menemukan satu tema perwakilan untuk setiap profil.");
  console.log("Motion-only browser matrix: " + themes.map(theme => theme.slug).join(", "));
}

(async () => {
  // Serve the repository fixture locally so this test is self-contained.
  // API calls remain isolated by the Playwright route mocks below.
  const root = path.resolve(__dirname, "..");
  const mimeTypes = {
    ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg", ".wav": "audio/wav", ".mp4": "video/mp4",
    ".webm": "video/webm", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf"
  };
  const server = require("node:http").createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }
    const target = path.resolve(root, "." + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    let file = target;
    try {
      if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.statSync(file).isFile()) throw new Error("Not a file");
      response.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream",
        "Cache-Control": "no-store"
      });
      fs.createReadStream(file).pipe(response);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });
  let browser;
  const failures = [];
  try {
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(4173, "127.0.0.1", resolve);
    });
    browser = await chromium.launch({ headless: true });
    for (const theme of themes) {
      const page = await browser.newPage();
      page.setDefaultTimeout(5000);
      page.setDefaultNavigationTimeout(15000);
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
      // Preserve the real public-demo map contract: each event must either
      // carry valid coordinates and a map target, or an explicit unverified note.
      await page.route("**/clients/demo-katalog/data.json*", async route => {
        const response = await route.fetch();
        const fixture = await response.json();
        const originalEvents = Object.values(fixture.events || {});
        assert.ok(originalEvents.length > 0 && originalEvents.every(event => {
          if (!event || typeof event !== "object") return false;
          const coordinates = event.coordinates;
          const hasCoordinates = coordinates &&
            Number.isFinite(Number(coordinates.lat)) &&
            Number.isFinite(Number(coordinates.lng)) &&
            Math.abs(Number(coordinates.lat)) <= 90 &&
            Math.abs(Number(coordinates.lng)) <= 180;
          const hasMapTarget = (typeof event.mapsUrl === "string" && event.mapsUrl.length > 0) ||
            (typeof event.mapEmbedUrl === "string" && event.mapEmbedUrl.length > 0) ||
            (typeof event.mapQuery === "string" && event.mapQuery.length > 0);
          const clearlyUnverified = typeof event.mapNote === "string" &&
            event.mapNote.trim().length > 0 && !coordinates &&
            event.latitude == null && event.longitude == null;
          return hasCoordinates ? hasMapTarget : clearlyUnverified;
        }), "Public demo events must have valid mapped coordinates or an explicit unverified-location note.");
        // Exercise legacy image aliases through the real shared normalizer.
        fixture.cover.heroImage = fixture.cover.image || fixture.cover.heroImage;
        delete fixture.cover.image;
        fixture.couple.groom.foto = fixture.couple.groom.photo;
        delete fixture.couple.groom.photo;
        fixture.couple.bride.image = fixture.couple.bride.photo;
        delete fixture.couple.bride.photo;
        fixture.gallery = (fixture.gallery || []).map((src, index) => ({ url: src, alt: "Foto uji " + (index + 1) }));
        fixture.story = (fixture.story || []).map(item => {
          const legacy = { ...item, image: item.foto || item.photo || item.image || "" };
          delete legacy.foto;
          delete legacy.photo;
          return legacy;
        });
        fixture.features = { ...(fixture.features || {}), maps: true, mapEmbed: true, mapNavigation: true };
        for (const event of originalEvents) {
          // Exercise legacy map aliases while keeping every synthetic point isolated
          // to this intercepted browser fixture; never write these values to demo/client JSON.
          event.mapUrl = "https://www.google.com/maps?q=0.123456,120.654321";
          delete event.mapsUrl;
          event.embedUrl = "https://www.google.com/maps?q=0.123456%2C120.654321&t=k&z=17&output=embed";
          delete event.mapEmbedUrl;
          event.coordinates = { lat: 0.123456, lng: 120.654321 };
          event.mapNote = "";
        }
        await route.fulfill({ response, body: JSON.stringify(fixture) });
      });
      const url = `http://127.0.0.1:4173/?c=demo-katalog&theme=${theme.slug}&to=Nama+Tamu`;
      try {
        const response = await page.goto(url, { waitUntil: "commit", timeout: 15000 });
        assert.ok(response && response.ok(), theme.slug + ": halaman utama gagal dimuat");
        await page.waitForSelector(theme.marker, { state: "attached", timeout: 10000 });
        await page.waitForFunction(() =>
          ["cinematic","curtain","editorial","organic","soft","bold","dramatic"].includes(
            document.documentElement.dataset.oaMotionProfile || ""
          ), undefined, { timeout: 5000 });
        if (theme.slug === "atelier-editorial") {
          assert.equal(await page.locator(".atelier-page").count(), 1,
            "atelier-editorial: namespace halaman mandiri tidak ditemukan");
          assert.equal(await page.locator(".sirein-page, .sirein-cover, .sirein-button").count(), 0,
            "atelier-editorial: masih memakai namespace CSS Sirein");
          assert.ok(await page.locator(".atelier-cover .atelier-button").count() > 0,
            "atelier-editorial: tombol cover dengan namespace mandiri tidak ditemukan");
        }
        const groomNickname = await page.evaluate(() =>
          String(window.__invitationData?.couple?.groom?.nickname || "").trim()
        );
        assert.ok(groomNickname, theme.slug + ": nama mempelai pria tidak tersedia pada data demo.");
        await page.waitForFunction(name =>
          (document.getElementById("app")?.innerText || "").includes(name),
          groomNickname, { timeout: 10000 });

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
        await page.waitForFunction(() => document.documentElement.classList.contains("oa-motion-ready"),
          undefined, { timeout: 5000 });
        const motionAudit = await page.evaluate(() => {
          const target = document.querySelector(".oa-scroll-reveal");
          return {
            profile: document.documentElement.dataset.oaMotionProfile,
            ready: document.documentElement.classList.contains("oa-motion-ready"),
            duration: target ? getComputedStyle(target).transitionDuration : ""
          };
        });
        assert.ok(motionProfiles.includes(motionAudit.profile),
          theme.slug + ": profil motion tidak dikenali " + JSON.stringify(motionAudit));
        assert.ok(motionAudit.ready && parseFloat(motionAudit.duration) > 0,
          theme.slug + ": motion lifecycle/timing belum siap " + JSON.stringify(motionAudit));
        const brideNickname = await page.evaluate(() =>
          String(window.__invitationData?.couple?.bride?.nickname || "").trim()
        );
        assert.ok(brideNickname && await page.locator("#app").evaluate((el, name) => el.innerText.includes(name), brideNickname),
          theme.slug + ": nama mempelai wanita tidak terbaca dari data demo.");

        const initialAudit = await page.evaluate(() => {
          const couple = window.__invitationData?.couple || {};
          const firstLetter = person => String(person?.nickname || person?.fullName || "")
            .match(/[\p{L}\p{N}]/u)?.[0]?.toLocaleUpperCase("id-ID") || "";
          return {
            groom: couple.groom?.initial || "",
            bride: couple.bride?.initial || "",
            groomExpected: firstLetter(couple.groom),
            brideExpected: firstLetter(couple.bride),
            pair: couple.initials || ""
          };
        });
        assert.equal(initialAudit.groom, initialAudit.groomExpected,
          theme.slug + ": inisial mempelai pria salah " + JSON.stringify(initialAudit));
        assert.equal(initialAudit.bride, initialAudit.brideExpected,
          theme.slug + ": inisial mempelai wanita salah " + JSON.stringify(initialAudit));
        assert.equal(initialAudit.pair, initialAudit.groomExpected + initialAudit.brideExpected,
          theme.slug + ": urutan inisial pasangan harus pria lalu wanita " + JSON.stringify(initialAudit));
        const monogram = page.locator(".cover-monogram");
        if (await monogram.count()) {
          assert.equal((await monogram.locator('[data-bind="couple.groom.initial"]').textContent()).trim(),
            initialAudit.groomExpected, theme.slug + ": monogram pria tidak mengikuti data pasangan");
          assert.equal((await monogram.locator('[data-bind="couple.bride.initial"]').textContent()).trim(),
            initialAudit.brideExpected, theme.slug + ": monogram wanita tidak mengikuti data pasangan");
        }

        const contractAudit = await page.evaluate(() => {
          const data = window.__invitationData || {};
          const events = Array.isArray(data.events) ? data.events : Object.values(data.events || {});
          const accounts = Array.isArray(data.gifts) ? data.gifts : (data.gifts?.accounts || []);
          const firstAccount = accounts.find(item => item && item.enabled !== false) || accounts[0] || {};
          const firstStory = Array.isArray(data.story) ? data.story[0] || {} : {};
          const firstGallery = Array.isArray(data.gallery) ? data.gallery[0] : null;
          const renderedEvents = data.__renderEvents && typeof data.__renderEvents === "object"
            ? Object.values(data.__renderEvents) : events;
          return {
            eventMode: data.eventMode || "",
            renderedEventCount: renderedEvents.length,
            combinedScheduleCount: renderedEvents.reduce((total, event) =>
              total + (Array.isArray(event?.schedule) ? event.schedule.length : 0), 0),
            events: events.map(event => ({
              title: event.title, date: event.date, startTime: event.startTime,
              timezone: event.timezone, mapQuery: event.mapQuery,
              mapsUrl: event.mapsUrl, mapEmbedUrl: event.mapEmbedUrl,
              coordinates: event.coordinates
            })),
            account: {
              paymentType: firstAccount.paymentType, provider: firstAccount.provider,
              accountHolder: firstAccount.accountHolder, accountNumber: firstAccount.accountNumber
            },
            music: data.media?.music || data.music || null,
            story: { judul: firstStory.judul, tanggal: firstStory.tanggal, cerita: firstStory.cerita, foto: firstStory.foto },
            gallery: typeof firstGallery === "string" ? firstGallery : firstGallery?.src,
            rsvp: data.rsvp?.link || ""
          };
        });
        assert.equal(contractAudit.eventMode, "combined",
          theme.slug + ": template data baru harus memakai mode acara gabungan.");
        assert.equal(contractAudit.renderedEventCount, 1,
          theme.slug + ": akad dan resepsi pada lokasi yang sama harus menjadi satu kartu.");
        assert.equal(contractAudit.combinedScheduleCount, 2,
          theme.slug + ": kartu gabungan harus tetap menampilkan dua jadwal terpisah.");
        assert.ok(contractAudit.events.length >= 2,
          theme.slug + ": data akad/resepsi tidak masuk kontrak normalisasi");
        assert.ok(contractAudit.events.every(event => event.title && event.date && event.timezone && event.mapQuery),
          theme.slug + ": field jadwal/lokasi belum seragam " + JSON.stringify(contractAudit.events));
        assert.ok(contractAudit.events.every(event => event.coordinates?.lat === 0.123456 &&
          event.coordinates?.lng === 120.654321),
          theme.slug + ": koordinat lokasi tidak terbaca konsisten " + JSON.stringify(contractAudit.events));
        assert.ok(contractAudit.events.every(event =>
          event.mapsUrl === "https://www.google.com/maps?q=0.123456,120.654321" &&
          event.mapEmbedUrl === "https://www.google.com/maps?q=0.123456%2C120.654321&t=k&z=17&output=embed"),
          theme.slug + ": alias URL peta lama tidak dinormalisasi ke field kanonis " + JSON.stringify(contractAudit.events));
        assert.ok(contractAudit.account.paymentType && contractAudit.account.provider &&
          contractAudit.account.accountHolder && contractAudit.account.accountNumber,
          theme.slug + ": struktur rekening/metode hadiah belum dinormalisasi " + JSON.stringify(contractAudit.account));
        assert.ok(contractAudit.music && (typeof contractAudit.music === "string" || contractAudit.music.src),
          theme.slug + ": sumber musik tidak terbaca dari media.music");
        assert.ok(contractAudit.story.judul && contractAudit.story.cerita && contractAudit.story.foto,
          theme.slug + ": struktur love story belum lengkap " + JSON.stringify(contractAudit.story));
        assert.ok(contractAudit.gallery,
          theme.slug + ": referensi foto galeri tidak terbaca");

        if (theme.slug === "jendela-senja") {
          const visualAudit = await page.evaluate(() => ({
            theme: document.documentElement.dataset.oaTheme,
            appRoots: document.querySelectorAll("#app").length,
            themeRoots: document.querySelectorAll(".js-theme").length,
            bodyBackground: getComputedStyle(document.body).backgroundColor,
            displayFont: getComputedStyle(document.querySelector(".cover-title")).fontFamily,
            coverImageBound: !!document.querySelector(".cover-image")?.getAttribute("src"),
            eventCards: document.querySelectorAll("#event-list .event-card").length,
            galleryImages: document.querySelectorAll("#gallery-grid img").length,
            giftCards: document.querySelectorAll("#gift-list .gift-card").length,
            radioChoices: document.querySelectorAll("#rsvp-form input[type=radio][name=attendance]").length
          }));
          assert.equal(visualAudit.theme, "jendela-senja", "jendela-senja: slug tema tidak diterapkan.");
          assert.equal(visualAudit.appRoots, 1, "jendela-senja: ditemukan ID #app ganda.");
          assert.equal(visualAudit.themeRoots, 1, "jendela-senja: root tema tidak tunggal.");
          assert.equal(visualAudit.bodyBackground, "rgb(20, 22, 31)", "jendela-senja: CSS tema tidak termuat.");
          assert.ok(visualAudit.displayFont.includes("Bodoni Moda"), "jendela-senja: font display tidak terpasang.");
          assert.ok(visualAudit.coverImageBound, "jendela-senja: foto cover belum terikat dari JSON.");
          assert.ok(visualAudit.eventCards > 0 && visualAudit.galleryImages > 0 && visualAudit.giftCards > 0,
            "jendela-senja: renderer acara/galeri/hadiah tidak mengisi data demo " + JSON.stringify(visualAudit));
          assert.equal(visualAudit.radioChoices, 2, "jendela-senja: pilihan RSVP tidak lengkap.");
        }
        const storyAudit = await page.evaluate(() => ({
          total: Array.isArray(window.__invitationData?.story) ? window.__invitationData.story.length : 0,
          photos: Array.isArray(window.__invitationData?.story) ? window.__invitationData.story.filter(item => item && (item.foto || item.photo || item.image)).length : 0
        }));
        assert.equal(await page.locator("#story-list article, .story-list article").count(), storyAudit.total,
          theme.slug + ": jumlah Love Story tidak sesuai data.json");
        assert.equal(await page.locator("#story-list .oa-story-photo, .story-list .oa-story-photo").count(), storyAudit.photos,
          theme.slug + ": foto Love Story tidak sesuai data.json");
        const expectedStoryTitle = await page.evaluate(() => {
          const story = window.__invitationData?.story;
          const first = Array.isArray(story) ? story[0] : story;
          return String(first?.judul || first?.title || "").trim();
        });
        assert.ok(expectedStoryTitle && (await page.locator("#story-list article, .story-list article").first().textContent()).includes(expectedStoryTitle),
          theme.slug + ": judul Love Story tidak terbaca sesuai data demo.");

        // Regression coverage for the curated demo payment methods and map controls.
        // These assertions run against every active theme using the same demo JSON.
        const copyAudit = await page.evaluate(() => {
        const quote = document.querySelector('[data-bind="quote.text"]');
        const opening = document.querySelector('[data-bind="opening.text"]');
        const inspect = el => el ? {
          textAlign: getComputedStyle(el).textAlign,
          whiteSpace: getComputedStyle(el).whiteSpace,
          width: Math.round(el.getBoundingClientRect().width)
        } : null;
        return { quote: inspect(quote), opening: inspect(opening) };
      });
      if (!copyAudit.quote || !copyAudit.opening) {
        throw new Error(theme.slug + ": seluruh tema wajib menampilkan paragraf pembuka dan doa dari JSON demo " + JSON.stringify(copyAudit));
      }
      if (copyAudit.quote && (copyAudit.quote.textAlign !== "center" || copyAudit.quote.whiteSpace !== "pre-line")) {
        throw new Error(theme.slug + ": teks doa/kutipan harus rata tengah dan mempertahankan paragraf " + JSON.stringify(copyAudit));
      }
      if (copyAudit.opening && (copyAudit.opening.textAlign !== "center" || copyAudit.opening.whiteSpace !== "pre-line")) {
        throw new Error(theme.slug + ": paragraf pembuka harus rata tengah dan mempertahankan jarak paragraf " + JSON.stringify(copyAudit));
      }
      const demoFeatureAudit = await page.evaluate(() => {
          const data = window.__invitationData || {};
          const accounts = Array.isArray(data.gifts?.accounts) ? data.gifts.accounts : [];
          const enabledAccounts = accounts.filter(item => item && item.enabled !== false);
          const eventSource = data.__renderEvents || data.events;
          const events = Array.isArray(eventSource) ? eventSource : Object.values(eventSource || {});
          const mappedEvents = events.filter(item => [item.venue || item.location, item.address].filter(Boolean).length);
          const giftCards = Array.from(document.querySelectorAll("#gift-list .gift-card"));
          const eventCards = Array.from(document.querySelectorAll("#event-list .event-card"));
          const scheduleRows = Array.from(document.querySelectorAll("#event-list .oa-event-schedule-item"));
          return {
            expectedPayments: enabledAccounts.length,
            paymentNames: enabledAccounts.map(item => item.provider || item.bank || item.name || "HADIAH DIGITAL"),
            paymentCards: giftCards.length,
            paymentCardNames: giftCards.map(card => card.querySelector(".gift-bank")?.textContent?.trim() || ""),
            disabledPaymentActions: giftCards.every(card => card.querySelector("button")?.disabled === true),
            hasDemoNotice: /simulasi|tidak dapat digunakan untuk transaksi/i.test(
              document.querySelector("#gift-list .gift-message")?.textContent || ""
            ) && giftCards.every(card =>
              card.querySelector("button")?.disabled === true &&
              /simulasi|bukan rekening aktif|bukan akun aktif|bukan kode pembayaran/i.test(card.innerText)
            ),
            expectedMappedEvents: mappedEvents.length,
            eventCards: eventCards.length,
            scheduleRows: scheduleRows.length,
            expectedScheduleRows: events.reduce((total, item) => total + (Array.isArray(item.schedule) ? item.schedule.length : 0), 0),
            navigationEnabled: data.features?.mapNavigation !== false,
            mapEmbedEnabled: data.features?.mapEmbed !== false,
            locationLinks: document.querySelectorAll(".oa-event-location").length,
            locationHrefs: Array.from(document.querySelectorAll(".oa-event-location")).map(link => link.href),
            expectedMapUrls: events.map(item => item.mapsUrl).filter(Boolean),
            navigationLinks: document.querySelectorAll(".oa-event-navigation").length,
            mapEmbeds: document.querySelectorAll("details.oa-event-map").length,
            lazyMapFrames: Array.from(document.querySelectorAll("details.oa-event-map iframe")).every(frame => {
              try {
                const url = new URL(frame.src);
                return frame.loading === "lazy" && url.protocol === "https:" &&
                  url.hostname === "www.google.com" && url.pathname === "/maps" &&
                  url.searchParams.get("q") === "0.123456,120.654321" &&
                  url.searchParams.get("t") === "k" && url.searchParams.get("z") === "17";
              } catch { return false; }
            })
          };
        });
        assert.equal(demoFeatureAudit.paymentCards, demoFeatureAudit.expectedPayments,
          theme.slug + ": jumlah metode pembayaran demo tidak sesuai JSON " + JSON.stringify(demoFeatureAudit));
        assert.deepEqual(demoFeatureAudit.paymentCardNames, demoFeatureAudit.paymentNames,
          theme.slug + ": metode pembayaran nonaktif ikut tampil atau urutannya berubah " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.disabledPaymentActions, true,
          theme.slug + ": tombol pembayaran demo harus nonaktif " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.hasDemoNotice, true,
          theme.slug + ": peringatan simulasi pembayaran tidak tampil " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.eventCards, demoFeatureAudit.expectedMappedEvents,
          theme.slug + ": jumlah kartu acara tidak sesuai mode JSON " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.scheduleRows, demoFeatureAudit.expectedScheduleRows,
          theme.slug + ": jumlah baris jadwal gabungan tidak sesuai JSON " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.locationLinks, demoFeatureAudit.expectedMappedEvents,
          theme.slug + ": tautan lokasi tidak sesuai data acara " + JSON.stringify(demoFeatureAudit));
        assert.deepEqual(demoFeatureAudit.locationHrefs, demoFeatureAudit.expectedMapUrls,
          theme.slug + ": tautan lokasi harus mempertahankan URL Maps milik data undangan " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.navigationLinks, demoFeatureAudit.navigationEnabled ? demoFeatureAudit.expectedMappedEvents : 0,
          theme.slug + ": tautan navigasi tidak sesuai data acara " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.mapEmbeds, demoFeatureAudit.mapEmbedEnabled ? demoFeatureAudit.expectedMappedEvents : 0,
          theme.slug + ": peta tertanam tidak sesuai data acara " + JSON.stringify(demoFeatureAudit));
        assert.equal(demoFeatureAudit.lazyMapFrames, true,
          theme.slug + ": iframe peta harus memakai titik koordinat uji, mode satelit, zoom 17, dan lazy loading " + JSON.stringify(demoFeatureAudit));
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
        const normalizedImageAudit = await page.evaluate(() => ({
          coverImage: window.__invitationData?.cover?.image,
          coverHeroImage: window.__invitationData?.cover?.heroImage,
          groomPhoto: window.__invitationData?.couple?.groom?.photo,
          bridePhoto: window.__invitationData?.couple?.bride?.photo,
          storyPhotos: (window.__invitationData?.story || []).map(item => item.foto),
          gallerySources: (window.__invitationData?.gallery || []).map(item => typeof item === "string" ? item : item.src)
        }));
        assert.ok(normalizedImageAudit.coverImage && normalizedImageAudit.coverImage === normalizedImageAudit.coverHeroImage,
          theme.slug + ": alias foto cover tidak dinormalisasi " + JSON.stringify(normalizedImageAudit));
        assert.ok(normalizedImageAudit.groomPhoto && normalizedImageAudit.bridePhoto,
          theme.slug + ": alias foto mempelai tidak dinormalisasi " + JSON.stringify(normalizedImageAudit));
        assert.ok(normalizedImageAudit.storyPhotos.length === 4 && normalizedImageAudit.storyPhotos.every(Boolean),
          theme.slug + ": alias foto cerita tidak dinormalisasi " + JSON.stringify(normalizedImageAudit));
        assert.ok(normalizedImageAudit.gallerySources.length > 0 && normalizedImageAudit.gallerySources.every(Boolean),
          theme.slug + ": alias URL galeri tidak dinormalisasi " + JSON.stringify(normalizedImageAudit));
        assert.equal(imageAudit.gallery.length, normalizedImageAudit.gallerySources.length,
          theme.slug + ": jumlah foto galeri yang dirender tidak sesuai data demo " + JSON.stringify(normalizedImageAudit));
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
          const reducedMotionOpenStarted = Date.now();
          await page.locator(theme.open).click();
          await page.waitForFunction(() => {
            const cover = document.getElementById("cover") || document.getElementById("cover-section");
            return !cover || cover.hidden || getComputedStyle(cover).display === "none";
          }, undefined, { timeout: 5000 });
        }
        await page.waitForSelector("#oa-floating-controls", { state: "visible", timeout: 5000 });
        // The cover is already closed and the dock is visible. Theme-native entrance
        // animations may intentionally outlast the smoke timeout; they are not a
        // prerequisite for scroll, gallery or dock interaction checks.
        assert.ok(await page.locator(".oa-closing-section").count() <= 1,
          theme.slug + ": penutup bersama tidak boleh terduplikasi");
        // Pause automatic scrolling before the manual gallery interaction so the observer
        // is not racing the test's scrollIntoView request.
        const autoScrollBeforeGallery = page.locator('#oa-floating-controls [data-oa-action="auto"]');
        if (await autoScrollBeforeGallery.count() &&
            await autoScrollBeforeGallery.getAttribute("aria-pressed") === "true") {
          await autoScrollBeforeGallery.click();
        }
        const galleryImage = page.locator(".gallery-grid img").first();
        if (await galleryImage.count()) {
          await page.evaluate(() => {
            const image = document.querySelector(".gallery-grid img");
            if (image) image.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
          });
          await page.waitForFunction(() => {
            const image = document.querySelector(".gallery-grid img");
            return !image || image.classList.contains("oa-motion-visible");
          }, undefined, { timeout: 5000 });
          await galleryImage.click();
          await page.waitForSelector(".oa-gallery-lightbox", { state: "visible", timeout: 3000 });
          assert.equal(await page.locator(".oa-gallery-lightbox [aria-label='Foto berikutnya']").count(), 1,
            theme.slug + ": tombol foto berikutnya tidak tersedia");
          await page.keyboard.press("ArrowRight");
          await page.keyboard.press("Escape");
          await page.waitForSelector(".oa-gallery-lightbox", { state: "detached", timeout: 3000 });
        }
        const mapAudit = await page.evaluate(() => {
          const frames = Array.from(document.querySelectorAll(".oa-event-map iframe"));
          const notes = Array.from(document.querySelectorAll(".oa-event-map-note"));
          return {
            frames: frames.map(frame => frame.src),
            notes: notes.map(note => note.textContent),
            mapLinks: Array.from(document.querySelectorAll(".oa-event-location")).map(link => link.href),
            eventMode: window.__invitationData?.eventMode || "",
            eventCards: document.querySelectorAll("#event-list .event-card").length,
            scheduleRows: document.querySelectorAll("#event-list .oa-event-schedule-item").length
          };
        });
        // The public demo fixture is asserted unpinned before interception above.
        // This browser-only fixture intentionally adds verified synthetic coordinates,
        // so the iframe count is validated below against the exact satellite URL.
        const expectedLocationCards = mapAudit.eventMode === "combined" ? 1 : 2;
        assert.equal(mapAudit.notes.length, 0,
          theme.slug + ": pin sintetis yang sudah diverifikasi tidak boleh menampilkan peringatan lokasi belum terverifikasi");
        assert.equal(mapAudit.mapLinks.length, expectedLocationCards,
          theme.slug + ": jumlah tautan lokasi harus mengikuti jumlah kartu acara");
        assert.ok(mapAudit.mapLinks.every(url => {
          try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();
            return host === "google.com" || host.endsWith(".google.com") ||
              host === "google.co.id" || host.endsWith(".google.co.id") ||
              host === "maps.app" || host.endsWith(".maps.app") ||
              host === "goo.gl" || host.endsWith(".goo.gl");
          } catch (_) { return false; }
        }), theme.slug + ": tautan Google Maps dari data undangan harus tetap tersedia " + JSON.stringify(mapAudit.mapLinks));
        if (mapAudit.eventMode === "combined") {
          assert.equal(mapAudit.eventCards, 1,
            theme.slug + ": mode gabungan harus menghasilkan tepat satu kartu acara");
          assert.equal(mapAudit.scheduleRows, 2,
            theme.slug + ": kartu gabungan harus memuat dua baris jadwal akad dan resepsi");
        }
        const performanceAudit = await page.evaluate(() => {
          // Audit only elements managed by the new motion layer. Theme-native cover,
          // decorative and legacy transitions are intentionally outside this gate.
          const elements = Array.from(document.querySelectorAll(
            "#app .oa-scroll-reveal, #app .oa-motion-item, #app img.oa-motion-photo"
          ));
          const backdrop = [];
          for (const element of elements) {
            const style = getComputedStyle(element);
            const effect = style.backdropFilter || style.webkitBackdropFilter;
            if (effect && effect !== "none" && !/^blur\\(0(?:px)?\\)$/.test(effect)) backdrop.push(element.tagName.toLowerCase() + (element.className && typeof element.className === "string" ? "." + element.className.trim().replace(/\\s+/g, ".") : ""));
          }
          const motionDurationToken = getComputedStyle(document.documentElement)
            .getPropertyValue("--oa-motion-duration").trim();
          const motionDurationValue = parseFloat(motionDurationToken);
          const motionDurationMs = motionDurationToken.endsWith("s") && !motionDurationToken.endsWith("ms")
            ? motionDurationValue * 1000 : motionDurationValue;
          return { backdrop, motionDurationMs };
        });
        assert.equal(performanceAudit.backdrop.length, 0, theme.slug + ": efek backdrop blur berat masih aktif " + JSON.stringify(performanceAudit.backdrop));
        assert.ok(Number.isFinite(performanceAudit.motionDurationMs) &&
          performanceAudit.motionDurationMs >= 500 && performanceAudit.motionDurationMs <= 550,
          theme.slug + ": token durasi motion adaptif di luar batas 500–550ms " + JSON.stringify(performanceAudit.motionDurationMs));
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
        const motionDirectionAudit = await page.evaluate(() => ({
          left: document.querySelectorAll('#app [data-oa-motion="left"]').length,
          right: document.querySelectorAll('#app [data-oa-motion="right"]').length,
          up: document.querySelectorAll('#app [data-oa-motion="up"]').length,
          photos: document.querySelectorAll('#app img.oa-motion-photo').length
        }));
        assert.ok(motionDirectionAudit.left + motionDirectionAudit.right > 0 && motionDirectionAudit.up > 0,
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
          // A short invitation can already have reached the bottom and stopped
          // automatically. In that case, first start it manually, then test pause.
          if (autoState.pressed === "true") {
            await autoScroll.click();
            assert.equal(await autoScroll.getAttribute("aria-pressed"), "false",
              theme.slug + ": tombol auto-scroll tidak menjeda gulir otomatis");
          } else {
            assert.ok(autoState.scrollY > 24,
              theme.slug + ": auto-scroll tidak mulai otomatis setelah undangan dibuka");
            await autoScroll.click();
            assert.equal(await autoScroll.getAttribute("aria-pressed"), "true",
              theme.slug + ": auto-scroll tidak dapat dimulai manual setelah mencapai akhir");
            await autoScroll.click();
            assert.equal(await autoScroll.getAttribute("aria-pressed"), "false",
              theme.slug + ": tombol auto-scroll tidak menjeda gulir otomatis");
          }
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
        assert.equal(await navigation.locator('[data-oa-action="jump"][data-oa-section="home"]').count(), 1,
          theme.slug + ": tombol Home tidak tersedia atau terduplikasi.");
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
        const nextTargetId = await page.evaluate(() => {
          const marker = window.scrollY + Math.min(window.innerHeight * .34, 260);
          const buttons = Array.from(document.querySelectorAll('#oa-floating-controls [data-oa-action="jump"]'));
          const next = buttons.find(button => {
            const target = document.getElementById(button.dataset.target || "");
            return target && target.getBoundingClientRect().top + window.scrollY > marker + 8;
          });
          return next?.dataset.target || null;
        });
        assert.ok(nextTargetId, theme.slug + ": tidak ada target bagian berikutnya untuk diuji.");
        await navigation.locator('[data-oa-action="next"]').click();
        await page.waitForFunction(id => {
          const target = document.getElementById(id);
          if (!target) return false;
          const rect = target.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        }, nextTargetId, { timeout: 5000 });
        const homeButton = navigation.locator('[data-oa-action="jump"][data-oa-section="home"]');
        const homeTargetId = await homeButton.getAttribute("data-target");
        await homeButton.click();
        // Home is explicitly defined by the shared engine as the top of the page.
        // Some legacy wrappers span the full document and remain "visible" at any scroll position,
        // so checking their intersection/relative movement is not a reliable Home assertion.
        await page.waitForFunction(() => window.scrollY < 24, undefined, { timeout: 5000 });
        assert.ok(await page.locator("#" + homeTargetId).count(),
          theme.slug + ": target Home tidak ditemukan setelah kembali ke atas.");

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
        await page.waitForFunction(() => document.querySelector('#oa-floating-controls [data-oa-action="music"]')?.getAttribute("aria-pressed") === "true", undefined, { timeout: 5000 });
        assert.equal(await page.evaluate(() => document.getElementById("bg-music").__playCalls), 1,
          theme.slug + ": tombol musik tidak memanggil play().");
        await musicControl.click();
        await page.waitForFunction(() => document.querySelector('#oa-floating-controls [data-oa-action="music"]')?.getAttribute("aria-pressed") === "false", undefined, { timeout: 5000 });
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
      page.setDefaultTimeout(5000);
      page.setDefaultNavigationTimeout(15000);
      await page.emulateMedia({ reducedMotion: "reduce" });
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
          const reducedMotionOpenStarted = Date.now();
          await page.locator(theme.open).click();
          await page.waitForFunction(() => {
            const cover = document.getElementById("cover") || document.getElementById("cover-section");
            return !cover || cover.hidden || getComputedStyle(cover).display === "none";
          }, undefined, { timeout: 5000 });
          assert.ok(Date.now() - reducedMotionOpenStarted < 250,
            theme.slug + ": pembukaan cover terlalu lambat saat reduced-motion aktif (" + (Date.now() - reducedMotionOpenStarted) + " ms)");
        }
        assert.equal(await page.locator('#oa-floating-controls [data-oa-action="auto"]').isDisabled(), true,
          theme.slug + ": gulir otomatis harus nonaktif saat reduced-motion aktif");
        await page.waitForSelector("#rsvp-form", { state: "attached", timeout: 10000 });
        await page.waitForSelector("#wishes-form", { state: "attached", timeout: 10000 });
        await captureScreenshot(page, path.join(screenshotDir, `${theme.slug}-mobile.png`));
        const layout = await page.evaluate(() => {
          const data = window.__invitationData || {};
          const rsvpEnabled = data.features?.rsvp !== false && data.rsvp?.enabled !== false;
          const guestbookEnabled = data.features?.guestbook !== false && data.guestbook?.enabled !== false;
          const rsvp = document.querySelector("#rsvp-form");
          const guestbook = document.querySelector("#wishes-form");
          const measure = element => ({
            width: element.getBoundingClientRect().width,
            visible: Boolean(element.getClientRects().length) &&
              getComputedStyle(element).display !== "none" &&
              getComputedStyle(element).visibility !== "hidden"
          });
          return {
            viewport: document.documentElement.clientWidth,
            page: document.documentElement.scrollWidth,
            rsvpEnabled, guestbookEnabled,
            rsvp: measure(rsvp), guestbook: measure(guestbook)
          };
        });
        assert.ok(layout.page <= layout.viewport + 2,
          theme.slug + ": horizontal overflow di mobile " + JSON.stringify(layout));
        if (layout.rsvpEnabled) {
          assert.ok(layout.rsvp.width > 0 && layout.rsvp.width <= layout.viewport,
            theme.slug + ": formulir RSVP aktif tidak responsif " + JSON.stringify(layout));
        } else {
          assert.equal(layout.rsvp.visible, false,
            theme.slug + ": RSVP yang dinonaktifkan pada demo tidak boleh tampil " + JSON.stringify(layout));
        }
        if (layout.guestbookEnabled) {
          assert.ok(layout.guestbook.width > 0 && layout.guestbook.width <= layout.viewport,
            theme.slug + ": buku tamu aktif tidak responsif " + JSON.stringify(layout));
        } else {
          assert.equal(layout.guestbook.visible, false,
            theme.slug + ": buku tamu yang dinonaktifkan pada demo tidak boleh tampil " + JSON.stringify(layout));
        }

        // Verify that the final page content can scroll clear of the fixed shared dock.
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        const dockClearance = await page.evaluate(() => {
          const dock = document.getElementById("oa-floating-controls");
          const app = document.getElementById("app");
          if (!dock || !app) return null;
          const dockRect = dock.getBoundingClientRect();
          const appRect = app.getBoundingClientRect();
          return {
            dockVisible: getComputedStyle(dock).visibility !== "hidden" &&
              getComputedStyle(dock).display !== "none",
            dockTop: dockRect.top,
            appBottom: appRect.bottom,
            gap: dockRect.top - appRect.bottom,
            scrollY: window.scrollY,
            scrollHeight: document.documentElement.scrollHeight
          };
        });
        assert.ok(dockClearance && dockClearance.dockVisible,
          theme.slug + ": dock bersama tidak terlihat saat audit ruang bawah.");
        assert.ok(dockClearance.gap >= 8,
          theme.slug + ": dock menutupi area akhir konten pada mobile " + JSON.stringify(dockClearance));

        // The public demo intentionally disables RSVP and guestbook until release.
        // Do not submit hidden forms or treat their zero layout size as a responsive defect.
        // The API is still mocked above so accidental network writes remain detectable.
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
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
  assert.equal(failures.length, 0, failures.join("\n"));
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
