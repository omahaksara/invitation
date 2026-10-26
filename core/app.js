(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", initInvitation);

  async function initInvitation() {
    const app = document.getElementById("app");
    if (!app) return;

    const params = new URLSearchParams(window.location.search);
    const clientFolder = params.get("c");
    const guestName = params.get("to");

    if (!clientFolder || !/^[a-z0-9][a-z0-9-]*$/i.test(clientFolder)) {
      showError(app, "Undangan Tidak Ditemukan", "Tautan undangan tidak valid. Pastikan tautan memiliki parameter ?c=nama-klien.");
      return;
    }

    const basePath = getBasePath();
    const clientBase = new URL(`${basePath}/clients/${clientFolder}/`, window.location.origin);

    try {
      const dataResponse = await fetch(new URL("data.json", clientBase));
      if (!dataResponse.ok) throw new Error("Data undangan klien tidak ditemukan.");
      const data = await dataResponse.json();

      const theme = typeof data.theme === "string" && /^[a-z0-9-]+$/i.test(data.theme)
        ? data.theme
        : "sirein";
      const themeBase = new URL(`${basePath}/templates/${theme}/`, window.location.origin);

      const cssLink = document.getElementById("theme-style");
      if (cssLink) {
        await waitForStylesheet(cssLink, new URL("style.css", themeBase).href);
      }

      const templateResponse = await fetch(new URL("index.html", themeBase));
      if (!templateResponse.ok) throw new Error(`Template '${theme}' tidak ditemukan.`);
      app.innerHTML = await templateResponse.text();

      bindData(data, clientBase);
      bindGuestName(guestName, data);
      bindMapLinks(data);
      initCoverAndMusic();
      initKarsaReveal();
    } catch (error) {
      console.error("Gagal memuat undangan:", error);
      showError(app, "Undangan Tidak Dapat Dimuat", error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.");
    }
  }

  function getBasePath() {
    if (!window.location.hostname.endsWith(".github.io")) return "";
    const segments = window.location.pathname.split("/").filter(Boolean);
    return segments.length ? `/${segments[0]}` : "";
  }

  function waitForStylesheet(link, href) {
    return new Promise((resolve) => {
      if (!link) return resolve();
      const done = () => resolve();
      link.addEventListener("load", done, { once: true });
      link.addEventListener("error", done, { once: true });
      link.href = href;
      window.setTimeout(done, 3000);
    });
  }

  function getNestedValue(object, path) {
    return path.split(".").reduce((value, key) => {
      if (value === null || value === undefined) return undefined;
      return value[key];
    }, object);
  }

  function bindData(data, clientBase) {
    document.querySelectorAll("[data-bind]").forEach((element) => {
      const path = element.getAttribute("data-bind");
      let value = getNestedValue(data, path);
      if ((value === null || value === undefined) && path === "cover.heroImage") {
        value = getNestedValue(data, "cover.image");
      }
      if (value === null || value === undefined) {
        if (element.tagName === "A" && path.startsWith("rsvp.")) {
          const section = element.closest("section");
          if (section) section.hidden = true;
          else element.hidden = true;
        }
        return;
      }
      if (typeof value === "object") return;

      if (element.tagName === "IMG" || element.tagName === "AUDIO" || element.tagName === "VIDEO") {
        if (String(value).trim() === "") return;
        element.src = isExternalUrl(String(value)) ? String(value) : new URL(String(value), clientBase).href;
      } else if (element.tagName === "A") {
        element.href = String(value);
      } else {
        element.textContent = String(value);
      }
    });
  }

  function isExternalUrl(value) {
    return /^(https?:)?\/\//i.test(value) || value.startsWith("data:");
  }

  function bindGuestName(guestName, data) {
    const name = guestName && guestName.trim()
      ? guestName.trim()
      : (data.guest && data.guest.defaultName) || "Tamu Undangan";
    document.querySelectorAll("#nama-tamu, [data-bind='guest.name']").forEach((element) => {
      element.textContent = name;
    });
  }

  function bindMapLinks(data) {
    const akad = document.getElementById("link-akad-maps");
    const resepsi = document.getElementById("link-resepsi-maps");
    const akadUrl = data.events && data.events.akad && data.events.akad.mapsUrl;
    const resepsiUrl = data.events && data.events.resepsi && data.events.resepsi.mapsUrl;
    if (akad && akadUrl) {
      akad.href = akadUrl;
      akad.rel = "noopener noreferrer";
    }
    if (resepsi && resepsiUrl) {
      resepsi.href = resepsiUrl;
      resepsi.rel = "noopener noreferrer";
    }
  }

  function initCoverAndMusic() {
    const cover = document.getElementById("cover-section") || document.getElementById("cover");
    const main = document.getElementById("main-content") || document.getElementById("app-inner");
    const openButton = document.getElementById("open-invitation-btn") || document.getElementById("open-btn");
    const music = document.getElementById("bg-music");
    const toggle = document.getElementById("music-toggle") || document.getElementById("music-btn");
    const disk = document.getElementById("disk-wrap");
    const musicIcon = document.getElementById("music-icon");

    if (openButton) {
      openButton.addEventListener("click", async () => {
        if (cover) {
          cover.classList.add("is-opening");
          window.setTimeout(() => {
            cover.style.display = "none";
          }, cover.id === "cover" ? 900 : 450);
        }
        if (main) main.style.display = "block";
        if (toggle) toggle.style.display = "flex";
        if (music && music.getAttribute("src")) {
          try {
            await music.play();
            if (toggle) toggle.setAttribute("aria-pressed", "true");
          } catch (error) {
            // Autoplay can be blocked; user can start playback with the music button.
            if (toggle) toggle.setAttribute("aria-pressed", "false");
          }
        }
      });
    }

    if (toggle && music) {
      toggle.addEventListener("click", async () => {
        if (music.paused) {
          try {
            await music.play();
            toggle.setAttribute("aria-pressed", "true");
            toggle.innerHTML = '<i class="fa-solid fa-compact-disc fa-spin" aria-hidden="true"></i>';
            if (disk) disk.classList.remove("paused");
            if (musicIcon) musicIcon.className = "fa-solid fa-pause absolute text-[9px] text-stone-600";
          } catch (error) {
            toggle.setAttribute("aria-pressed", "false");
          }
        } else {
          music.pause();
          toggle.setAttribute("aria-pressed", "false");
          toggle.innerHTML = '<i class="fa-solid fa-compact-disc" aria-hidden="true"></i>';
          if (disk) disk.classList.add("paused");
          if (musicIcon) musicIcon.className = "fa-solid fa-play absolute text-[9px] text-stone-600";
        }
      });
    }
  }

  async function copyRekening() {
    const numberElement = document.getElementById("rekening-num");
    if (!numberElement) return;
    const number = numberElement.textContent.trim();
    if (!number || number === "Nomor rekening") return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(number);
      } else {
        const helper = document.createElement("textarea");
        helper.value = number;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand("copy");
        helper.remove();
        if (!copied) throw new Error("Penyalinan tidak didukung oleh browser ini.");
      }
      window.alert("Nomor rekening berhasil disalin.");
    } catch (error) {
      window.alert("Nomor rekening belum dapat disalin. Silakan salin secara manual.");
    }
  }

  function showError(app, title, message) {
    app.textContent = "";
    const panel = document.createElement("div");
    panel.className = "loading-wrap";
    const heading = document.createElement("h2");
    heading.className = "loading-names";
    heading.textContent = title;
    const description = document.createElement("p");
    description.className = "error-desc";
    description.textContent = message;
    panel.append(heading, description);
    app.appendChild(panel);
  }

  function initKarsaReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;
    if (!( "IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("active"));
      return;
    }
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    elements.forEach((element) => observer.observe(element));
  }

  function submitWish(event) {
    if (event) event.preventDefault();
    const form = document.getElementById("wishes-form");
    if (!form) return;
    let message = document.getElementById("wishes-status");
    if (!message) {
      message = document.createElement("p");
      message.id = "wishes-status";
      message.setAttribute("role", "status");
      message.style.cssText = "font-size:.85rem;text-align:center;color:#777;margin-top:12px";
      form.appendChild(message);
    }
    message.textContent = "Fitur ucapan belum aktif. Hubungkan endpoint api.apiUcapan pada data.json terlebih dahulu.";
  }

  window.copyRekening = copyRekening;
  window.openInvitation = () => {
    const button = document.getElementById("open-invitation-btn") || document.getElementById("open-btn");
    if (button) button.click();
  };
  window.toggleMusic = () => {
    const button = document.getElementById("music-toggle") || document.getElementById("music-btn");
    if (button) button.click();
  };
  window.submitWish = submitWish;
})();
