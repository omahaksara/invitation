(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", initInvitation);

  async function initInvitation() {
    const app = document.getElementById("app");
    if (!app) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get("c") || "";
    const guestName = (params.get("to") || "").trim();
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
      showError(app, "Undangan tidak ditemukan", "Pastikan tautan memiliki parameter ?c=slug-undangan.");
      return;
    }
    const basePath = getBasePath();
    const clientBase = new URL(`${basePath}/clients/${slug}/`, location.origin);
    try {
      const response = await fetch(new URL("data.json", clientBase));
      if (!response.ok) throw new Error("Data undangan tidak ditemukan.");
      const data = await response.json();
      if (data.slug && data.slug !== slug) throw new Error("Slug pada data tidak cocok dengan alamat undangan.");
      if (data.status === "draft") throw new Error("Undangan ini belum dipublikasikan.");
      const requestedTheme = params.get("theme");
      const allowedThemes = new Set(["karsa", "royal-vintage", "sirein", "aksara-signature"]);
      const requested = data.demoMode === true && /^[a-z0-9-]+$/i.test(requestedTheme || "") ? requestedTheme : "";
      // Keep "royal" as a backwards-compatible alias for the actual template folder.
      const requestedAlias = requested === "royal" ? "royal-vintage" : requested;
      const configured = /^[a-z0-9-]+$/i.test(data.theme || "") ? data.theme : "karsa";
      const configuredAlias = configured === "royal" ? "royal-vintage" : configured;
      const theme = allowedThemes.has(requestedAlias) ? requestedAlias : (allowedThemes.has(configuredAlias) ? configuredAlias : "karsa");
      const themeBase = new URL(`${basePath}/templates/${theme}/`, location.origin);
      const templateResponse = await fetch(new URL("index.html", themeBase));
      if (!templateResponse.ok) throw new Error("Tema undangan tidak ditemukan: " + theme);
      const templateHtml = await templateResponse.text();
      // Support both legacy HTML fragments and complete HTML documents.
      if (/<html[\s>]/i.test(templateHtml)) {
        const parsedTemplate = new DOMParser().parseFromString(templateHtml, "text/html");
        parsedTemplate.head.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"], link[rel="preconnect"][href*="fonts"]').forEach(link => {
          const href = link.href;
          if (href && !Array.from(document.head.querySelectorAll("link")).some(existing => existing.href === href)) {
            const copy = document.createElement("link");
            copy.rel = link.rel;
            copy.href = href;
            if (link.crossOrigin) copy.crossOrigin = link.crossOrigin;
            document.head.append(copy);
          }
        });
        // A complete HTML template's <style> lives in its head; preserve it when mounting the body.
        document.head.querySelectorAll("style[data-invitation-theme]").forEach(style => style.remove());
        parsedTemplate.head.querySelectorAll("style").forEach(style => {
          const copy = document.createElement("style");
          copy.setAttribute("data-invitation-theme", theme);
          copy.textContent = style.textContent;
          document.head.append(copy);
        });
        app.innerHTML = parsedTemplate.body.innerHTML;
      } else {
        app.innerHTML = templateHtml;
      }
      document.title = (data.seo && data.seo.title) || (data.cover && data.cover.title) || "Undangan Pernikahan | Omah Aksara";
      renderInvitation(data, clientBase, slug, guestName);
    } catch (error) {
      console.error("Gagal memuat undangan:", error);
      showError(app, "Undangan tidak dapat dimuat", error instanceof Error ? error.message : "Periksa koneksi internet lalu coba lagi.");
    }
  }

  function getBasePath() {
    if (!location.hostname.endsWith(".github.io")) return "";
    const segments = location.pathname.split("/").filter(Boolean);
    return segments.length ? "/" + segments[0] : "";
  }

  function valueAt(obj, path) {
    return path.split(".").reduce((value, key) => value == null ? undefined : value[key], obj);
  }

  function assetUrl(value, clientBase) {
    if (!value) return "";
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:")) return value;
    return new URL(String(value), clientBase).href;
  }

  function renderInvitation(data, clientBase, slug, guestName) {
    ensureFeatureSections(data, clientBase, slug);
    window.__invitationData = data;
    document.querySelectorAll("[data-bind]").forEach(el => {
      const path = el.getAttribute("data-bind");
      const value = valueAt(data, path);
      if (value === undefined || value === null || typeof value === "object") return;
      if (["IMG", "AUDIO", "VIDEO"].includes(el.tagName)) {
        if (String(value).trim()) el.src = assetUrl(value, clientBase);
      } else if (el.tagName === "A") {
        if (String(value).trim()) {
          el.href = String(value);
          el.hidden = false;
          if (/^https?:/i.test(el.href)) { el.target = "_blank"; el.rel = "noopener noreferrer"; }
        } else el.hidden = true;
      } else el.textContent = String(value);
    });

    const safeGuest = guestName || valueAt(data, "guest.defaultName") || "Tamu Undangan";
    const guestEl = document.getElementById("nama-tamu");
    if (guestEl) guestEl.textContent = safeGuest;
    ["rsvp-name", "wishes-name", "wish-name"].forEach(id => {
      const el = document.getElementById(id);
      if (el && guestName) el.value = guestName;
    });

    renderStory(data.story);
    renderEvents(data.events, data, clientBase);
    bindMapLinks(data);
    renderGallery(data.gallery, clientBase);
    renderGifts(data.gifts, clientBase);
    setupMusic(data.music, clientBase);
    setupCover();
    setupReveal();
    setupCountdown(data);
    setupForms(data, slug);
    applyFeatureFlags(data);
    hideEmptyOptionalSections(data);
    setupLightbox();
  }


  function applyFeatureFlags(data) {
    const flags = data && data.features && typeof data.features === "object" ? data.features : {};
    const disabled = key => flags[key] === false;
    const hide = selectors => document.querySelectorAll(selectors).forEach(element => {
      const section = element.matches("section") ? element : element.closest("section");
      if (section) section.hidden = true;
      else element.hidden = true;
    });
    if (disabled("loveStory") || disabled("story")) hide(".story-section, #story-list");
    if (disabled("gallery")) hide(".gallery-section, #gallery-grid, .gallery-grid");
    if (disabled("video")) hide(".video-section, #video-section");
    if (disabled("maps")) {
      document.querySelectorAll("#link-akad-maps, #link-resepsi-maps, .event-card a[href*='maps']").forEach(el => { el.hidden = true; });
      hide(".maps-section, #maps-section");
    }
    if (disabled("countdown")) hide("#countdown, .countdown");
    if (disabled("calendar")) hide(".calendar-section, #calendar-section");
    if (disabled("quotes") || disabled("quote")) hide(".quote-section, .quote");
    if (disabled("gifts")) hide(".gift-section, #gift-section, #gift-list");
    if (disabled("rsvp")) hide("#rsvp-section, .rsvp-section, #rsvp-form, [data-bind='rsvp.link']");
    if (disabled("guestbook")) hide("#guestbook-section, .guestbook-section, #wishes-form");
    if (disabled("hashtag")) hide(".hashtag-section, #hashtag-section");
    if (disabled("guestName")) {
      const guest = document.getElementById("nama-tamu");
      if (guest) { guest.hidden = true; const label = guest.previousElementSibling; if (label && /kepada|tamu/i.test(label.textContent || "")) label.hidden = true; }
    }
    if (disabled("music")) document.querySelectorAll("#music-toggle, #music-btn, #bg-music").forEach(el => { el.hidden = true; el.style.display = "none"; });
  }

  function hideEmptyOptionalSections(data) {
    const hide = selectors => document.querySelectorAll(selectors).forEach(element => {
      const section = element.matches("section") ? element : element.closest("section");
      if (section) section.hidden = true;
      else element.hidden = true;
    });
    const stories = Array.isArray(data.story) ? data.story : [];
    const gallery = Array.isArray(data.gallery) ? data.gallery : (data.gallery && Array.isArray(data.gallery.items) ? data.gallery.items : []);
    const gifts = Array.isArray(data.gifts) ? data.gifts : (data.gifts && Array.isArray(data.gifts.accounts) ? data.gifts.accounts : []);
    if (!stories.length) hide(".story-section, #story-list");
    if (!gallery.length) hide(".gallery-section, #gallery-grid, .gallery-grid");
    if (!gifts.length && !(data.gifts && data.gifts.message)) hide(".gift-section, #gift-section, #gift-list");
    if (!(data.quote && (data.quote.text || data.quote.arab))) hide(".quote-section, .quote");
    if (!(data.video && (data.video.src || data.video.url))) hide(".video-section, #video-section");
    const eventValues = Array.isArray(data.events) ? data.events : Object.values(data.events || {});
    if (!eventValues.some(item => item && (item.mapsUrl || item.mapUrl))) document.querySelectorAll("#link-akad-maps, #link-resepsi-maps").forEach(el => { el.hidden = true; });
    if (!data.countdown?.targetDate && !eventValues.some(item => item && item.date)) hide("#countdown, .countdown");
  }


  function ensureFeatureSections(data, clientBase, slug) {
    const eventItems = Array.isArray(data.events)
      ? data.events
      : Object.entries(data.events || {}).map(([id, item]) => ({ id, ...item }));
    const stories = Array.isArray(data.story) ? data.story : [];
    const gallery = Array.isArray(data.gallery) ? data.gallery : (data.gallery && Array.isArray(data.gallery.items) ? data.gallery.items : []);
    const gifts = Array.isArray(data.gifts) ? data.gifts : (data.gifts && Array.isArray(data.gifts.accounts) ? data.gifts.accounts : []);
    const quote = data.quote || {};
    const video = data.video || {};
    const target = document.querySelector("#main-content, #app-inner, .invitation-container, .invite-shell") || document.getElementById("app");
    if (!target) return;

    const mount = section => {
      const footer = target.querySelector("footer");
      if (footer && footer.parentNode === target) target.insertBefore(section, footer);
      else target.append(section);
    };
    const makeSection = (className, title) => {
      const section = document.createElement("section");
      section.className = "oa-shared-section " + className;
      const heading = document.createElement("h2");
      heading.textContent = title;
      section.append(heading);
      mount(section);
      return section;
    };
    const makeContainer = (section, id, className) => {
      const root = document.createElement("div");
      root.id = id;
      root.className = className || "";
      section.append(root);
      return root;
    };

    if (stories.length && !document.getElementById("story-list") && !document.querySelector(".story-list")) {
      const section = makeSection("story-section", "Cerita Kami");
      makeContainer(section, "story-list", "story-list");
    }
    if (gallery.length && !document.getElementById("gallery-grid") && !document.querySelector(".gallery-grid")) {
      const section = makeSection("gallery-section", "Galeri Kenangan");
      makeContainer(section, "gallery-grid", "gallery-grid");
    }
    if (gifts.length && !document.getElementById("gift-list") && !document.querySelector(".gift-section, [data-bind^='gifts.']")) {
      const section = makeSection("gift-section", "Hadiah Digital");
      if (data.gifts && data.gifts.message) {
        const message = document.createElement("p");
        message.textContent = data.gifts.message;
        section.append(message);
      }
      makeContainer(section, "gift-list", "gift-grid");
    }
    if ((data.countdown?.targetDate || eventItems.some(item => item && item.date)) &&
        !document.getElementById("countdown") && !document.querySelector(".countdown")) {
      const section = makeSection("countdown-section", "Menuju Hari Bahagia");
      const root = makeContainer(section, "countdown", "countdown");
      [["cd-days","Hari"],["cd-hours","Jam"],["cd-minutes","Menit"],["cd-seconds","Detik"]].forEach(([id,label]) => {
        const item = document.createElement("div");
        const value = document.createElement("b"); value.id = id; value.textContent = "00";
        const caption = document.createElement("span"); caption.textContent = label;
        item.append(value, caption); root.append(item);
      });
    }
    if ((quote.text || quote.arab) && !document.querySelector(".quote-section, [data-bind='quote.text'], [data-bind='quote.arab']")) {
      const section = makeSection("quote-section", "Kutipan");
      if (quote.arab) { const arab = document.createElement("p"); arab.setAttribute("data-bind", "quote.arab"); section.append(arab); }
      const text = document.createElement("p"); text.setAttribute("data-bind", "quote.text"); section.append(text);
      const source = document.createElement("small"); source.setAttribute("data-bind", "quote.source"); section.append(source);
    }
    if ((video.src || video.url) && !document.querySelector(".video-section, #video-section")) {
      const section = makeSection("video-section", "Video Kenangan");
      const player = document.createElement("video");
      player.controls = true; player.preload = "metadata"; player.playsInline = true;
      player.setAttribute("data-bind", video.src ? "video.src" : "video.url");
      if (video.poster) player.poster = assetUrl(video.poster, clientBase);
      player.style.cssText = "display:block;width:100%;max-width:900px;margin:0 auto";
      section.append(player);
    }
    if (data.hashtag && !document.querySelector(".hashtag-section, #hashtag-section")) {
      const section = makeSection("hashtag-section", "Hashtag Pernikahan");
      const hashtag = document.createElement("p"); hashtag.textContent = data.hashtag; section.append(hashtag);
    }
    if (eventItems.some(item => item && item.mapsUrl) &&
        !document.querySelector("#link-akad-maps, #link-resepsi-maps, .maps-section, #maps-section")) {
      const section = makeSection("maps-section", "Lokasi Acara");
      eventItems.filter(item => item && item.mapsUrl).forEach(item => {
        const link = document.createElement("a");
        link.href = item.mapsUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.textContent = (item.title || item.id || "Buka Lokasi") + " ↗";
        section.append(link);
      });
    }
    if (eventItems.length && !document.querySelector(".calendar-section, #calendar-section")) {
      const section = makeSection("calendar-section", "Simpan Tanggal");
      eventItems.forEach((item, index) => {
        if (!item || !item.date) return;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Tambahkan " + (item.title || item.id || ("Acara " + (index + 1))) + " ke kalender";
        button.addEventListener("click", () => downloadCalendarEvent(item, data, slug));
        section.append(button);
      });
    }
  }

  function downloadCalendarEvent(event, data, slug) {
    const date = String(event.dateISO || event.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    const timezone = event.timezone || (data.site && data.site.timezone) || "Asia/Makassar";
    const startTime = event.startTime || "00:00";
    const endTime = event.endTime || (startTime === "00:00" ? "01:00" : startTime);
    const toUtc = (dateValue, timeValue, zone) => {
      const [year, month, day] = dateValue.split("-").map(Number);
      const [hour, minute] = timeValue.split(":").map(Number);
      let timestamp = Date.UTC(year, month - 1, day, hour, minute, 0);
      for (let i = 0; i < 3; i++) {
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
        }).formatToParts(new Date(timestamp));
        const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
        const represented = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day),
          Number(values.hour), Number(values.minute), Number(values.second));
        const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
        timestamp += desired - represented;
      }
      return new Date(timestamp);
    };
    const formatUtc = value => value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    let start;
    let end;
    try {
      start = toUtc(date, startTime, timezone);
      end = toUtc(date, endTime, timezone);
    } catch {
      return;
    }
    if (end <= start) end = new Date(start.getTime() + 60 * 60 * 1000);
    const escapeIcs = value => String(value || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/([,;])/g, "\\$1");
    const uid = (slug || "undangan") + "-" + date.replace(/-/g, "") + "-" + (event.id || "event") + "@omahaksara";
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Omah Aksara//Undangan Digital//ID",
      "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + formatUtc(new Date()),
      "DTSTART:" + formatUtc(start), "DTEND:" + formatUtc(end),
      "SUMMARY:" + escapeIcs(event.title || "Acara Pernikahan"),
      "LOCATION:" + escapeIcs([event.location || event.venue, event.address].filter(Boolean).join(", ")),
      "DESCRIPTION:" + escapeIcs("Undangan digital Omah Aksara"),
      "END:VEVENT", "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = (slug || "undangan") + "-" + date + ".ics";
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderStory(stories) {");
    const uid = (slug || "undangan") + "-" + date.replace(/-/g, "") + "-" + (event.id || "event") + "@omahaksara";
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Omah Aksara//Undangan Digital//ID",
      "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + uid, "DTSTAMP:" + formatUtc(new Date()),
      "DTSTART:" + formatUtc(start), "DTEND:" + formatUtc(end),
      "SUMMARY:" + escapeIcs(event.title || "Acara Pernikahan"),
      "LOCATION:" + escapeIcs([event.location || event.venue, event.address].filter(Boolean).join(", ")),
      "DESCRIPTION:" + escapeIcs("Undangan digital Omah Aksara"),
      "END:VEVENT", "END:VCALENDAR"
    ];
    const blob = new Blob([lines.join("\\r\\n") + "\\r\\n"], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = (slug || "undangan") + "-" + date + ".ics";
    document.body.append(anchor); anchor.click(); anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderStory(stories) {
    const root = document.getElementById("story-list");
    if (!root || !Array.isArray(stories)) return;
    // Legacy themes (for example Sirein) already contain data-bound story cards.
    // Keep their original markup and styling; only build cards for empty V2 containers.
    if (root.children.length > 0) return;
    root.replaceChildren();
    stories.forEach((item, index) => {
      const article = document.createElement("article"); article.className = "story-card reveal"; article.style.animationDelay = (index * 100) + "ms";
      const date = document.createElement("time"); date.textContent = item.year || item.date || "";
      const title = document.createElement("h3"); title.textContent = item.title || "Cerita kami";
      const desc = document.createElement("p"); desc.textContent = item.description || "";
      article.append(date, title, desc); root.append(article);
    });
  }

  function renderEvents(events, data, clientBase) {
    const root = document.getElementById("event-list");
    if (!root) return;
    const items = Array.isArray(events) ? events : Object.entries(events || {}).map(([id, value]) => ({ id, ...value }));
    root.replaceChildren();
    items.forEach((item, index) => {
      const card = document.createElement("article"); card.className = "event-card reveal";
      const number = document.createElement("p"); number.className = "event-index"; number.textContent = "ACARA 0" + (index + 1);
      const title = document.createElement("h3"); title.textContent = item.title || item.id || "Acara";
      const date = document.createElement("p"); date.textContent = formatEventDate(item.date, item.timezone || data.site?.timezone) + (item.startTime ? " · " + item.startTime + (item.endTime ? "–" + item.endTime : "") : item.time ? " · " + item.time : "");
      const venue = document.createElement("p"); venue.textContent = [item.venue || item.location, item.address].filter(Boolean).join("\n");
      card.append(number, title, date, venue);
      if (item.mapsUrl) { const link = document.createElement("a"); link.href = item.mapsUrl; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Buka Lokasi ↗"; card.append(link); }
      root.append(card);
    });
  }

  function formatEventDate(date, timezone) {
    if (!date) return "";
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(date + "T12:00:00") : new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    try { return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: timezone || "Asia/Makassar" }).format(parsed); }
    catch { return date; }
  }

  function renderGallery(gallery, clientBase) {
    const root = document.getElementById("gallery-grid");
    if (!root) return;
    const items = Array.isArray(gallery) ? gallery : (gallery && Array.isArray(gallery.items) ? gallery.items : []);
    root.replaceChildren();
    items.forEach(item => {
      const src = typeof item === "string" ? item : item.src;
      if (!src) return;
      const figure = document.createElement("figure"); figure.className = "gallery-item reveal";
      const img = document.createElement("img"); img.src = assetUrl(src, clientBase); img.alt = typeof item === "string" ? "Galeri pernikahan" : (item.alt || "Galeri pernikahan"); img.loading = "lazy";
      figure.append(img); root.append(figure);
    });
  }

  function renderGifts(gifts, clientBase) {
    const root = document.getElementById("gift-list");
    if (!root) return;
    const accounts = Array.isArray(gifts) ? gifts : (gifts && Array.isArray(gifts.accounts) ? gifts.accounts : []);
    root.replaceChildren();
    accounts.forEach(item => {
      const card = document.createElement("article"); card.className = "gift-card reveal";
      const bank = document.createElement("p"); bank.className = "gift-bank"; bank.textContent = item.bank || "HADIAH DIGITAL";
      const holder = document.createElement("h3"); holder.textContent = item.accountHolder || item.accountName || "Penerima";
      const number = document.createElement("p"); number.textContent = item.accountNumber || "";
      const button = document.createElement("button"); button.type = "button"; button.textContent = "Salin Nomor Rekening";
      button.addEventListener("click", () => copyText(item.accountNumber || "", button));
      card.append(bank, holder, number, button);
      const qr = item.qrCode || item.qr;
      const qrSrc = typeof qr === "string" ? qr : qr?.src;
      if (qrSrc) { const img = document.createElement("img"); img.src = assetUrl(qrSrc, clientBase); img.alt = "QR hadiah"; img.loading = "lazy"; img.style.cssText = "display:block;max-width:140px;width:100%;margin:18px auto 0"; card.append(img); }
      root.append(card);
    });
  }

  async function copyText(text, button) {
    if (!text) return;
    const original = button.textContent;
    try {
      await navigator.clipboard.writeText(String(text));
      button.textContent = "Berhasil disalin ✓";
    } catch {
      const helper = document.createElement("textarea"); helper.value = String(text); document.body.append(helper); helper.select();
      const ok = document.execCommand("copy"); helper.remove();
      button.textContent = ok ? "Berhasil disalin ✓" : "Salin manual";
    }
    window.setTimeout(() => button.textContent = original, 1800);
  }

  function setupCover() {
    const cover = document.getElementById("cover-section") || document.getElementById("cover");
    const main = document.getElementById("main-content") || document.getElementById("app-inner");
    const open = document.getElementById("open-invitation-btn") || document.getElementById("open-btn");
    const musicToggle = document.getElementById("music-toggle") || document.getElementById("music-btn");
    const audio = document.getElementById("bg-music");
    const hasMusic = !!(audio && audio.getAttribute("src"));

    if (open) {
      open.addEventListener("click", async () => {
        if (cover) cover.classList.add("is-opening");
        if (main) { main.hidden = false; main.style.display = "block"; }
        if (musicToggle && hasMusic) { musicToggle.hidden = false; musicToggle.style.display = "flex"; }
        window.setTimeout(() => {
          if (cover) { cover.hidden = true; cover.style.display = "none"; }
        }, cover && cover.id === "cover" ? 1800 : 850);
        if (audio && hasMusic) {
          try {
            await audio.play();
            musicToggle?.classList.add("playing");
            musicToggle?.setAttribute("aria-pressed", "true");
            musicToggle?.setAttribute("aria-label", "Jeda musik");
          } catch {
            musicToggle?.setAttribute("aria-pressed", "false");
          }
        }
        setupReveal();
      });
    } else {
      // Tema tanpa sampul pembuka (mis. Royal Vintage) harus tetap bisa memakai musik.
      if (main) { main.hidden = false; main.style.display = "block"; }
      if (musicToggle && hasMusic) { musicToggle.hidden = false; musicToggle.style.display = "flex"; }
    }
  }

  function setupMusic(music, clientBase) {
    const audio = document.getElementById("bg-music");
    const button = document.getElementById("music-toggle") || document.getElementById("music-btn");
    const actualMusic = music || (window.__invitationData && window.__invitationData.media && window.__invitationData.media.music);
    if (!audio || !button) return;
    if (!actualMusic || !(actualMusic.src || typeof actualMusic === "string")) {
      button.hidden = true;
      button.style.display = "none";
      return;
    }

    audio.src = assetUrl(typeof actualMusic === "string" ? actualMusic : actualMusic.src, clientBase);
    if (button.tagName !== "BUTTON") {
      button.setAttribute("role", "button");
      if (!button.hasAttribute("tabindex")) button.tabIndex = 0;
    }
    button.setAttribute("aria-label", "Putar musik");
    button.setAttribute("aria-pressed", "false");

    const syncMusicState = (playing) => {
      button.classList.toggle("playing", playing);
      button.setAttribute("aria-pressed", String(playing));
      button.setAttribute("aria-label", playing ? "Jeda musik" : "Putar musik");
      const icon = button.querySelector("#music-icon");
      if (icon) icon.className = playing
        ? "fa-solid fa-pause absolute text-[9px] text-stone-600"
        : "fa-solid fa-play absolute text-[9px] text-stone-600";
      button.querySelectorAll(".fa-compact-disc").forEach(disc => disc.classList.toggle("fa-spin", playing));
    };

    const toggle = async () => {
      if (audio.paused) {
        try { await audio.play(); syncMusicState(true); }
        catch { syncMusicState(false); }
      } else {
        audio.pause();
        syncMusicState(false);
      }
    };
    button.addEventListener("click", toggle);
    if (button.tagName !== "BUTTON" && button.getAttribute("role") === "button") {
      button.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    }
    audio.addEventListener("play", () => syncMusicState(true));
    audio.addEventListener("pause", () => syncMusicState(false));
  }

  function setupCountdown(data) {
    const target = (Array.isArray(data.events) ? data.events : Object.values(data.events || {})).find(e => e && e.date);
    let targetDate;
    if (data.countdown && data.countdown.targetDate) {
      targetDate = new Date(data.countdown.targetDate);
    } else if (target) {
      const date = target.date;
      const time = target.startTime || "00:00";
      targetDate = new Date(date + "T" + time + ":00" + (target.timezone === "Asia/Makassar" ? "+08:00" : target.timezone === "Asia/Jakarta" ? "+07:00" : target.timezone === "Asia/Jayapura" ? "+09:00" : ""));
    }
    if (!targetDate || Number.isNaN(targetDate.getTime())) return;
    const tick = () => {
      let diff = Math.max(0, targetDate.getTime() - Date.now());
      const days = Math.floor(diff / 86400000); diff %= 86400000;
      const hours = Math.floor(diff / 3600000); diff %= 3600000;
      const minutes = Math.floor(diff / 60000); const seconds = Math.floor((diff % 60000) / 1000);
      [["cd-days",days],["cd-hours",hours],["cd-minutes",minutes],["cd-seconds",seconds]].forEach(([id,value]) => { const el=document.getElementById(id); if(el) el.textContent=String(value).padStart(2,"0"); });
    };
    tick(); window.setInterval(tick,1000);
  }

  // Keep RSVP and guestbook available even in legacy themes that predate the API forms.
  function ensureApiForms() {
    const app = document.getElementById("app");
    if (!app) return;
    const makeField = (labelText, control) => {
      const label = document.createElement("label");
      label.textContent = labelText;
      label.style.cssText = "display:grid;gap:7px;margin:12px 0;font-size:14px";
      control.style.cssText = "box-sizing:border-box;width:100%;padding:12px;border:1px solid #cfc7b8;background:#fffdf8;color:#343a32;font:inherit";
      label.append(control);
      return label;
    };
    const makeSection = (id, title, formId) => {
      let section = document.getElementById(id);
      if (!section && formId) {
        const existingForm = document.getElementById(formId);
        const existingSection = existingForm && existingForm.closest("section");
        if (existingSection && !existingSection.id) {
          existingSection.id = id;
          section = existingSection;
        }
      }
      if (!section) {
        section = document.createElement("section");
        section.id = id;
        section.style.cssText = "padding:48px 20px;max-width:680px;margin:0 auto;color:inherit";
        const heading = document.createElement("h2");
        heading.textContent = title;
        heading.style.cssText = "text-align:center;font-family:Georgia,serif;font-weight:400";
        section.append(heading);
        const footer = app.querySelector("footer");
        if (footer && footer.parentNode) footer.parentNode.insertBefore(section, footer); else app.append(section);
      }
      return section;
    };
    const makeForm = (section, id) => {
      let form = document.getElementById(id);
      if (!form) {
        form = document.createElement("form");
        form.id = id;
        form.style.cssText = "max-width:520px;margin:0 auto;padding:20px;border:1px solid #d8cbbb;background:#fffdf8";
        section.append(form);
      }
      return form;
    };
    const makeStatus = (form, id) => {
      let status = document.getElementById(id);
      if (!status) {
        status = document.createElement("p");
        status.id = id;
        status.setAttribute("role", "status");
        status.style.cssText = "font-size:13px;line-height:1.6;text-align:center";
        form.append(status);
      }
      return status;
    };
    const makeButton = text => {
      const button = document.createElement("button");
      button.type = "submit";
      button.textContent = text;
      button.style.cssText = "width:100%;padding:13px;border:0;background:#485445;color:white;cursor:pointer;font:inherit;margin-top:8px";
      return button;
    };

    const rsvpSection = makeSection("rsvp-section", "Konfirmasi Kehadiran", "rsvp-form");
    const rsvpForm = makeForm(rsvpSection, "rsvp-form");
    let rsvpName = rsvpForm.querySelector('[name="name"], #rsvp-name');
    if (!rsvpName) {
      rsvpName = document.createElement("input");
      rsvpName.id = "rsvp-name";
      rsvpForm.prepend(makeField("Nama", rsvpName));
    }
    rsvpName.name = "name"; rsvpName.required = true; rsvpName.maxLength = 100; rsvpName.autocomplete = "name";
    if (!rsvpForm.querySelector('[name="attendance"]')) {
      const attendance = document.createElement("select");
      attendance.name = "attendance"; attendance.required = true;
      [["", "Pilih jawaban"], ["hadir", "Insyaallah hadir"], ["tidak_hadir", "Mohon maaf, belum bisa hadir"]].forEach(([value, text]) => {
        const option = document.createElement("option"); option.value = value; option.textContent = text; attendance.append(option);
      });
      rsvpForm.append(makeField("Konfirmasi", attendance));
    }
    if (!rsvpForm.querySelector('[name="guestCount"]')) {
      const count = document.createElement("select"); count.name = "guestCount";
      [["1", "1 orang"], ["2", "2 orang"]].forEach(([value, text]) => { const option = document.createElement("option"); option.value = value; option.textContent = text; count.append(option); });
      rsvpForm.append(makeField("Jumlah tamu", count));
    }
    let rsvpButton = rsvpForm.querySelector('button[type="submit"]') || rsvpForm.querySelector("button:not([type])");
    if (rsvpButton) rsvpButton.type = "submit";
    else rsvpForm.append(makeButton("Kirim Konfirmasi"));
    makeStatus(rsvpForm, "rsvp-status");

    const guestSection = makeSection("guestbook-section", "Ucapan & Doa", "wishes-form");
    const wishesForm = makeForm(guestSection, "wishes-form");
    let wishesName = wishesForm.querySelector('[name="name"], #wishes-name, #wish-name');
    if (!wishesName) {
      wishesName = document.createElement("input");
      wishesName.id = "wishes-name";
      wishesForm.prepend(makeField("Nama", wishesName));
    }
    wishesName.name = "name"; wishesName.required = true; wishesName.maxLength = 100; wishesName.autocomplete = "name";
    const message = wishesForm.querySelector('[name="message"]') || wishesForm.querySelector("textarea");
    if (message) { message.name = "message"; message.maxLength = 500; message.required = true; }
    else {
      const textarea = document.createElement("textarea"); textarea.name = "message"; textarea.id = "wish-message"; textarea.rows = 4; textarea.maxLength = 500; textarea.required = true; textarea.placeholder = "Tuliskan doa terbaik...";
      wishesForm.append(makeField("Ucapan", textarea));
    }
    let wishesButton = wishesForm.querySelector('button[type="submit"]') || wishesForm.querySelector("button:not([type])");
    if (wishesButton) wishesButton.type = "submit";
    else wishesForm.append(makeButton("Kirim Ucapan"));
    makeStatus(wishesForm, "wishes-status");
    let list = document.getElementById("wishes-list") || document.getElementById("wishes-container");
    if (!list) { list = document.createElement("div"); guestSection.append(list); }
    list.id = "wishes-list";
    list.setAttribute("aria-live", "polite");
    list.style.cssText += ";display:grid;gap:12px;margin:24px auto;max-width:620px";
  }

  function setupForms(data, slug) {
    ensureApiForms();
    const configuredApiUrl = (data.integrations && data.integrations.apiUrl) || (data.api && (data.api.apiUcapan || data.api.apiUrl)) || "";
    const apiUrl = /^https:\/\//i.test(configuredApiUrl) ? configuredApiUrl : "";
    const rsvp = document.getElementById("rsvp-form");
    const wishes = document.getElementById("wishes-form");
    if (data.rsvp && data.rsvp.enabled === false) { const section=document.getElementById("rsvp-section"); if(section) section.hidden=true; }
    if (data.guestbook && data.guestbook.enabled === false) { const section=document.getElementById("guestbook-section"); if(section) section.hidden=true; }
    if (!apiUrl && data.demoMode !== true) {
      const message = "Formulir belum aktif karena endpoint backend belum dikonfigurasi.";
      [["rsvp-status", rsvp], ["wishes-status", wishes]].forEach(([id, form]) => {
        const status = document.getElementById(id);
        if (status) status.textContent = message;
        const button = form && form.querySelector("button[type=submit]");
        if (button) button.disabled = true;
      });
    }
    if (rsvp) rsvp.addEventListener("submit", async event => {
      event.preventDefault();
      const status = document.getElementById("rsvp-status");
      const button = rsvp.querySelector("button[type=submit]");
      if (!apiUrl && data.demoMode !== true) { status.textContent = "RSVP belum aktif karena endpoint backend belum dikonfigurasi."; return; }
      const form = new FormData(rsvp);
      const payload = { action:"rsvp", slug, name:String(form.get("name")||"").trim(), attendance:form.get("attendance"), guestCount:Number(form.get("guestCount")||1) };
      if (!payload.name || !payload.attendance) { status.textContent="Mohon lengkapi nama dan konfirmasi."; return; }
      if (data.rsvp?.maxGuestCount && payload.guestCount > data.rsvp.maxGuestCount) { status.textContent="Jumlah tamu melebihi batas undangan."; return; }
      if (data.demoMode === true) { status.textContent="Simulasi demo: konfirmasi tidak dikirim ke database."; return; }
      await sendPayload(apiUrl,payload,status,button,"Konfirmasi berhasil dikirim.");
    });
    if (wishes) wishes.addEventListener("submit", async event => {
      event.preventDefault();
      let status = document.getElementById("wishes-status");
      if (!status) { status = document.createElement("p"); status.id = "wishes-status"; status.setAttribute("role", "status"); wishes.append(status); }
      const button = wishes.querySelector("button[type=submit]");
      if (!apiUrl && data.demoMode !== true) { status.textContent = "Buku tamu belum aktif karena endpoint backend belum dikonfigurasi."; return; }
      const form = new FormData(wishes);
      const payload = { action:"guestbook", slug, name:String(form.get("name")||"").trim(), message:String(form.get("message")||"").trim() };
      if (!payload.name || !payload.message || payload.message.length > (data.guestbook?.maxMessageLength || 500)) { status.textContent="Mohon isi nama dan ucapan (maksimal 500 karakter)."; return; }
      if (data.demoMode === true) {
        appendDemoWish(payload.name, payload.message);
        status.textContent="Simulasi demo: ucapan hanya tampil di halaman ini dan tidak disimpan ke database.";
        wishes.reset();
        return;
      }
      const ok = await sendPayload(apiUrl,payload,status,button,"Ucapan berhasil dikirim.");
      if (ok) { wishes.reset(); loadWishes(apiUrl,slug); }
    });
    if (data.demoMode === true && wishes) renderDemoWishes(data.demoGreetings || []);
    else if (apiUrl && wishes) loadWishes(apiUrl,slug);
  }

  async function sendPayload(apiUrl,payload,status,button,successText) {
    if (button) button.disabled=true;
    status.textContent="Mengirim...";
    try {
      const response = await fetch(apiUrl,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload),redirect:"follow"});
      if (!response.ok) throw new Error("Server merespons dengan status " + response.status);
      const result = await response.json();
      if (!result || result.ok !== true) throw new Error(result?.message || "Data belum tersimpan.");
      status.textContent=successText; return true;
    } catch (error) {
      console.error("API Omah Aksara:",error);
      status.textContent="Belum berhasil mengirim. Periksa URL Apps Script dan izin deployment, lalu coba lagi.";
      return false;
    } finally { if (button) button.disabled=false; }
  }

  function makeWishCard(item) {
    const card = document.createElement("article"); card.className = "wish-card";
    const name = document.createElement("h3"); name.textContent = item.name || "Tamu";
    const message = document.createElement("p"); message.textContent = item.message || "";
    card.append(name, message);
    return card;
  }

  function renderDemoWishes(items) {
    const root = document.getElementById("wishes-list"); if (!root) return;
    root.replaceChildren();
    const label = document.createElement("p");
    label.className = "demo-wishes-label";
    label.textContent = "CONTOH UCAPAN — MODE DEMO (bukan data tamu sungguhan)";
    label.style.cssText = "font-size:11px;letter-spacing:.08em;text-align:center;color:#8a7253;padding:10px;border:1px dashed #cfc7b8";
    root.append(label);
    if (!items.length) {
      const empty = document.createElement("p"); empty.textContent = "Jadilah yang pertama mencoba menulis ucapan demo."; root.append(empty); return;
    }
    items.forEach(item => root.append(makeWishCard(item)));
  }

  function appendDemoWish(name, message) {
    const root = document.getElementById("wishes-list"); if (!root) return;
    const card = makeWishCard({name, message});
    const label = root.querySelector(".demo-wishes-label");
    if (label && label.nextSibling) root.insertBefore(card, label.nextSibling);
    else root.append(card);
  }

  async function loadWishes(apiUrl,slug) {
    const root=document.getElementById("wishes-list"); if(!root) return;
    try {
      const url=new URL(apiUrl); url.searchParams.set("action","guestbook"); url.searchParams.set("slug",slug);
      const response=await fetch(url); if(!response.ok) throw new Error("Gagal membaca buku tamu");
      const result=await response.json(); if(!result.ok || !Array.isArray(result.items)) return;
      root.replaceChildren();
      if(!result.items.length){const empty=document.createElement("p");empty.className="empty-wishes";empty.textContent="Jadilah yang pertama mengirim doa.";root.append(empty);return;}
      result.items.forEach(item=>root.append(makeWishCard(item)));
    } catch(error) { console.warn("Buku tamu belum dapat dimuat:",error); }
  }

  function bindMapLinks(data) {
    const akad = document.getElementById("link-akad-maps");
    const resepsi = document.getElementById("link-resepsi-maps");
    const akadUrl = data.events && !Array.isArray(data.events) && data.events.akad && data.events.akad.mapsUrl;
    const resepsiUrl = data.events && !Array.isArray(data.events) && data.events.resepsi && data.events.resepsi.mapsUrl;
    if (akad && akadUrl) { akad.href = akadUrl; akad.target = "_blank"; akad.rel = "noopener noreferrer"; }
    if (resepsi && resepsiUrl) { resepsi.href = resepsiUrl; resepsi.target = "_blank"; resepsi.rel = "noopener noreferrer"; }
  }

  function setupReveal() {
    const elements=document.querySelectorAll(".reveal:not(.active)");
    if(!elements.length) return;
    if(!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) { elements.forEach(el=>el.classList.add("active")); return; }
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("active");observer.unobserve(entry.target);}}),{threshold:.12});
    elements.forEach(el=>observer.observe(el));
  }

  function setupLightbox() {
    const gallery=document.getElementById("gallery-grid") || document.querySelector(".gallery-grid"); if(!gallery) return;
    gallery.addEventListener("click",event=>{
      const img=event.target.closest("img"); if(!img) return;
      const overlay=document.createElement("div"); overlay.className="lightbox-overlay";
      overlay.style.cssText="position:fixed;inset:0;z-index:1000;background:#141914ed;display:grid;place-items:center;padding:20px;cursor:zoom-out";
      const full=document.createElement("img");full.src=img.src;full.alt=img.alt;full.style.cssText="max-width:100%;max-height:90vh;object-fit:contain;box-shadow:0 10px 50px #0008";
      overlay.append(full);overlay.addEventListener("click",()=>overlay.remove());document.body.append(overlay);
    });
  }

  window.copyRekening = async () => {
    const element = document.getElementById("rekening-num");
    if (!element) return;
    const value = element.textContent.trim();
    try { await navigator.clipboard.writeText(value); window.alert("Nomor rekening berhasil disalin."); }
    catch { window.alert("Silakan salin nomor rekening secara manual: " + value); }
  };
  window.submitWish = event => { if (event) event.preventDefault(); };
  window.openInvitation = () => {};
  window.toggleMusic = () => {};

  function showError(app,title,message) {
    app.replaceChildren(); const panel=document.createElement("div");panel.className="loading-wrap";panel.style.cssText="min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:24px;background:#f7f2e9;color:#423b32";
    const heading=document.createElement("h2");heading.textContent=title;heading.style.fontFamily="Georgia,serif";
    const desc=document.createElement("p");desc.textContent=message;desc.style.maxWidth="500px";desc.style.lineHeight="1.7";panel.append(heading,desc);app.append(panel);
  }
})();