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
      const theme = data.demoMode === true && /^[a-z0-9-]+$/i.test(requestedTheme || "") ? requestedTheme : (/^[a-z0-9-]+$/i.test(data.theme || "") ? data.theme : "karsa");
      const themeBase = new URL(`${basePath}/templates/${theme}/`, location.origin);
      const css = document.getElementById("theme-style");
      if (css) await loadStylesheet(css, new URL("style.css", themeBase).href);
      const templateResponse = await fetch(new URL("index.html", themeBase));
      if (!templateResponse.ok) throw new Error("Tema undangan tidak ditemukan: " + theme);
      app.innerHTML = await templateResponse.text();
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

  function loadStylesheet(link, href) {
    return new Promise(resolve => {
      const finish = () => resolve();
      link.addEventListener("load", finish, { once: true });
      link.addEventListener("error", finish, { once: true });
      link.href = href;
      window.setTimeout(finish, 2500);
    });
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
    ["rsvp-name", "wishes-name"].forEach(id => {
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
    setupLightbox();
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
    if (open) open.addEventListener("click", async () => {
      if (cover) cover.classList.add("is-opening");
      if (main) { main.hidden = false; main.style.display = "block"; }
      if (musicToggle) { musicToggle.hidden = false; musicToggle.style.display = "flex"; }
      window.setTimeout(() => { if (cover) { cover.hidden = true; cover.style.display = "none"; } }, cover && cover.id === "cover" ? 1800 : 850);
      const audio = document.getElementById("bg-music");
      if (audio && audio.src) { try { await audio.play(); musicToggle?.classList.add("playing"); musicToggle?.setAttribute("aria-pressed", "true"); } catch {} }
      setupReveal();
    });
  }

  function setupMusic(music, clientBase) {
    const audio = document.getElementById("bg-music");
    const button = document.getElementById("music-toggle") || document.getElementById("music-btn");
    const actualMusic = music || (window.__invitationData && window.__invitationData.media && window.__invitationData.media.music);
    if (!audio || !button || !actualMusic || !(actualMusic.src || typeof actualMusic === "string")) return;
    audio.src = assetUrl(typeof actualMusic === "string" ? actualMusic : actualMusic.src, clientBase);
    button.addEventListener("click", async () => {
      if (audio.paused) {
        try { await audio.play(); button.classList.add("playing"); button.setAttribute("aria-pressed", "true"); button.textContent = "♫"; }
        catch { button.setAttribute("aria-pressed", "false"); }
      } else { audio.pause(); button.classList.remove("playing"); button.setAttribute("aria-pressed", "false"); button.textContent = "♫"; }
    });
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

  function setupForms(data, slug) {
    const apiUrl = data.integrations && data.integrations.apiUrl;
    const rsvp = document.getElementById("rsvp-form");
    const wishes = document.getElementById("wishes-form");
    if (data.rsvp && data.rsvp.enabled === false) { const section=document.getElementById("rsvp-section"); if(section) section.hidden=true; }
    if (data.guestbook && data.guestbook.enabled === false) { const section=document.getElementById("guestbook-section"); if(section) section.hidden=true; }
    if (rsvp) rsvp.addEventListener("submit", async event => {
      event.preventDefault();
      const status = document.getElementById("rsvp-status");
      const button = rsvp.querySelector("button[type=submit]");
      if (!apiUrl) { status.textContent = "RSVP belum diaktifkan. Endpoint Google Apps Script perlu dipasang terlebih dahulu."; return; }
      const form = new FormData(rsvp);
      const payload = { action:"rsvp", slug, name:String(form.get("name")||"").trim(), attendance:form.get("attendance"), guestCount:Number(form.get("guestCount")||1) };
      if (!payload.name || !payload.attendance) { status.textContent="Mohon lengkapi nama dan konfirmasi."; return; }
      if (data.rsvp?.maxGuestCount && payload.guestCount > data.rsvp.maxGuestCount) { status.textContent="Jumlah tamu melebihi batas undangan."; return; }
      await sendPayload(apiUrl,payload,status,button,"Konfirmasi berhasil dikirim.");
    });
    if (wishes) wishes.addEventListener("submit", async event => {
      event.preventDefault();
      let status = document.getElementById("wishes-status");
      if (!status) { status = document.createElement("p"); status.id = "wishes-status"; status.setAttribute("role", "status"); wishes.append(status); }
      const button = wishes.querySelector("button[type=submit]");
      if (!apiUrl) { status.textContent = "Buku tamu belum diaktifkan. Endpoint Google Apps Script perlu dipasang terlebih dahulu."; return; }
      const form = new FormData(wishes);
      const payload = { action:"guestbook", slug, name:String(form.get("name")||"").trim(), message:String(form.get("message")||"").trim() };
      if (!payload.name || !payload.message || payload.message.length > (data.guestbook?.maxMessageLength || 500)) { status.textContent="Mohon isi nama dan ucapan (maksimal 500 karakter)."; return; }
      const ok = await sendPayload(apiUrl,payload,status,button,"Ucapan berhasil dikirim.");
      if (ok) { wishes.reset(); loadWishes(apiUrl,slug); }
    });
    if (apiUrl && wishes) loadWishes(apiUrl,slug);
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

  async function loadWishes(apiUrl,slug) {
    const root=document.getElementById("wishes-list"); if(!root) return;
    try {
      const url=new URL(apiUrl); url.searchParams.set("action","guestbook"); url.searchParams.set("slug",slug);
      const response=await fetch(url); if(!response.ok) throw new Error("Gagal membaca buku tamu");
      const result=await response.json(); if(!result.ok || !Array.isArray(result.items)) return;
      root.replaceChildren();
      if(!result.items.length){const empty=document.createElement("p");empty.className="empty-wishes";empty.textContent="Jadilah yang pertama mengirim doa.";root.append(empty);return;}
      result.items.forEach(item=>{const card=document.createElement("article");card.className="wish-card";const name=document.createElement("h3");name.textContent=item.name||"Tamu";const message=document.createElement("p");message.textContent=item.message||"";card.append(name,message);root.append(card);});
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
    const gallery=document.getElementById("gallery-grid"); if(!gallery) return;
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