(() => {
  "use strict";
  document.addEventListener("DOMContentLoaded", initInvitation);

  async function initInvitation() {
    const app = document.getElementById("app");
    if (!app) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get("c") || "";
    const guestName = (params.get("to") || "").trim();
    const buildShortInvitationUrl = () => {
      const path = "/i/" + encodeURIComponent(slug) + (guestName ? "/" + encodeURIComponent(guestName) : "");
      const shortUrl = new URL(path, "https://omahaksara.github.io");
      const selectedTheme = params.get("theme") || "";
      if (/^[a-z0-9][a-z0-9-]*$/i.test(selectedTheme)) shortUrl.searchParams.set("theme", selectedTheme);
      return shortUrl.toString();
    };
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug)) {
      showError(app, "Undangan tidak ditemukan", "Pastikan tautan memiliki parameter ?c=slug-undangan.");
      return;
    }
    const basePath = getBasePath();
    const clientBase = new URL(`${basePath}/clients/${slug}/`, location.origin);
    try {
      const dataUrl = new URL("data.json", clientBase);
      dataUrl.searchParams.set("_v", "20261111-army-theme-v1");
      const response = await fetch(dataUrl, { cache: "no-store" });
      if (!response.ok) throw new Error("Data undangan tidak ditemukan.");
      const data = await response.json();
      if (data.slug && data.slug !== slug) throw new Error("Slug pada data tidak cocok dengan alamat undangan.");
      if (data.status === "draft") throw new Error("Undangan ini belum dipublikasikan.");
      normalizeDemoAssets(data, slug);
      normalizeTemplateData(data);
      const requestedTheme = params.get("theme");
      // Theme slugs are validated before they can override a published invitation.
      // Demo previews retain folder-based discovery; published invitations only accept
      // themes explicitly marked active in templates/registry.json.
      const isThemeSlug = value => /^[a-z0-9][a-z0-9-]*$/i.test(value || "");
      const canonicalTheme = value => value === "royal" ? "royal-vintage" : value;
      const configured = isThemeSlug(data.theme) ? data.theme : "karsa";
      const configuredAlias = canonicalTheme(configured);
      let requestedAlias = "";
      if (data.demoMode === true && isThemeSlug(requestedTheme)) {
        requestedAlias = canonicalTheme(requestedTheme);
      } else if (data.status === "published" && isThemeSlug(requestedTheme)) {
        const candidate = canonicalTheme(requestedTheme);
        try {
          const registryUrl = new URL(`${basePath}/templates/registry.json`, location.origin);
          registryUrl.searchParams.set("_v", "20261111-army-theme-v1");
          const registryResponse = await fetch(registryUrl, { cache: "no-store" });
          if (registryResponse.ok) {
            const registry = await registryResponse.json();
            const activeThemes = Array.isArray(registry.themes)
              ? registry.themes.filter(item => item && item.status === "active").map(item => item.slug)
              : [];
            if (activeThemes.includes(candidate)) requestedAlias = candidate;
          }
        } catch (themeError) {
          // Fail safely: a registry/network problem keeps the configured theme.
          console.warn("Tema dari link diabaikan; memakai tema bawaan undangan.", themeError);
        }
      }
      // Never let a stale or mistyped theme slug turn the whole invitation into a blank/error page.
      // Try the requested theme first, then the configured theme, then the known base theme.
      const themeCandidates = [...new Set([requestedAlias, configuredAlias, "karsa"].filter(Boolean))];
      let theme = "";
      let templateHtml = "";
      let templateError = null;
      for (const candidateTheme of themeCandidates) {
        try {
          const themeBase = new URL(`${basePath}/templates/${candidateTheme}/`, location.origin);
          const templateUrl = new URL("index.html", themeBase);
          templateUrl.searchParams.set("_v", "20261111-army-theme-v1");
          const templateResponse = await fetch(templateUrl, { cache: "no-store" });
          if (!templateResponse.ok) {
            templateError = new Error("Tema undangan tidak ditemukan: " + candidateTheme);
            continue;
          }
          templateHtml = await templateResponse.text();
          theme = candidateTheme;
          break;
        } catch (error) {
          templateError = error;
        }
      }
      if (!theme || !templateHtml) {
        throw templateError || new Error("Tema undangan tidak dapat dimuat.");
      }
      // Expose the actually selected theme to scoped engine controls; URL overrides are respected.
      document.documentElement.dataset.oaTheme = theme;
      if (theme !== (requestedAlias || configuredAlias)) {
        console.warn("Tema pilihan tidak tersedia; memakai tema cadangan:", theme);
      }
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
      renderInvitation(data, clientBase, slug, guestName, buildShortInvitationUrl, params.get("view") === "portfolio");
    } catch (error) {
      console.error("Gagal memuat undangan:", error);
      showError(app, "Undangan tidak dapat dimuat", error instanceof Error ? error.message : "Periksa koneksi internet lalu coba lagi.");
    }
  }

  // Keep the public demo independent from external/legacy image URLs.
  // This normalization is deliberately scoped to demo-katalog only; client data is untouched.
  function normalizeDemoAssets(data, slug) {
    if (slug !== "demo-katalog" || !data || data.demoMode !== true) return;
    data.cover = data.cover && typeof data.cover === "object" ? data.cover : {};
    data.cover.image = "foto-sampul.jpg";
    data.cover.heroImage = "foto-sampul.jpg";

    data.couple = data.couple && typeof data.couple === "object" ? data.couple : {};
    data.couple.groom = data.couple.groom && typeof data.couple.groom === "object" ? data.couple.groom : {};
    data.couple.bride = data.couple.bride && typeof data.couple.bride === "object" ? data.couple.bride : {};
    data.couple.groom.photo = "foto-pria.jpg";
    data.couple.bride.photo = "foto-wanita.jpg";

    data.gallery = ["foto1.jpg", "foto2.jpg", "foto3.jpg", "foto4.jpg"];
    data.media = data.media && typeof data.media === "object" ? data.media : {};
    data.media.music = {
      id: "wedding-demo-existing",
      title: "Wedding Demo Track",
      category: "instrumental",
      src: "../../assets/music/library/wedding-demo-existing.mp3"
    };
    if (data.music) data.music = data.media.music;
  }

  // Normalize common data differences before binding them to any theme.
  // This keeps older and newer client JSON files usable without changing their source files.
  function normalizeTemplateData(data) {
    if (!data || typeof data !== "object") return;
    data.cover = data.cover && typeof data.cover === "object" ? data.cover : {};
    if (!data.cover.heroImage) data.cover.heroImage = data.cover.image || "";
    if (!data.cover.eyebrow) data.cover.eyebrow = data.cover.title || "The Wedding Of";
    if (!data.cover.buttonText) data.cover.buttonText = "Buka Undangan";

    const eventEntries = Array.isArray(data.events)
      ? data.events.map((event, index) => [event && event.id ? String(event.id).toLowerCase() :
          (/akad/i.test(String(event && event.title || "")) ? "akad" :
          (/resepsi|reseption/i.test(String(event && event.title || "")) ? "resepsi" : (index === 0 ? "akad" : index === 1 ? "resepsi" : "acara-" + (index + 1)))), event])
      : Object.entries(data.events || {});
    if (Array.isArray(data.events)) {
      const normalizedEvents = {};
      eventEntries.forEach(([key, event]) => {
        if (!event || typeof event !== "object") return;
        const safeKey = key || "acara";
        normalizedEvents[safeKey] = { ...event };
        if (!normalizedEvents[safeKey].date && normalizedEvents[safeKey].dateISO) {
          normalizedEvents[safeKey].date = formatEventDate(normalizedEvents[safeKey].dateISO, normalizedEvents[safeKey].timezone || data.site?.timezone);
        }
        if (!normalizedEvents[safeKey].time && normalizedEvents[safeKey].startTime) {
          normalizedEvents[safeKey].time = normalizedEvents[safeKey].startTime +
            (normalizedEvents[safeKey].endTime ? "–" + normalizedEvents[safeKey].endTime : "");
        }
        if (!normalizedEvents[safeKey].location && normalizedEvents[safeKey].venue) {
          normalizedEvents[safeKey].location = normalizedEvents[safeKey].venue;
        }
      });
      data.events = normalizedEvents;
    }

    // New invitations may opt into one combined event card. Legacy JSON without
    // eventMode keeps its original rendering and calendar behavior unchanged.
    if (data.eventMode === "combined" && data.events && !Array.isArray(data.events)) {
      const akad = data.events.akad;
      const resepsi = data.events.resepsi;
      if (akad && typeof akad === "object" && resepsi && typeof resepsi === "object") {
        const sameText = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
        const coordinateKey = event => {
          const point = event.coordinates || {};
          const lat = point.lat ?? event.latitude ?? event.lat;
          const lng = point.lng ?? point.lon ?? event.longitude ?? event.lng ?? event.lon;
          return lat != null && lng != null ? String(lat).trim() + "," + String(lng).trim() : "";
        };
        const akadPoint = coordinateKey(akad), resepsiPoint = coordinateKey(resepsi);
        const samePoint = !!(akadPoint && resepsiPoint && sameText(akadPoint, resepsiPoint));
        const sameMap = !!(akad.mapsUrl && resepsi.mapsUrl && sameText(akad.mapsUrl, resepsi.mapsUrl));
        const sameVenue = sameText(akad.location || akad.venue, resepsi.location || resepsi.venue) &&
          sameText(akad.address, resepsi.address) &&
          !!(akad.location || akad.venue || akad.address);
        const mapCompatible = !(akad.mapsUrl && resepsi.mapsUrl) || sameMap;
        const coordinateCompatible = !(akadPoint && resepsiPoint) || samePoint;
        if ((samePoint || sameMap || sameVenue) && mapCompatible && coordinateCompatible) {
          const scheduleEntry = (event, id, fallbackTitle) => ({
            id,
            title: event.title || fallbackTitle,
            date: event.date || (event.dateISO ? formatEventDate(event.dateISO, event.timezone || data.site?.timezone) : ""),
            dateISO: event.dateISO || "",
            startTime: event.startTime || "",
            endTime: event.endTime || "",
            time: event.time || "",
            timezone: event.timezone || akad.timezone || resepsi.timezone || data.site?.timezone || "Asia/Makassar"
          });
          const first = akad;
          data.__renderEvents = {
            combined: {
              id: "combined",
              title: "Akad & Resepsi",
              date: first.date || (first.dateISO ? formatEventDate(first.dateISO, first.timezone || data.site?.timezone) : ""),
              dateISO: first.dateISO || "",
              startTime: first.startTime || "",
              endTime: first.endTime || "",
              timezone: first.timezone || resepsi.timezone || data.site?.timezone || "Asia/Makassar",
              location: first.location || first.venue || resepsi.location || resepsi.venue || "",
              address: first.address || resepsi.address || "",
              mapsUrl: first.mapsUrl || resepsi.mapsUrl || "",
              mapEmbedUrl: first.mapEmbedUrl || resepsi.mapEmbedUrl || "",
              coordinates: first.coordinates || resepsi.coordinates,
              latitude: first.latitude ?? first.lat,
              longitude: first.longitude ?? first.lng ?? first.lon,
              mapQuery: first.mapQuery || resepsi.mapQuery || "",
              mapNote: first.mapNote || resepsi.mapNote || "",
              schedule: [
                scheduleEntry(akad, "akad", "Akad Nikah"),
                scheduleEntry(resepsi, "resepsi", "Resepsi Pernikahan")
              ]
            }
          };
        }
      }
    }

    if (data.eventMode === "akad-only" && data.events && !Array.isArray(data.events)) {
      data.__renderEvents = data.events.akad ? { akad: data.events.akad } : {};
    } else if (data.eventMode === "resepsi-only" && data.events && !Array.isArray(data.events)) {
      data.__renderEvents = data.events.resepsi ? { resepsi: data.events.resepsi } : {};
    }
    const renderEventsData = data.__renderEvents || data.events;
    const events = Array.isArray(renderEventsData) ? renderEventsData : Object.values(renderEventsData || {});
    const firstEvent = events.find(event => event && (event.date || event.dateISO));
    if (!data.cover.dateLabel && firstEvent) data.cover.dateLabel = firstEvent.date || firstEvent.dateISO || "";
    data.opening = data.opening && typeof data.opening === "object" ? data.opening : {};
    if (!data.opening.text) data.opening.text = "Dengan penuh sukacita, kami mengundang Anda untuk hadir di hari bahagia kami.";
    if (data.gifts && !data.gifts.message) {
      data.gifts.message = "Doa restu Anda merupakan hadiah terindah bagi kami.";
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

  function renderInvitation(data, clientBase, slug, guestName, buildShortInvitationUrl, viewOnly = false) {
    ensureFeatureSections(data, clientBase, slug, buildShortInvitationUrl);
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

    renderStory(data.story, clientBase);
    renderEvents(data.__renderEvents || data.events, data, clientBase);
    bindMapLinks(data);
    renderGallery(data.gallery, clientBase);
    renderClosing(data);
    renderGifts(data.gifts, clientBase, data.features || {});
    setupMusic(data.music, clientBase);
    setupCover();
    setupReveal();
    setupCountdown(data);
    setupForms(data, slug, viewOnly);
    applyFeatureFlags(data);
    hideEmptyOptionalSections(data);
    setupLightbox();
    ensureFloatingControls(data, buildShortInvitationUrl);
    // Forms, navigation, and fallback sections are created above; observe them too.
    setupReveal();
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
      document.querySelectorAll("#link-akad-maps, #link-resepsi-maps, .event-card a[href*='maps'], .oa-event-map, .oa-event-navigation").forEach(el => { el.hidden = true; });
      hide(".maps-section, #maps-section");
    } else {
      if (disabled("mapEmbed")) document.querySelectorAll(".oa-event-map").forEach(el => { el.hidden = true; });
      if (disabled("navigation")) document.querySelectorAll(".oa-event-navigation").forEach(el => { el.hidden = true; });
    }
    if (disabled("countdown")) hide("#countdown, .countdown");
    if (disabled("closing")) hide("[data-oa-closing], .oa-closing-section, .closing-section, #closing-section, .thank-you-section");
    if (disabled("calendar")) hide(".calendar-section, #calendar-section");
    if (disabled("quotes") || disabled("quote")) hide(".quote-section, .quote");
    if (disabled("gifts") || (data.gifts && !Array.isArray(data.gifts) && data.gifts.enabled === false)) hide(".gift-section, #gift-section, #gift-list");
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
    if (!(data.closing && (data.closing.title || data.closing.text || data.closing.signature))) hide("[data-oa-closing], .oa-closing-section");
    if (!(data.video && (data.video.src || data.video.url))) hide(".video-section, #video-section");
    const eventSource = data.__renderEvents || data.events;
    const eventValues = Array.isArray(eventSource) ? eventSource : Object.values(eventSource || {});
    if (!eventValues.some(item => item && (item.mapsUrl || item.mapUrl))) document.querySelectorAll("#link-akad-maps, #link-resepsi-maps").forEach(el => { el.hidden = true; });
    if (!data.countdown?.targetDate && !eventValues.some(item => item && item.date)) hide("#countdown, .countdown");
  }


  function ensureFeatureSections(data, clientBase, slug, buildShortInvitationUrl) {
    const eventSource = data.__renderEvents || data.events;
    const eventItems = Array.isArray(eventSource)
      ? eventSource
      : Object.entries(eventSource || {}).map(([id, item]) => ({ id, ...item }));
    const stories = Array.isArray(data.story) ? data.story : [];
    const gallery = Array.isArray(data.gallery) ? data.gallery : (data.gallery && Array.isArray(data.gallery.items) ? data.gallery.items : []);
    const gifts = Array.isArray(data.gifts) ? data.gifts : (data.gifts && Array.isArray(data.gifts.accounts) ? data.gifts.accounts : []);
    const quote = data.quote || {};
    const video = data.video || {};
    const target = document.getElementById("main-content") || document.getElementById("app-inner") || document.querySelector(".invitation-container") || document.querySelector(".invite-shell") || document.getElementById("app");
    if (!target) return;

    const mount = section => {
      const footer = target.querySelector("footer");
      if (footer && footer.parentNode) footer.parentNode.insertBefore(section, footer);
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

    // One shared event renderer serves every theme. When a legacy theme has
    // hard-coded event cards instead of #event-list, hide those cards and mount
    // the shared renderer into the existing event section (or create one).
    if (eventItems.length && !document.getElementById("event-list")) {
      const legacyTitles = [...document.querySelectorAll('[data-bind="events.akad.title"], [data-bind="events.resepsi.title"]')];
      let eventSection = (legacyTitles[0] && legacyTitles[0].closest("section")) ||
        document.querySelector(".events-section, .event-section, #events-section, #events");
      if (!eventSection) eventSection = makeSection("events-section", "Rangkaian Acara");
      legacyTitles.forEach(title => {
        let node = title.parentElement;
        while (node && node !== eventSection) {
          const relatedBindings = node.querySelectorAll('[data-bind^="events."]').length;
          if (relatedBindings >= 2) {
            node.hidden = true;
            node.setAttribute("data-oa-legacy-event", "true");
            break;
          }
          node = node.parentElement;
        }
      });
      makeContainer(eventSection, "event-list", "event-grid");
    }

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
    // Ensure every theme presents the formal opening/prayer copy, even when
    // its original markup did not include an opening.text binding.
    if (data.opening?.text && !document.querySelector('[data-bind="opening.text"]')) {
      const section = makeSection("oa-opening-copy", "Sambutan & Doa");
      const paragraph = document.createElement("p");
      paragraph.setAttribute("data-bind", "opening.text");
      section.append(paragraph);
      const cover = document.querySelector("#cover, .cover, [class$='-cover']");
      if (cover && cover.parentNode && cover !== section) {
        cover.insertAdjacentElement("afterend", section);
      }
    }

    if (quote.text || quote.arab || quote.source) {
      // Reuse a theme's existing blessing panel when present. Legacy themes may
      // contain static copy but omit JSON bindings; bind those existing nodes
      // instead of adding a second, visually duplicated prayer section.
      const section = document.querySelector(".quote-section, .quote, #quote-section") ||
        makeSection("quote-section", "Kutipan");
      if (quote.arab && !section.querySelector('[data-bind="quote.arab"]')) {
        const arab = document.createElement("p");
        arab.setAttribute("data-bind", "quote.arab");
        const ornament = section.querySelector(".ornament");
        if (ornament) ornament.insertAdjacentElement("afterend", arab);
        else section.prepend(arab);
      }
      if (quote.text && !section.querySelector('[data-bind="quote.text"]')) {
        const existingCopy = section.querySelector("p.serif, p:not(.eyebrow):not(.detail):not(.intro)");
        if (existingCopy) existingCopy.setAttribute("data-bind", "quote.text");
        else {
          const text = document.createElement("p");
          text.setAttribute("data-bind", "quote.text");
          section.append(text);
        }
      }
      if (quote.source && !section.querySelector('[data-bind="quote.source"]')) {
        const existingSource = section.querySelector("p.detail, small");
        if (existingSource) existingSource.setAttribute("data-bind", "quote.source");
        else {
          const source = document.createElement("small");
          source.setAttribute("data-bind", "quote.source");
          section.append(source);
        }
      }
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
    const mapFeatures = data.features && typeof data.features === "object" ? data.features : {};
    const mapsEnabled = mapFeatures.maps !== false;
    const navigationEnabled = mapsEnabled && mapFeatures.mapNavigation !== false;
    const embedEnabled = mapsEnabled && mapFeatures.mapEmbed !== false;
    const hasEventRenderer = Boolean(document.getElementById("event-list"));
    const hasLegacyMapSection = Boolean(document.querySelector("#link-akad-maps, #link-resepsi-maps, .maps-section, #maps-section"));
    if (mapsEnabled && !hasEventRenderer && hasLegacyMapSection) {
      eventItems.forEach((item, index) => {
        if (!item) return;
        const eventKey = String(item.id || (index === 0 ? "akad" : index === 1 ? "resepsi" : ""));
        const legacyLink = eventKey ? document.getElementById("link-" + eventKey + "-maps") : null;
        if (!legacyLink) return;
        const mapTarget = resolveEventMapTarget(item);
        const destination = mapTarget.query;
        const mapUrl = mapTarget.searchUrl || (typeof item.mapsUrl === "string" && /^https?:\/\//i.test(item.mapsUrl) ? item.mapsUrl : "");
        if (mapUrl) {
          legacyLink.classList.add("oa-event-location");
          legacyLink.href = mapUrl;
          legacyLink.target = "_blank";
          legacyLink.rel = "noopener noreferrer";
        }
        const card = legacyLink.parentElement;
        if (!card || !destination) return;
        if (item.mapNote && !card.querySelector(".oa-event-map-note")) {
          const note = document.createElement("p");
          note.className = "oa-event-map-note";
          note.textContent = item.mapNote;
          card.append(note);
        }
        if (navigationEnabled && !item.mapNote && !card.querySelector(".oa-event-navigation")) {
          const nav = document.createElement("a");
          nav.className = "oa-event-navigation";
          nav.href = mapTarget.directionsUrl;
          nav.target = "_blank"; nav.rel = "noopener noreferrer";
          nav.textContent = "Navigasi ke Lokasi ↗";
          card.append(nav);
        }
        if (embedEnabled && !item.mapNote && mapTarget.embedUrl && !card.querySelector("details.oa-event-map")) {
          const details = document.createElement("details");
          details.className = "oa-event-map";
          const summary = document.createElement("summary");
          summary.textContent = "Lihat peta";
          const frameWrap = document.createElement("div");
          frameWrap.className = "oa-event-map-frame";
          const frame = document.createElement("iframe");
          frame.title = "Peta lokasi " + (item.title || eventKey);
          frame.loading = "lazy";
          frame.referrerPolicy = "no-referrer-when-downgrade";
          frame.allowFullscreen = true;
          frame.src = mapTarget.embedUrl;
          frame.setAttribute("allow", "fullscreen");
          frameWrap.append(frame);
          details.append(summary, frameWrap);
          card.append(details);
        }
      });
    }
    if (mapsEnabled && !hasEventRenderer && !hasLegacyMapSection &&
        eventItems.some(item => item && (item.mapsUrl || item.venue || item.location || item.address))) {
      const section = makeSection("maps-section", "Lokasi & Navigasi Acara");
      eventItems.forEach((item, index) => {
        if (!item) return;
        const mapTarget = resolveEventMapTarget(item);
        const destination = mapTarget.query;
        const mapUrl = mapTarget.searchUrl || (typeof item.mapsUrl === "string" && /^https?:\/\//i.test(item.mapsUrl) ? item.mapsUrl : "");
        const heading = document.createElement("h3");
        heading.textContent = item.title || item.id || "Acara " + (index + 1);
        section.append(heading);
        if (mapUrl) {
          const link = document.createElement("a");
          link.className = "oa-event-location";
          link.href = mapUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
          link.textContent = "Lihat Lokasi ↗";
          section.append(link);
        }
        if (navigationEnabled && destination && !item.mapNote) {
          const nav = document.createElement("a");
          nav.className = "oa-event-navigation";
          nav.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(destination);
          nav.target = "_blank"; nav.rel = "noopener noreferrer";
          nav.textContent = "Navigasi ke Lokasi ↗";
          section.append(nav);
        }
        if (item.mapNote) {
          const note = document.createElement("p");
          note.className = "oa-event-map-note";
          note.textContent = item.mapNote;
          section.append(note);
        }
        if (embedEnabled && destination && mapTarget.embedUrl && !item.mapNote) {
          const details = document.createElement("details");
          details.className = "oa-event-map";
          const summary = document.createElement("summary");
          summary.textContent = "Lihat peta";
          const frameWrap = document.createElement("div");
          frameWrap.className = "oa-event-map-frame";
          const frame = document.createElement("iframe");
          frame.title = "Peta lokasi " + (item.title || item.id || "acara");
          frame.loading = "lazy";
          frame.referrerPolicy = "no-referrer-when-downgrade";
          frame.allowFullscreen = true;
          frame.src = mapTarget.embedUrl;
          frame.setAttribute("allow", "fullscreen");
          frameWrap.append(frame);
          details.append(summary, frameWrap);
          section.append(details);
        }
      });
    }
    if (!document.getElementById("oa-share-invitation")) {
      const section = makeSection("share-invitation-section", "Bagikan Undangan");
      const description = document.createElement("p");
      description.textContent = "Bagikan kabar bahagia ini kepada keluarga dan sahabat.";
      section.append(description);
      const button = document.createElement("button");
      button.type = "button";
      button.id = "oa-share-invitation";
      button.textContent = "Bagikan tautan undangan";
      button.setAttribute("aria-describedby", "oa-share-status");
      const status = document.createElement("p");
      status.id = "oa-share-status";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      section.append(button, status);
      button.addEventListener("click", async () => {
        const shareData = {
          title: document.title || "Undangan Pernikahan",
          text: "Anda diundang ke hari bahagia kami.",
          url: buildShortInvitationUrl()
        };
        button.disabled = true;
        status.textContent = "";
        try {
          if (navigator.share) {
            await navigator.share(shareData);
            status.textContent = "Menu berbagi dibuka.";
          } else if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareData.url);
            status.textContent = "Tautan undangan berhasil disalin.";
          } else {
            status.textContent = "Salin tautan dari bilah alamat browser untuk membagikan undangan.";
          }
        } catch (error) {
          if (error && error.name !== "AbortError") {
            status.textContent = "Tautan belum bisa dibagikan. Silakan salin alamat halaman ini.";
          }
        } finally {
          button.disabled = false;
        }
      });
    }

    if (data.closing && (data.closing.title || data.closing.text || data.closing.signature) &&
        data.features?.closing !== false &&
        !document.querySelector("[data-oa-closing], .oa-closing-section, .closing-section, #closing-section, .thank-you-section")) {
      const section = makeSection("oa-closing-section", data.closing.title || "Terima Kasih");
      section.dataset.oaClosing = "true";
      section.setAttribute("aria-label", "Penutup undangan");
      const message = document.createElement("p");
      message.className = "oa-closing-message";
      section.append(message);
      const signature = document.createElement("p");
      signature.className = "oa-closing-signature";
      section.append(signature);
    }

    if (eventItems.length && !document.querySelector(".calendar-section, #calendar-section")) {
      const section = makeSection("calendar-section", "Simpan Jadwal Acara");
      const calendarItems = eventItems.flatMap((item, eventIndex) => {
        if (!item || typeof item !== "object") return [];
        if (Array.isArray(item.schedule) && item.schedule.length) {
          return item.schedule.filter(entry => entry && typeof entry === "object").map((entry, index) => ({
            ...item, ...entry,
            id: entry.id || (item.id || "event") + "-" + (index + 1),
            title: entry.title || item.title || "Acara Pernikahan",
            dateISO: entry.dateISO || (/^\\d{4}-\\d{2}-\\d{2}$/.test(String(entry.date || "")) ? entry.date : (item.dateISO || (/^\\d{4}-\\d{2}-\\d{2}$/.test(String(item.date || "")) ? item.date : ""))),
            location: entry.location || item.location || item.venue,
            address: entry.address || item.address || "",
            mapsUrl: entry.mapsUrl || item.mapsUrl || "",
            coordinates: entry.coordinates || item.coordinates,
            timezone: entry.timezone || item.timezone
          }));
        }
        return [{ ...item, id: item.id || "event-" + (eventIndex + 1) }];
      });
      calendarItems.forEach((item, index) => {
        if (!item || !(item.dateISO || item.date)) return;
        if (item.startTime && item.dateISO) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "oa-calendar-action";
          button.textContent = "Simpan " + (item.title || "jadwal acara") + " ke Google Calendar";
          button.addEventListener("click", () => {
            const url = buildGoogleCalendarUrl(item, data);
            if (url) window.open(url, "_blank", "noopener,noreferrer");
          });
          section.append(button);
        } else {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = "Tambahkan " + (item.title || item.id || ("Acara " + (index + 1))) + " ke kalender";
          button.addEventListener("click", () => downloadCalendarEvent(item, data, slug));
          section.append(button);
        }
      });
    }
  }

  function buildGoogleCalendarUrl(event, data) {
    const date = String(event.dateISO || event.date || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
    const startTime = String(event.startTime || "09:00");
    let endTime = String(event.endTime || "");
    const hasEndTime = !!endTime;
    if (!endTime) {
      const [hour, minute] = startTime.split(":").map(Number);
      const totalMinutes = hour * 60 + (minute || 0) + 60;
      endTime = String(Math.floor(totalMinutes / 60) % 24).padStart(2, "0") + ":" +
        String(totalMinutes % 60).padStart(2, "0");
    }
    const stamp = (dateValue, timeValue) => dateValue.replace(/-/g, "") + "T" +
      timeValue.replace(":", "").padEnd(4, "0") + "00";
    const dates = stamp(date, startTime) + "/" + stamp(date, endTime);
    const location = [event.location || event.venue, event.address].filter(Boolean).join(", ");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: event.title || "Acara Pernikahan",
      dates,
      ctz: event.timezone || data.site?.timezone || "Asia/Makassar",
      location,
      details: "Undangan pernikahan Omah Aksara." + (!hasEndTime ? " Pengingat kalender dibuat 1 jam; durasi dapat disesuaikan di Google Calendar." : "")
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
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

  function renderStory(stories, clientBase) {
    const root = document.getElementById("story-list") || document.querySelector(".story-list");
    if (!root || !Array.isArray(stories)) return;
    const isSirein = !!document.querySelector(".sirein-page") || !!root.querySelector(".story-item");
    root.replaceChildren();

    stories.forEach((item, index) => {
      if (!item || typeof item !== "object") return;

      // Indonesian fields are canonical; English aliases preserve existing client data.
      const dateText = item.tanggal ?? item.year ?? item.date ?? "";
      const titleText = item.judul ?? item.title ?? "Cerita kami";
      const storyText = item.cerita ?? item.description ?? "";
      const photoPath = item.foto ?? item.photo ?? item.image ?? "";
      const article = document.createElement("article");
      article.className = isSirein ? "story-item" : "story-card reveal";
      article.style.animationDelay = (index * 100) + "ms";

      const date = document.createElement(isSirein ? "div" : "time");
      date.className = isSirein ? "story-year" : "story-date";
      date.textContent = String(dateText);

      const content = document.createElement("div");
      content.className = "story-content";
      const title = document.createElement("h3");
      title.textContent = String(titleText);
      const desc = document.createElement("p");
      desc.textContent = String(storyText);

      if (photoPath && String(photoPath).trim()) {
        const image = document.createElement("img");
        image.className = "oa-story-photo";
        image.src = assetUrl(String(photoPath), clientBase);
        image.alt = String(titleText || "Foto cerita perjalanan pasangan");
        image.loading = "lazy";
        image.decoding = "async";
        image.onerror = () => { image.hidden = true; };
        content.append(image);
      }

      content.append(title, desc);
      article.append(date, content);
      root.append(article);
    });
  }

  function resolveEventMapTarget(item) {
    const event = item && typeof item === "object" ? item : {};
    const rawCoordinates = event.coordinates && typeof event.coordinates === "object" ? event.coordinates : {};
    const lat = Number(rawCoordinates.lat ?? event.latitude ?? event.lat);
    const lng = Number(rawCoordinates.lng ?? rawCoordinates.lon ?? event.longitude ?? event.lng ?? event.lon);
    const hasCoordinates = Number.isFinite(lat) && Number.isFinite(lng) &&
      lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    const suppliedUrl = typeof event.mapsUrl === "string" && /^https?:\/\//i.test(event.mapsUrl.trim())
      ? event.mapsUrl.trim() : "";
    const suppliedEmbed = typeof event.mapEmbedUrl === "string" && /^https:\/\//i.test(event.mapEmbedUrl.trim())
      ? event.mapEmbedUrl.trim() : "";
    const query = String(event.mapQuery || [event.venue || event.location || event.title, event.address]
      .filter(Boolean).join(", ")).trim();

    // An explicit Maps share URL is the canonical destination. Never replace it
    // with a text search generated from the postal address. A separate embed URL
    // may be supplied when the owner has a verified Google Maps embed link.
    if (hasCoordinates) {
      const point = lat + "," + lng;
      return {
        query: point,
        embedUrl: suppliedEmbed || ("https://www.google.com/maps?q=" + encodeURIComponent(point) + "&t=k&z=17&output=embed"),
        searchUrl: suppliedUrl || ("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(point)),
        directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(point),
        verifiedPoint: true
      };
    }
    if (suppliedUrl) {
      // Keep the address query available for satellite preview and directions.
      // The original shared Maps URL remains the primary "open map" destination.
      const encoded = encodeURIComponent(query);
      return {
        query,
        embedUrl: suppliedEmbed || (query ? ("https://www.google.com/maps?q=" + encoded + "&t=k&z=17&output=embed") : ""),
        searchUrl: suppliedUrl,
        directionsUrl: query
          ? ("https://www.google.com/maps/dir/?api=1&destination=" + encoded)
          : suppliedUrl,
        verifiedPoint: false
      };
    }

    // Backward-compatible fallback for older invitation JSON without a Maps URL.
    const encoded = encodeURIComponent(query);
    return {
      query,
      embedUrl: suppliedEmbed || (query ? "https://www.google.com/maps?q=" + encoded + "&t=k&z=17&output=embed" : ""),
      searchUrl: query ? "https://www.google.com/maps/search/?api=1&query=" + encoded : "",
      directionsUrl: query ? "https://www.google.com/maps/dir/?api=1&destination=" + encoded : "",
      verifiedPoint: false
    };
  }

  function renderEvents(events, data, clientBase) {
    const root = document.getElementById("event-list");
    if (!root) return;
    const items = Array.isArray(events) ? events : Object.entries(events || {}).map(([id, item]) => ({ id, ...item }));
    const features = data && data.features && typeof data.features === "object" ? data.features : {};
    const mapsEnabled = features.maps !== false;
    const embedEnabled = mapsEnabled && features.mapEmbed !== false;
    const navigationEnabled = mapsEnabled && features.mapNavigation !== false;
    root.replaceChildren();
    items.forEach((item, index) => {
      const card = document.createElement("article"); card.className = "event-card reveal";
      const number = document.createElement("p"); number.className = "event-index"; number.textContent = "ACARA 0" + (index + 1);
      const title = document.createElement("h3"); title.textContent = item.title || item.id || "Acara";
      const date = document.createElement("p");
      date.className = "oa-event-date";
      date.textContent = item.schedule && item.schedule.length
        ? (item.date || "")
        : formatEventDate(item.date, item.timezone || data.site?.timezone) + (item.startTime ? " · " + item.startTime + (item.endTime ? "–" + item.endTime : "") : item.time ? " · " + item.time : "");
      const mapTarget = resolveEventMapTarget(item);
      const venueText = [item.venue || item.location, item.address].filter(Boolean).join(", ");
      const venue = document.createElement("p"); venue.className = "oa-event-address"; venue.textContent = venueText;
      card.append(number, title, date);
      if (Array.isArray(item.schedule) && item.schedule.length) {
        const scheduleRoot = document.createElement("div");
        scheduleRoot.className = "oa-event-schedule";
        item.schedule.forEach(entry => {
          if (!entry || typeof entry !== "object") return;
          const scheduleItem = document.createElement("div");
          scheduleItem.className = "oa-event-schedule-item";
          const scheduleTitle = document.createElement("h4");
          scheduleTitle.textContent = entry.title || "Rangkaian Acara";
          const scheduleDate = document.createElement("p");
          scheduleDate.textContent = entry.date || (entry.dateISO ? formatEventDate(entry.dateISO, item.timezone || data.site?.timezone) : "");
          const scheduleTime = document.createElement("p");
          scheduleTime.textContent = entry.time || [entry.startTime, entry.endTime].filter(Boolean).join("–");
          scheduleItem.append(scheduleTitle);
          if (scheduleDate.textContent) scheduleItem.append(scheduleDate);
          if (scheduleTime.textContent) scheduleItem.append(scheduleTime);
          scheduleRoot.append(scheduleItem);
        });
        if (scheduleRoot.children.length) card.append(scheduleRoot);
      }
      if (venueText) card.append(venue);
      if (mapsEnabled && mapTarget.query && !mapTarget.verifiedPoint && !item.mapNote) {
        const precision = document.createElement("p");
        precision.className = "oa-event-map-note";
        precision.textContent = "Peta satelit mengikuti hasil pencarian alamat. Untuk pin yang benar-benar presisi, lengkapi koordinat lokasi.";
        card.append(precision);
      }
      const suppliedUrl = typeof item.mapsUrl === "string" && /^https?:\/\//i.test(item.mapsUrl) ? item.mapsUrl : "";
      const mapUrl = mapTarget.verifiedPoint ? mapTarget.searchUrl : (suppliedUrl || mapTarget.searchUrl);
      if (mapsEnabled && mapUrl) {
        const link = document.createElement("a");
        link.className = "oa-event-location";
        link.href = mapUrl; link.target = "_blank"; link.rel = "noopener noreferrer";
        link.textContent = item.mapNote ? "Cari Lokasi di Maps ↗" : "Lihat Lokasi ↗";
        card.append(link);
      }
      if (navigationEnabled && mapTarget.query && !item.mapNote) {
        const nav = document.createElement("a");
        nav.className = "oa-event-navigation";
        nav.href = mapTarget.directionsUrl;
        nav.target = "_blank"; nav.rel = "noopener noreferrer";
        nav.textContent = "Navigasi ke Lokasi ↗";
        card.append(nav);
      }
      if (embedEnabled && mapUrl && !item.mapNote) {
        const details = document.createElement("details");
        details.className = "oa-event-map";
        const summary = document.createElement("summary"); summary.textContent = "Lihat peta lokasi";
        details.append(summary);
        if (mapTarget.embedUrl) {
          const frameWrap = document.createElement("div"); frameWrap.className = "oa-event-map-frame";
          const frame = document.createElement("iframe");
          frame.title = "Peta lokasi " + (item.title || item.id || "acara");
          frame.loading = "lazy"; frame.referrerPolicy = "no-referrer-when-downgrade";
          frame.allowFullscreen = true;
          frame.src = mapTarget.embedUrl;
          frame.setAttribute("allow", "fullscreen");
          frameWrap.append(frame);
          details.append(frameWrap);
        } else {
          const fallback = document.createElement("div");
          fallback.className = "oa-event-map-fallback";
          fallback.textContent = "Titik peta dibuka langsung melalui Google Maps agar lokasi tetap sesuai tautan yang diberikan.";
          const open = document.createElement("a");
          open.href = mapUrl; open.target = "_blank"; open.rel = "noopener noreferrer";
          open.textContent = "Buka titik lokasi di Google Maps ↗";
          fallback.append(open);
          details.append(fallback);
        }
        // Keep the map panel collapsed by default; never expand and enlarge the page on its own.
        card.append(details);
      } else if (mapsEnabled && item.mapNote) {
        const note = document.createElement("p");
        note.className = "oa-event-map-note";
        note.textContent = item.mapNote;
        card.append(note);
      }
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
    const root = document.getElementById("gallery-grid") || document.querySelector(".gallery-grid");
    if (!root) return;
    const items = Array.isArray(gallery) ? gallery : (gallery && Array.isArray(gallery.items) ? gallery.items : []);
    root.replaceChildren();
    items.forEach((item, index) => {
      const src = typeof item === "string" ? item : item.src;
      if (!src) return;
      const figure = document.createElement("figure"); figure.className = "gallery-item reveal";
      const img = document.createElement("img");
      img.src = assetUrl(src, clientBase);
      img.alt = typeof item === "string" ? "Foto galeri pernikahan " + (index + 1) : (item.alt || "Foto galeri pernikahan " + (index + 1));
      img.loading = "lazy";
      img.decoding = "async";
      img.tabIndex = 0;
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", "Perbesar foto " + (index + 1));
      figure.append(img); root.append(figure);
    });
  }

  function renderClosing(data) {
    const closing = data && data.closing && typeof data.closing === "object" ? data.closing : null;
    const section = document.querySelector("[data-oa-closing]");
    if (!section || !closing) return;
    const heading = section.querySelector("h2");
    const message = section.querySelector(".oa-closing-message");
    const signature = section.querySelector(".oa-closing-signature");
    if (heading) heading.textContent = closing.title || "Terima Kasih";
    if (message) message.textContent = closing.text || "";
    if (signature) {
      signature.textContent = closing.signature || "";
      signature.hidden = !closing.signature;
    }
    section.hidden = !(closing.title || closing.text || closing.signature);
  }

  function renderGifts(gifts, clientBase, features) {
    const allAccounts = Array.isArray(gifts) ? gifts : (gifts && Array.isArray(gifts.accounts) ? gifts.accounts : []);
    const flags = features && typeof features === "object" ? features : {};
    const giftsDisabled = !!(gifts && !Array.isArray(gifts) && gifts.enabled === false);
    const accounts = allAccounts.filter(item => {
      if (giftsDisabled || !item || item.enabled === false) return false;
      const type = String(item.paymentType || item.type || "bank").toLowerCase();
      if (type === "bank" && flags.bank === false) return false;
      if (type === "ewallet" && flags.ewallet === false) return false;
      if (type === "qris" && flags.qris === false) return false;
      return true;
    });
    let root = document.getElementById("gift-list");

    if (!root) {
      const section = document.querySelector(".gift-section");
      if (section) {
        root = document.createElement("div");
        root.id = "gift-list";
        root.className = "gift-grid";
        section.append(root);
      }
    }

    // V2 data is the source of truth. Hide legacy hard-coded cards so they
    // cannot show placeholder bank details or QR images beside the V2 cards.
    const staticCards = document.querySelectorAll(".gift-section .gift-card");
    staticCards.forEach(card => { card.hidden = true; });

    if (root) root.replaceChildren();
    if (!accounts.length || !root) {
      const section = root && root.closest("section");
      if (section) section.hidden = true;
      return;
    }

    if (gifts && !Array.isArray(gifts) && gifts.message) {
      const notice = document.createElement("p");
      notice.className = "gift-message";
      notice.textContent = gifts.message;
      notice.style.cssText = "grid-column:1/-1;margin:0 0 12px;line-height:1.6";
      root.append(notice);
    }

    accounts.forEach(item => {
      const card = document.createElement("article"); card.className = "gift-card reveal";
      const type = String(item.paymentType || item.type || "bank").toLowerCase();
      const provider = item.provider || item.bank || item.name || (type === "qris" ? "QRIS" : type === "ewallet" ? "Dompet Digital" : "HADIAH DIGITAL");
      const logoSrc = item.logo || item.bankLogo || "";
      if (logoSrc) {
        const logo = document.createElement("img");
        logo.src = assetUrl(logoSrc, clientBase);
        logo.alt = provider + " — logo";
        logo.loading = "lazy";
        logo.decoding = "async";
        logo.onerror = () => logo.remove();
        logo.style.cssText = "display:block;max-width:120px;max-height:48px;width:auto;height:auto;object-fit:contain;margin:0 auto 12px";
        card.append(logo);
      }
      const bank = document.createElement("p"); bank.className = "gift-bank"; bank.textContent = provider;
      const holder = document.createElement("h3"); holder.textContent = item.accountHolder || item.accountName || item.holder || (type === "qris" ? "Pembayaran melalui QR" : "Penerima");
      const destination = item.accountNumber || item.phoneNumber || item.destinationNumber || "";
      const number = document.createElement("p"); number.className = "gift-number"; number.textContent = destination;
      const isDemoOnly = item.demoOnly === true;
      const button = document.createElement("button"); button.type = "button";
      button.textContent = isDemoOnly ? "Simulasi — tidak untuk transaksi" : (item.copyLabel || (type === "qris" ? "Salin ID Demo" : type === "ewallet" ? "Salin Nomor Dompet Digital" : "Salin Nomor Rekening"));
      if (isDemoOnly) {
        button.disabled = true;
        button.setAttribute("aria-label", "Data simulasi, tidak dapat digunakan untuk transaksi");
      } else {
        button.disabled = item.copyable === false || !(item.copyValue || destination);
      if (!button.disabled) button.addEventListener("click", () => copyText(item.copyValue || destination || "", button));
      }
      card.append(bank, holder, number, button);
      if (item.demoNote || item.note) {
        const note = document.createElement("p");
        note.className = "gift-note";
        note.textContent = item.demoNote || item.note;
        card.append(note);
      }
      const qr = item.qrCode || item.qr;
      const qrSrc = typeof qr === "string" ? qr : qr?.src;
      if (qrSrc) {
        const img = document.createElement("img"); img.src = assetUrl(qrSrc, clientBase);
        img.alt = type === "qris" ? "Kode QR pembayaran" : "QR hadiah"; img.loading = "lazy"; img.style.cssText = "display:block;max-width:140px;width:100%;margin:18px auto 0";
        card.append(img);
      }
      root.append(card);
    });
  }

  function setupCover() {
    const cover = document.getElementById("cover-section") || document.getElementById("cover");
    const main = document.getElementById("main-content") || document.getElementById("app-inner");
    const open = document.getElementById("open-invitation-btn") || document.getElementById("open-btn");
    const musicToggle = document.getElementById("music-toggle") || document.getElementById("music-btn");
    const audio = document.getElementById("bg-music");
    const hasMusic = !!(audio && audio.getAttribute("src") && !(window.__invitationData?.features && window.__invitationData.features.music === false));

    if (open) {
      open.addEventListener("click", async () => {
        if (cover) cover.classList.add("is-opening");
        if (main) { main.hidden = false; main.style.display = "block"; }
        document.body.classList.add("oa-invitation-opened");
        document.documentElement.classList.add("oa-invitation-opened");
        document.dispatchEvent(new Event("oa:invitation-opened"));
        if (musicToggle && hasMusic) { musicToggle.hidden = false; musicToggle.style.display = "flex"; }
        const reducedMotionPreference = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.setTimeout(() => {
          if (cover) { cover.hidden = true; cover.style.display = "none"; }
        }, reducedMotionPreference ? 0 : 520);
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
      // Tema tanpa cover pembuka langsung mengaktifkan kontrol setelah konten siap.
      document.body.classList.add("oa-invitation-opened");
        document.documentElement.classList.add("oa-invitation-opened");
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

  function zonedDateTimeToUtc(dateValue, timeValue, zone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue)) || !/^\d{2}:\d{2}$/.test(String(timeValue))) {
      throw new Error("Tanggal atau jam acara tidak valid.");
    }
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
      timestamp += Date.UTC(year, month - 1, day, hour, minute, 0) - represented;
    }
    return new Date(timestamp);
  }

  function setupCountdown(data) {
    const eventSource = data.__renderEvents || data.events;
    const target = (Array.isArray(eventSource) ? eventSource : Object.values(eventSource || {})).find(e => e && (e.date || e.dateISO));
    let targetDate;
    if (data.countdown && data.countdown.targetDate) {
      targetDate = new Date(data.countdown.targetDate);
    } else if (target) {
      const date = target.dateISO || target.date;
      const time = target.startTime || "00:00";
      try {
        targetDate = /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? zonedDateTimeToUtc(date, time, target.timezone || "Asia/Makassar")
          : new Date(date + "T" + time + ":00");
      } catch { targetDate = null; }
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

  function setupForms(data, slug, viewOnly = false) {
    ensureApiForms();
    const configuredApiUrl = (data.integrations && data.integrations.apiUrl) || (data.api && (data.api.apiUcapan || data.api.apiUrl)) || "";
    const apiUrl = /^https:\/\//i.test(configuredApiUrl) ? configuredApiUrl : "";
    const rsvp = document.getElementById("rsvp-form");
    const wishes = document.getElementById("wishes-form");
    if (data.rsvp && data.rsvp.enabled === false) { const section=document.getElementById("rsvp-section"); if(section) section.hidden=true; }
    if (data.guestbook && data.guestbook.enabled === false) { const section=document.getElementById("guestbook-section"); if(section) section.hidden=true; }
    if (viewOnly) {
      // Portfolio links are read-only: preserve RSVP preview and guestbook entries,
      // but never allow a form submission from this viewing mode.
      if (rsvp) {
        rsvp.querySelectorAll("input, select, textarea, button").forEach(control => { control.disabled = true; });
        const note = document.createElement("p");
        note.className = "oa-portfolio-readonly-note";
        note.textContent = "Mode portofolio — formulir hanya untuk dilihat.";
        note.style.cssText = "margin:10px auto;text-align:center;font-size:12px;opacity:.75";
        rsvp.prepend(note);
      }
      if (wishes) wishes.hidden = true;
    }
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
      if (viewOnly) return;
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
      if (viewOnly) return;
      let status = document.getElementById("wishes-status");
      if (!status) { status = document.createElement("p"); status.id = "wishes-status"; status.setAttribute("role", "status"); wishes.append(status); }
      const button = wishes.querySelector("button[type=submit]");
      if (!apiUrl && data.demoMode !== true) { status.textContent = "Buku tamu belum aktif karena endpoint backend belum dikonfigurasi."; return; }
      const form = new FormData(wishes);
      const payload = { action:"guestbook", slug, name:String(form.get("name")||"").trim(), message:String(form.get("message")||"").trim() };
      if (!payload.name || !payload.message || payload.message.length > (data.guestbook?.maxMessageLength || 500)) { status.textContent="Mohon isi nama dan ucapan (maksimal 500 karakter)."; return; }
      // Demo harus terisolasi: jangan membaca atau menulis ucapan ke database klien.
      if (data.demoMode === true) {
        wishes.reset();
        appendDemoWish(payload.name, payload.message);
        status.textContent = "Simulasi demo: ucapan ini hanya tampil sementara dan tidak disimpan.";
        return;
      }
      const ok = await sendPayload(apiUrl,payload,status,button,"Ucapan berhasil dikirim.");
      if (ok) {
        wishes.reset();
        const root = document.getElementById("wishes-list");
        if (root) {
          const empty = root.querySelector(".empty-wishes");
          if (empty) empty.remove();
          root.prepend(makeWishCard(payload));
        }
        const refreshed = await loadWishes(apiUrl, slug, payload);
        if (!refreshed) status.textContent = "Ucapan tersimpan dan ditampilkan, tetapi daftar dari server belum bisa disegarkan.";
        else status.textContent = "Ucapan berhasil dikirim.";
      }
    });
    if (data.demoMode === true && wishes) renderDemoWishes(data.demoGreetings || []);
    else if (apiUrl && data.guestbook?.enabled !== false) loadWishes(apiUrl,slug);
  }

  async function sendPayload(apiUrl,payload,status,button,successText) {
    if (button) button.disabled=true;
    status.textContent="Mengirim...";
    try {
      const response = await fetch(apiUrl,{
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify(payload),
        redirect:"follow"
      });
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error("Respons Apps Script bukan JSON (HTTP " + response.status + ").");
      }
      if (!response.ok) throw new Error("Server merespons HTTP " + response.status + ".");
      if (!result || result.ok !== true) {
        status.textContent = result && result.message
          ? result.message
          : "Server belum menyimpan data. Silakan coba lagi.";
        return false;
      }
      status.textContent=successText;
      return true;
    } catch (error) {
      console.error("API Omah Aksara:",error);
      const detail = error instanceof TypeError
        ? "Browser tidak dapat membaca respons Apps Script. Periksa koneksi dan izin deployment."
        : (error && error.message ? error.message : "Koneksi ke server gagal.");
      status.textContent="Gagal mengirim: " + detail;
      return false;
    } finally {
      if (button) button.disabled=false;
    }
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

  async function loadWishes(apiUrl, slug, pendingItem) {
    const root = document.getElementById("wishes-list");
    if (!root) return false;
    try {
      const url = new URL(apiUrl);
      url.searchParams.set("action", "guestbook");
      url.searchParams.set("slug", slug);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Gagal membaca buku tamu");
      const result = await response.json();
      if (!result.ok || !Array.isArray(result.items)) throw new Error("Format daftar ucapan tidak valid");

      const items = result.items.slice();
      if (pendingItem && !items.some(item =>
        String(item.name || "").trim() === String(pendingItem.name || "").trim() &&
        String(item.message || "").trim() === String(pendingItem.message || "").trim()
      )) items.unshift(pendingItem);

      root.replaceChildren();
      if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "empty-wishes";
        empty.textContent = "Jadilah yang pertama mengirim doa.";
        root.append(empty);
        return true;
      }
      items.forEach(item => root.append(makeWishCard(item)));
      return true;
    } catch (error) {
      console.warn("Buku tamu belum dapat dimuat:", error);
      return false;
    }
  }

  function bindMapLinks(data) {
    // The shared event renderer owns map links whenever it is mounted. This
    // avoids duplicate legacy links/cards on themes upgraded from hard-coded markup.
    if (document.getElementById("event-list")) return;
    const rawEvents = data && data.events ? data.events : {};
    const entries = Array.isArray(rawEvents)
      ? rawEvents.map((item, index) => [item && item.id ? item.id : (index === 0 ? "akad" : index === 1 ? "resepsi" : String(index)), item])
      : Object.entries(rawEvents);
    const features = data && data.features && typeof data.features === "object" ? data.features : {};
    const mapsEnabled = features.maps !== false;
    const navigationEnabled = mapsEnabled && features.mapNavigation !== false;
    const embedEnabled = mapsEnabled && features.mapEmbed !== false;
    entries.forEach(([rawKey, item], index) => {
      if (!item || typeof item !== "object") return;
      const key = String(item.id || rawKey || (index === 0 ? "akad" : index === 1 ? "resepsi" : ""));
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      const anchor = document.getElementById("link-" + normalizedKey + "-maps") ||
        (index === 0 ? document.getElementById("link-akad-maps") : index === 1 ? document.getElementById("link-resepsi-maps") : null);
      if (!anchor) return;
      const mapTarget = resolveEventMapTarget(item);
      const suppliedUrl = typeof item.mapsUrl === "string" && /^https?:\/\//i.test(item.mapsUrl) ? item.mapsUrl : "";
      const mapUrl = mapTarget.verifiedPoint ? mapTarget.searchUrl : (suppliedUrl || mapTarget.searchUrl);
      if (!mapsEnabled || !mapUrl) { anchor.hidden = true; return; }
      anchor.hidden = false;
      anchor.classList.add("oa-event-location");
      anchor.href = mapUrl;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      if (item.mapNote) anchor.textContent = "Cari Lokasi di Maps ↗";
      const host = anchor.parentElement;
      if (!host) return;
      if (navigationEnabled && mapTarget.query && !item.mapNote && !host.querySelector(".oa-event-navigation")) {
        const nav = document.createElement("a");
        nav.className = "oa-event-navigation";
        nav.href = mapTarget.directionsUrl;
        nav.target = "_blank"; nav.rel = "noopener noreferrer";
        nav.textContent = "Navigasi ke Lokasi ↗";
        anchor.insertAdjacentElement("afterend", nav);
      }
      if (embedEnabled && mapUrl && !item.mapNote && !host.querySelector("details.oa-event-map")) {
        const details = document.createElement("details");
        details.className = "oa-event-map";
        const summary = document.createElement("summary");
        summary.textContent = "Lihat peta lokasi";
        details.append(summary);
        if (mapTarget.embedUrl) {
          const frameWrap = document.createElement("div");
          frameWrap.className = "oa-event-map-frame";
          const frame = document.createElement("iframe");
          frame.title = "Peta lokasi " + (item.title || key);
          frame.loading = "lazy";
          frame.referrerPolicy = "no-referrer-when-downgrade";
          frame.allowFullscreen = true;
          frame.src = mapTarget.embedUrl;
          frame.setAttribute("allow", "fullscreen");
          frameWrap.append(frame);
          details.append(frameWrap);
        } else {
          const fallback = document.createElement("div");
          fallback.className = "oa-event-map-fallback";
          fallback.textContent = "Titik peta dibuka langsung melalui Google Maps agar lokasi tetap sesuai tautan yang diberikan.";
          const open = document.createElement("a");
          open.href = mapUrl; open.target = "_blank"; open.rel = "noopener noreferrer";
          open.textContent = "Buka titik lokasi di Google Maps ↗";
          fallback.append(open);
          details.append(fallback);
        }
        host.append(details);
      } else if (mapsEnabled && item.mapNote && !host.querySelector(".oa-event-map-note")) {
        const note = document.createElement("p");
        note.className = "oa-event-map-note";
        note.textContent = item.mapNote;
        host.append(note);
      }
    });
  }

  // Shared navigation controls are mounted by the engine, so every active theme
  // receives the same working controls without duplicating theme-specific markup.
  function ensureFloatingControls(data, buildShortInvitationUrl) {
    if (document.getElementById("oa-floating-controls")) return;
    const features = data && data.features && typeof data.features === "object" ? data.features : {};
    const theme = document.documentElement.dataset.oaTheme || data.theme || "karsa";
    const getShareUrl = typeof buildShortInvitationUrl === "function" ? buildShortInvitationUrl : () => location.href;
    const makeButton = (action, label, ariaLabel, feature) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.oaAction = action;
      if (feature) button.dataset.oaFeature = feature;
      button.textContent = label;
      button.setAttribute("aria-label", ariaLabel);
      return button;
    };
    const isVisible = element => {
      if (!element || element.hidden) return false;
      const style = getComputedStyle(element);
      // A few themes (notably Aksara Velora) hide the main wrapper with
      // display:none until the cover is opened instead of using [hidden].
      // Keep that wrapper as the Home destination without treating unrelated
      // display:none controls or sections as navigable targets.
      const mainWrapperSelector = "#main-content, #app-inner, .invitation-container, .invite-shell, .sirein-page";
      const isMainWrapper = element.matches(mainWrapperSelector);
      if (style.display === "none" && !isMainWrapper) return false;
      if (style.visibility === "hidden" && !isMainWrapper) return false;
      const hiddenParent = element.closest("[hidden]");
      if (hiddenParent && !hiddenParent.matches(mainWrapperSelector)) return false;
      const rect = element.getBoundingClientRect();
      const waitingBehindCover = !!element.closest(mainWrapperSelector);
      return rect.height > 0 || (waitingBehindCover && (element.children.length > 0 || !!element.textContent.trim()));
    };
    const getScrollBehavior = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const scrollToSection = section => {
      if (!section || !isVisible(section)) return;
      // Home is the top of the invitation, not the top edge of a long wrapper
      // whose position can vary across legacy themes and cover layouts.
      const isHomeTarget = section.matches(
        "#main-content, #app-inner, .invitation-container, .sirein-page, .invite-shell, #app"
      );
      if (isHomeTarget) {
        window.scrollTo({ top: 0, behavior: getScrollBehavior() });
        return;
      }
      window.scrollTo({
        top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - 12),
        behavior: getScrollBehavior()
      });
    };

    // One navigation contract for every theme. Selectors cover the legacy template
    // structures while the theme itself continues to own its visual design.
    const sectionOptions = [
      { id:"home", label:"Home", selectors:["#main-content","#app-inner",".invitation-container",".sirein-page",".invite-shell","#app"], feature:null },
      { id:"couple", label:"Mempelai", selectors:["#couple-section",".couple-section","#couple",".couple","#bride-groom",".bride-groom-section","[data-section='couple']"], feature:"couple" },
      { id:"event", label:"Acara", selectors:["#events","#events-section","#event-section",".event-section",".events","#event-list","section:has(#link-akad-maps)"], feature:"events" },
      { id:"gallery", label:"Galeri", selectors:["#gallery","#gallery-section",".gallery-section","#gallery-grid",".gallery-grid"], feature:"gallery" },
      { id:"story", label:"Cerita", selectors:["#story","#story-section",".story-section","#story-list",".story-list"], feature:"loveStory" },
      { id:"countdown", label:"Countdown", selectors:["#countdown",".countdown-section",".countdown"], feature:"countdown" },
      { id:"video", label:"Video", selectors:["#video-section","#wedding-video",".video-section"], feature:"video" },
      { id:"rsvp", label:"RSVP", selectors:["#rsvp-section",".rsvp-section","#rsvp-form"], feature:"rsvp" },
      { id:"wishes", label:"Ucapan", selectors:["#guestbook-section",".guestbook-section","#wishes-form"], feature:"guestbook" },
      { id:"gift", label:"Hadiah", selectors:["#gift-section",".gift-section","#gift-list"], feature:"gifts" },
      { id:"quote", label:"Kutipan", selectors:["#quote-section",".quote-section",".quote"], feature:"quotes" }
    ];
    const resolveSections = () => {
      const found = [];
      const used = new Set();
      sectionOptions.forEach(option => {
        if (option.feature && features[option.feature] === false) return;
        let target = option.selectors.map(selector => {
          try { return document.querySelector(selector); } catch { return null; }
        }).find(candidate => candidate && isVisible(candidate) && !used.has(candidate));
        // Some legacy themes keep the story list collapsed until their own
        // animation runs. If the client enabled and supplied stories, expose
        // the existing story section instead of silently omitting navigation.
        if (!target && option.id === "story" && Array.isArray(data.story) && data.story.length) {
          const storyRoot = document.querySelector(".story-list, #story-list");
          const storySection = storyRoot?.closest("section, .story-section, #story-section, #story, .panel, article") ||
            document.querySelector(".story-section, #story-section, #story");
          const candidate = storySection || storyRoot;
          if (candidate && !used.has(candidate)) {
            // Legacy themes sometimes render the story cards inside a non-section wrapper
            // or leave the wrapper collapsed. Prefer the real section, then the visible list.
            candidate.hidden = false;
            candidate.removeAttribute("hidden");
            candidate.style.removeProperty("display");
            if (getComputedStyle(candidate).display === "none") candidate.style.display = "block";
            if (isVisible(candidate)) target = candidate;
          }
        }
        if (!target && option.id === "couple") {
          const photo = document.querySelector('[data-bind="couple.groom.photo"], [data-bind="couple.bride.photo"]');
          target = photo && photo.closest("section");
        }
        if (!target) return;
        used.add(target);
        if (!target.id) target.id = "oa-section-" + option.id;
        found.push({ ...option, target });
      });
      return found;
    };

    // Retire theme-specific navigation so every theme uses the shared Omah Aksara dock.
    // Theme styling remains intact; only duplicate navigation controls are hidden.
    const legacyNavs = new Set(document.querySelectorAll(
      "nav:not(#oa-floating-controls), [role='navigation']:not(#oa-floating-controls), " +
      ".nocturne-nav, .celestial-nav, [data-oa-native-navigation], " +
      "[class*='bottom-nav'], [id*='bottom-nav'], [class*='bottom-navigation'], [id*='bottom-navigation'], " +
      "[class*='navigation-dock'], [id*='navigation-dock'], [class*='nav-dock'], [id*='nav-dock'], " +
      "[class*='bottom-menu'], [id*='bottom-menu'], [class*='floating-nav'], [id*='floating-nav']"
    ));
    // Some older themes use fixed button groups instead of a <nav>. Retire only
    // floating/sticky controls with navigation-like names, never ordinary content.
    document.querySelectorAll("#app [class], #app [id]").forEach(element => {
      if (element.id === "oa-floating-controls") return;
      const identity = ((element.id || "") + " " + (typeof element.className === "string" ? element.className : "")).toLowerCase();
      if (!/(nav|dock|bottom|float|control)/.test(identity)) return;
      const position = getComputedStyle(element).position;
      if ((position === "fixed" || position === "sticky") && element.querySelector("button, a, [role='button']")) legacyNavs.add(element);
    });
    legacyNavs.forEach(nav => {
      if (nav.id === "oa-floating-controls") return;
      nav.classList.add("oa-legacy-navigation");
      nav.setAttribute("aria-hidden", "true");
      nav.setAttribute("inert", "");
      // Hide the native dock itself, not only its clickability. Some themes place
      // their navigation outside #app or use a role= navigation wrapper.
      nav.style.setProperty("display", "none", "important");
      nav.style.setProperty("visibility", "hidden", "important");
      nav.style.setProperty("pointer-events", "none", "important");
    });
    const audio = document.getElementById("bg-music");
    const legacyMusic = [...document.querySelectorAll("#music-toggle, #music-btn, .music-toggle, .music-float-btn, .royal-music-toggle, .music-disk-box, [class*='music-float'], [id*='music-float']")].filter(control => control.id !== "bg-music");
    // Replace every theme-native music button with the shared music control.
    // If a theme nests its audio element inside the visual button, preserve the audio.
    legacyMusic.forEach(control => {
      if (audio && control.contains(audio)) document.body.append(audio);
      control.classList.add("oa-legacy-music-control");
      control.setAttribute("aria-hidden", "true");
      control.setAttribute("inert", "");
      control.style.setProperty("display", "none", "important");
      control.style.setProperty("visibility", "hidden", "important");
      control.style.setProperty("pointer-events", "none", "important");
    });
    const configuredMusic = data && data.media && data.media.music;
    const configuredMusicSrc = typeof configuredMusic === "string" ? configuredMusic : configuredMusic && configuredMusic.src;
    const hasMusic = !!((audio && (audio.getAttribute("src") || audio.src) || configuredMusicSrc) && features.music !== false);

    // Keep playback and auto-scroll directly in the shared dock for one obvious control location.
    const autoButton = makeButton("auto", "↧", "Mulai gulir otomatis");
    autoButton.className = "oa-dock-action oa-auto-scroll";

    let musicButton = null;
    if (hasMusic) {
      musicButton = makeButton("music", "♫", "Putar musik");
      musicButton.className = "oa-dock-action oa-music-control";
    }

    const isInvitationField = element => element && element.matches &&
      element.matches("input, textarea, select, [contenteditable='true']") &&
      !!element.closest("#rsvp-section, .rsvp-section, #guestbook-section, .guestbook-section, #rsvp-form, #wishes-form, form");
    document.addEventListener("focusin", event => {
      if (isInvitationField(event.target)) document.body.classList.add("oa-form-focus");
    });
    document.addEventListener("focusout", event => {
      if (!isInvitationField(event.target)) return;
      window.requestAnimationFrame(() => {
        if (!isInvitationField(document.activeElement)) document.body.classList.remove("oa-form-focus");
      });
    });

    let menu = [];
    if (features.navigation !== false) {
      menu = resolveSections();
      const nav = document.createElement("nav");
      nav.id = "oa-floating-controls";
      nav.className = "oa-floating-controls";
      nav.dataset.theme = theme;
      nav.setAttribute("aria-label", "Navigasi utama undangan");
      nav.setAttribute("role", "navigation");
      const primaryIds = ["home","couple","event","gallery"];
      primaryIds.forEach(id => {
        const item = menu.find(entry => entry.id === id);
        if (!item) return;
        const button = makeButton("jump", item.label, "Buka bagian " + item.label, item.feature);
        button.dataset.target = item.target.id;
        button.dataset.oaSection = item.id;
        button.addEventListener("click", () => scrollToSection(item.target));
        nav.append(button);
        item.button = button;
      });

      // Compact media controls stay visible in the dock, never buried in "Lainnya".
      nav.append(autoButton);
      if (musicButton) nav.append(musicButton);

      const overflowItems = menu.filter(item => !primaryIds.includes(item.id));
      {
        const moreWrap = document.createElement("div");
        moreWrap.className = "oa-nav-more-wrap";
        const moreButton = makeButton("more", "Lainnya", "Buka bagian lainnya");
        moreButton.className = "oa-nav-more";
        moreButton.setAttribute("aria-expanded", "false");
        const panel = document.createElement("div");
        panel.className = "oa-nav-overflow";
        panel.hidden = true;
        overflowItems.forEach(item => {
          const button = makeButton("jump", item.label, "Buka bagian " + item.label, item.feature);
          button.dataset.target = item.target.id;
          button.dataset.oaSection = item.id;
          button.addEventListener("click", () => {
            scrollToSection(item.target);
            panel.hidden = true;
            moreButton.setAttribute("aria-expanded", "false");
          });
          panel.append(button);
          item.button = button;
        });
        const topButton = makeButton("top", "Ke atas", "Kembali ke bagian atas");
        topButton.addEventListener("click", () => {
          window.scrollTo({ top: 0, behavior: getScrollBehavior() });
          panel.hidden = true;
          moreButton.setAttribute("aria-expanded", "false");
        });
        const nextButton = makeButton("next", "Bagian berikutnya", "Lanjut ke bagian berikutnya");
        nextButton.addEventListener("click", () => {
          const marker = window.scrollY + Math.min(window.innerHeight * .34, 260);
          const next = menu.find(item => item.target.getBoundingClientRect().top + window.scrollY > marker + 8);
          if (next) scrollToSection(next.target);
          panel.hidden = true;
          moreButton.setAttribute("aria-expanded", "false");
        });
        const shareButton = makeButton("share", "Bagikan", "Bagikan undangan");
        shareButton.addEventListener("click", async () => {
          const shareData = { title: document.title || "Undangan", text: "Dengan bahagia kami mengundang Anda.", url: getShareUrl() };
          try {
            if (navigator.share) await navigator.share(shareData);
            else if (navigator.clipboard?.writeText) {
              await navigator.clipboard.writeText(shareData.url);
              shareButton.textContent = "Tautan disalin";
            } else shareButton.title = "Salin tautan dari bilah alamat browser.";
          } catch (error) {
            if (error && error.name !== "AbortError") shareButton.title = "Tautan belum dapat dibagikan.";
          }
          panel.hidden = true;
          moreButton.setAttribute("aria-expanded", "false");
        });
        panel.append(topButton, nextButton, shareButton);
        moreButton.addEventListener("click", () => {
          panel.hidden = !panel.hidden;
          moreButton.setAttribute("aria-expanded", String(!panel.hidden));
        });
        moreWrap.append(moreButton, panel);
        nav.append(moreWrap);
        document.addEventListener("click", event => {
          if (!moreWrap.contains(event.target) && !panel.hidden) {
            panel.hidden = true;
            moreButton.setAttribute("aria-expanded", "false");
          }
        });
      }
      // Keep the shared dock in the root stacking context, above every theme canvas.
      document.documentElement.append(nav);

      const updateActive = () => {
        const marker = window.scrollY + Math.min(window.innerHeight * .34, 260);
        let active = null;
        menu.forEach(item => {
          if (item.target.getBoundingClientRect().top + window.scrollY <= marker) active = item;
        });
        menu.forEach(item => {
          if (!item.button) return;
          const selected = item === active;
          item.button.classList.toggle("is-active", selected);
          item.button.setAttribute("aria-current", selected ? "location" : "false");
        });
      };
      let ticking = false;
      window.addEventListener("scroll", () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => { updateActive(); ticking = false; });
      }, { passive: true });
      updateActive();
    }

    let autoTimer = null;
    let autoStartDelay = null;
    const stopAutoScroll = () => {
      if (autoTimer !== null) window.clearInterval(autoTimer);
      if (autoStartDelay !== null) window.clearTimeout(autoStartDelay);
      autoTimer = null;
      autoStartDelay = null;
      autoButton.textContent = "↧";
      autoButton.setAttribute("aria-pressed", "false");
      autoButton.setAttribute("aria-label", "Mulai gulir otomatis");
      autoButton.classList.remove("is-running");
    };
    const startAutoScroll = () => {
      if (autoTimer !== null || autoButton.hidden || autoButton.disabled) return;
      autoButton.textContent = "Ⅱ";
      autoButton.classList.add("is-running");
      autoButton.setAttribute("aria-pressed", "true");
      autoButton.setAttribute("aria-label", "Jeda gulir otomatis");
      autoTimer = window.setInterval(() => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 3) {
          stopAutoScroll(); return;
        }
        window.scrollBy(0, 1);
      }, 24);
    };
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      autoButton.disabled = true;
      autoButton.title = "Gulir otomatis tidak aktif karena preferensi gerakan minim.";
    } else {
      // Mulai setelah sampul dibuka; jeda singkat memberi waktu menikmati transisi pembuka.
      const scheduleAutoScroll = () => {
        if (autoStartDelay !== null || autoTimer !== null) return;
        autoStartDelay = window.setTimeout(() => {
          autoStartDelay = null;
          startAutoScroll();
        }, 1800);
      };
      document.addEventListener("oa:invitation-opened", scheduleAutoScroll, { once: true });
      if (document.body.classList.contains("oa-invitation-opened")) scheduleAutoScroll();
      window.addEventListener("wheel", stopAutoScroll, { passive: true });
      window.addEventListener("touchstart", event => {
        if (!event.target.closest("#oa-floating-controls")) stopAutoScroll();
      }, { passive: true });
      window.addEventListener("pointerdown", event => {
        if (!event.target.closest("#oa-floating-controls")) stopAutoScroll();
      }, { passive: true });
      window.addEventListener("keydown", event => {
        if (["ArrowDown","ArrowUp","PageDown","PageUp","Home","End"," "].includes(event.key)) stopAutoScroll();
      });
      autoButton.addEventListener("click", () => {
        if (autoTimer !== null || autoStartDelay !== null) { stopAutoScroll(); return; }
        startAutoScroll();
      });
      document.addEventListener("visibilitychange", () => { if (document.hidden) stopAutoScroll(); });
    }
    if (musicButton) {
      const syncMusic = () => {
        const playing = !audio.paused;
        musicButton.textContent = playing ? "Ⅱ" : "♫";
        musicButton.classList.toggle("is-playing", playing);
        musicButton.setAttribute("aria-pressed", String(playing));
        musicButton.setAttribute("aria-label", playing ? "Jeda musik" : "Putar musik");
      };
      musicButton.addEventListener("click", async () => {
        if (audio.paused) {
          try { await audio.play(); }
          catch { musicButton.title = "Musik belum dapat diputar. Coba lagi."; }
        } else audio.pause();
        syncMusic();
      });
      audio.addEventListener("play", syncMusic);
      audio.addEventListener("pause", syncMusic);
      syncMusic();
    }
    if (features.autoScroll === false) autoButton.hidden = true;
    if (features.navigation === false) {
      const nav = document.getElementById("oa-floating-controls");
      if (nav) nav.hidden = true;
    }
  }

  function setupReveal() {
    const styleId = "oa-scroll-experience-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        html { scroll-behavior: smooth; overflow-x: clip; }
        body { overflow-x: clip; }
        section[id], [id].oa-shared-section { scroll-margin-top: 1rem; }
        .oa-scroll-reveal { opacity: 0; transform: translateY(22px); transition: opacity .38s ease, transform .42s cubic-bezier(.2,.72,.18,1); }
        .oa-scroll-reveal.oa-visible { opacity: 1; transform: translateY(0); }
        .oa-motion-item { opacity: 0; transform: translate3d(0,14px,0); transition: opacity .4s ease, transform .46s cubic-bezier(.2,.72,.18,1); transition-delay: var(--oa-motion-delay, 0ms); }
        .oa-motion-item[data-oa-motion="left"] { transform: translate3d(-16px,0,0); }
        .oa-motion-item[data-oa-motion="right"] { transform: translate3d(16px,0,0); }
        .oa-motion-item[data-oa-motion="up"] { transform: translate3d(0,16px,0); }
        .oa-motion-item.oa-motion-visible { opacity: 1; transform: translate3d(0,0,0); }
        img.oa-motion-photo, .oa-motion-photo img { opacity: 0; transform: scale(.985); transition: opacity .42s ease, transform .48s cubic-bezier(.2,.72,.18,1); }
        img.oa-motion-photo[data-oa-motion="left"], .oa-motion-photo[data-oa-motion="left"] img { transform: translate3d(-16px,0,0) scale(.99); }
        img.oa-motion-photo[data-oa-motion="right"], .oa-motion-photo[data-oa-motion="right"] img { transform: translate3d(16px,0,0) scale(.99); }
        img.oa-motion-photo.oa-motion-visible, .oa-motion-photo.oa-motion-visible img { opacity: 1; transform: translate3d(0,0,0) scale(1); filter:none; }
        .oa-story-photo { display:block; width:min(100%, 340px); max-height:420px; aspect-ratio:4/3; object-fit:cover; margin:0 0 16px; border-radius:12px; border:1px solid rgba(160,140,110,.28); }
        .story-content { min-width:0; }
        .story-date { display:block; margin-bottom:6px; }
        #cover.is-opening, #cover-section.is-opening, .sirein-cover.is-opening {
          animation: oa-cover-exit .48s cubic-bezier(.22,.7,.2,1) forwards;
          transform-origin: center top;
        }
        @keyframes oa-cover-exit {
          0% { opacity:1; transform:scale(1); }
          55% { opacity:.92; transform:scale(1.008); }
          100% { opacity:0; transform:scale(1.015); }
        }
        .oa-floating-controls { scrollbar-width:none; }
        .oa-floating-controls::-webkit-scrollbar { display:none; }
        .oa-floating-controls button { flex:0 0 auto; }
        @media (max-width:600px) { .oa-floating-controls { overflow-x:auto; justify-content:flex-start; max-width:calc(100vw - 18px); } }
        @media (max-width:600px) { .oa-story-photo { max-height:320px; } }
        @media (prefers-reduced-motion: reduce) {
          #cover.is-opening, #cover-section.is-opening, .sirein-cover.is-opening { animation:none !important; opacity:0; }
          html { scroll-behavior: auto !important; }
          .oa-scroll-reveal, .oa-motion-item, img.oa-motion-photo, .oa-motion-photo img { opacity:1 !important; transform:none !important; filter:none !important; transition:none !important; }
          html[data-oa-theme] #app,
          html[data-oa-theme] #app *,
          html[data-oa-theme] #app *::before,
          html[data-oa-theme] #app *::after {
            animation-duration:.01ms!important;
            animation-iteration-count:1!important;
            transition-duration:.01ms!important;
            scroll-behavior:auto!important;
          }
        }
      `;
      document.head.append(style);
    }

    // Enforce reduced motion at runtime as well as in CSS. Some legacy theme rules
    // use stronger transition shorthands, so preserve and temporarily override inline
    // motion properties, then restore them if the preference changes back.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const originalMotionStyles = window.__oaOriginalMotionStyles ||
      (window.__oaOriginalMotionStyles = new WeakMap());
    const motionProperties = ["transition-duration", "animation-duration", "animation-iteration-count", "scroll-behavior"];
    const applyMotionPreference = () => {
      const targets = [document.documentElement, ...document.querySelectorAll("#app, #app *")];
      targets.forEach(element => {
        if (motionQuery.matches) {
          if (!originalMotionStyles.has(element)) {
            originalMotionStyles.set(element, motionProperties.map(property => ({
              property,
              value: element.style.getPropertyValue(property),
              priority: element.style.getPropertyPriority(property)
            })));
          }
          element.style.setProperty("transition-duration", ".01ms", "important");
          element.style.setProperty("animation-duration", ".01ms", "important");
          element.style.setProperty("animation-iteration-count", "1", "important");
          if (element === document.documentElement) {
            element.style.setProperty("scroll-behavior", "auto", "important");
          }
        } else if (originalMotionStyles.has(element)) {
          originalMotionStyles.get(element).forEach(({ property, value, priority }) => {
            if (value) element.style.setProperty(property, value, priority);
            else element.style.removeProperty(property);
          });
          originalMotionStyles.delete(element);
        }
      });
    };
    applyMotionPreference();
    if (!window.__oaReducedMotionListener) {
      const onMotionPreferenceChange = () => applyMotionPreference();
      if (motionQuery.addEventListener) motionQuery.addEventListener("change", onMotionPreferenceChange);
      else if (motionQuery.addListener) motionQuery.addListener(onMotionPreferenceChange);
      window.__oaReducedMotionListener = onMotionPreferenceChange;
    }

    const candidates = document.querySelectorAll(
      "#app-inner > section:not(#cover), .invitation-container > section, .sirein-page > section, .invite-shell > section, " +
      ".oa-shared-section, #rsvp-section, #guestbook-section, .event-card, .profile-card, .person-card, .story-item, .gift-card, .gallery-item"
    );
    candidates.forEach(element => {
      if (element.closest("#cover, #cover-section, .sirein-cover")) return;
      if (!element.classList.contains("reveal")) element.classList.add("oa-scroll-reveal");
    });

    // Arah gerak dibedakan: foto hadir dengan zoom lembut, teks/kartu naik perlahan.
    // Hindari elemen kecil, ikon, foto di dalam tombol, dan elemen yang sudah menjadi satu animasi kartu.
    const motionTargets = new Set();
    document.querySelectorAll(
      "#app h1, #app h2, #app h3, #app p, #app blockquote, #app .story-content, #app .event-card, #app .profile-card, #app .person-card, #app .gift-card, #app .gallery-item"
    ).forEach(element => {
      if (element.closest("#cover, #cover-section, .sirein-cover, #oa-floating-controls, button, a")) return;
      if (element.matches("p") && element.closest(".story-content, .event-card, .profile-card, .person-card, .gift-card, .gallery-item")) return;
      motionTargets.add(element);
    });
    document.querySelectorAll("#app img").forEach(image => {
      if (image.closest("#cover, #cover-section, .sirein-cover, #oa-floating-controls, button, a")) return;
      image.classList.add("oa-motion-photo");
    });
    let motionIndex = 0;
    motionTargets.forEach(element => {
      const direction = element.matches("blockquote") ? "right" :
        element.matches("h1, h2, h3") ? (motionIndex % 2 ? "right" : "left") : "up";
      element.classList.add("oa-motion-item");
      element.dataset.oaMotion = direction;
      element.style.setProperty("--oa-motion-delay", (motionIndex++ % 4) * 35 + "ms");
    });
    let photoIndex = 0;
    document.querySelectorAll("#app img.oa-motion-photo").forEach(image => {
      image.dataset.oaMotion = photoIndex++ % 2 ? "right" : "left";
    });

    const elements = document.querySelectorAll(".reveal:not(.active), .oa-scroll-reveal:not(.oa-visible), .oa-motion-item:not(.oa-motion-visible), img.oa-motion-photo:not(.oa-motion-visible)");
    if (!elements.length) return;
    if (!( "IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach(el => {
        if (el.classList.contains("reveal")) el.classList.add("active");
        if (el.classList.contains("oa-scroll-reveal")) el.classList.add("oa-visible");
        el.classList.add("oa-motion-visible");
      });
      return;
    }

    let observer = window.__oaScrollRevealObserver;
    if (!observer) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        if (el.classList.contains("reveal")) el.classList.add("active");
        if (el.classList.contains("oa-scroll-reveal")) el.classList.add("oa-visible");
        el.classList.add("oa-motion-visible");
        observer.unobserve(el);
      }), { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
      window.__oaScrollRevealObserver = observer;
    }
    elements.forEach(element => observer.observe(element));
  }

  function setupLightbox() {
    const gallery = document.getElementById("gallery-grid") ||
      document.querySelector(".gallery-grid, #gallery, .gallery-section");
    if (!gallery || gallery.dataset.oaLightboxReady === "true") return;
    gallery.dataset.oaLightboxReady = "true";

    const getImages = () => [...gallery.querySelectorAll("img")].filter(image =>
      !image.hidden && image.getAttribute("src") && image.getAttribute("src") !== "about:blank"
    );
    let activeIndex = 0;
    let lastFocusedImage = null;
    let overlay = null;
    let keyHandler = null;

    const close = () => {
      if (!overlay) return;
      document.removeEventListener("keydown", keyHandler);
      overlay.remove();
      overlay = null;
      keyHandler = null;
      document.body.classList.remove("oa-lightbox-open");
      if (lastFocusedImage && lastFocusedImage.isConnected) lastFocusedImage.focus({ preventScroll: true });
    };

    const open = (index, sourceImage) => {
      const images = getImages();
      if (!images.length || document.querySelector(".oa-gallery-lightbox")) return;
      activeIndex = Math.max(0, Math.min(index, images.length - 1));
      lastFocusedImage = sourceImage || images[activeIndex];
      overlay = document.createElement("div");
      overlay.className = "oa-gallery-lightbox";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Galeri foto pernikahan");
      overlay.tabIndex = -1;
      overlay.style.cssText = "position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:18px;background:rgba(12,12,12,.94);color:#fff;";

      const panel = document.createElement("div");
      panel.style.cssText = "position:relative;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:12px;width:min(100%,1000px);height:min(88vh,820px);";
      const toolbar = document.createElement("div");
      toolbar.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:12px;";
      const counter = document.createElement("span");
      counter.setAttribute("aria-live", "polite");
      counter.style.cssText = "font:500 13px/1.4 system-ui,sans-serif;letter-spacing:.08em;";
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.textContent = "Tutup";
      closeButton.setAttribute("aria-label", "Tutup galeri");
      closeButton.style.cssText = "min-width:44px;min-height:44px;padding:8px 14px;border:1px solid #ffffff66;border-radius:999px;background:#ffffff14;color:#fff;font:inherit;cursor:pointer;";
      closeButton.addEventListener("click", close);
      toolbar.append(counter, closeButton);

      const stage = document.createElement("div");
      stage.style.cssText = "position:relative;display:grid;place-items:center;min-height:0;gap:8px;";
      const image = document.createElement("img");
      image.alt = "";
      image.decoding = "async";
      image.style.cssText = "display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:4px;";
      const makeArrow = (direction, label, glyph) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = glyph;
        button.setAttribute("aria-label", label);
        button.style.cssText = "position:absolute;top:50%;transform:translateY(-50%);"+direction+":0;width:46px;height:46px;border:1px solid #ffffff66;border-radius:50%;background:#151515aa;color:#fff;font-size:26px;line-height:1;cursor:pointer;";
        button.addEventListener("click", () => show(activeIndex + (direction === "left" ? -1 : 1)));
        return button;
      };
      const previous = makeArrow("left", "Foto sebelumnya", "‹");
      const next = makeArrow("right", "Foto berikutnya", "›");
      stage.append(image, previous, next);

      const caption = document.createElement("p");
      caption.style.cssText = "margin:0;text-align:center;font:400 13px/1.5 system-ui,sans-serif;color:#ffffffc9;";
      panel.append(toolbar, stage, caption);
      overlay.append(panel);
      overlay.addEventListener("click", event => { if (event.target === overlay) close(); });
      document.body.append(overlay);
      document.body.classList.add("oa-lightbox-open");

      const show = index => {
        const currentImages = getImages();
        if (!currentImages.length) return close();
        activeIndex = (index + currentImages.length) % currentImages.length;
        const current = currentImages[activeIndex];
        image.src = current.currentSrc || current.src;
        image.alt = current.alt || "Foto pernikahan";
        caption.textContent = current.alt || "";
        counter.textContent = (activeIndex + 1) + " / " + currentImages.length;
        previous.hidden = currentImages.length < 2;
        next.hidden = currentImages.length < 2;
      };
      keyHandler = event => {
        if (!overlay) return;
        if (event.key === "Escape") { event.preventDefault(); close(); }
        else if (event.key === "ArrowLeft") { event.preventDefault(); show(activeIndex - 1); }
        else if (event.key === "ArrowRight") { event.preventDefault(); show(activeIndex + 1); }
        else if (event.key === "Tab") {
          const controls = [previous, next, closeButton].filter(button => !button.hidden);
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener("keydown", keyHandler);
      show(activeIndex);
      closeButton.focus({ preventScroll: true });
    };

    const openFromTarget = target => {
      const clicked = target && target.closest ? target.closest("img") : null;
      if (!clicked || !gallery.contains(clicked)) return;
      const images = getImages();
      open(images.indexOf(clicked), clicked);
    };
    gallery.addEventListener("click", event => openFromTarget(event.target));
    gallery.addEventListener("keydown", event => {
      if ((event.key === "Enter" || event.key === " ") && event.target.matches("img[role='button']")) {
        event.preventDefault();
        openFromTarget(event.target);
      }
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