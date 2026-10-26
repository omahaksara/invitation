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
        cssLink.href = new URL("style.css", themeBase).href;
        await waitForStylesheet(cssLink);
      }

      const templateResponse = await fetch(new URL("index.html", themeBase));
      if (!templateResponse.ok) throw new Error(`Template '${theme}' tidak ditemukan.`);
      app.innerHTML = await templateResponse.text();

      bindData(data, clientBase);
      bindGuestName(guestName, data);
      bindMapLinks(data);
      initCoverAndMusic();
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

  function waitForStylesheet(link) {
    return new Promise((resolve) => {
      if (!link) return resolve();
      if (link.sheet) return resolve();
      const done = () => resolve();
      link.addEventListener("load", done, { once: true });
      link.addEventListener("error", done, { once: true });
      window.setTimeout(done, 2500);
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
      const value = getNestedValue(data, path);
      if (value === null || value === undefined || typeof value === "object") return;

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
    const cover = document.getElementById("cover-section");
    const main = document.getElementById("main-content");
    const openButton = document.getElementById("open-invitation-btn");
    const music = document.getElementById("bg-music");
    const toggle = document.getElementById("music-toggle");

    if (openButton) {
      openButton.addEventListener("click", async () => {
        if (cover) {
          cover.classList.add("is-opening");
          window.setTimeout(() => {
            cover.style.display = "none";
          }, 450);
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
          } catch (error) {
            toggle.setAttribute("aria-pressed", "false");
          }
        } else {
          music.pause();
          toggle.setAttribute("aria-pressed", "false");
          toggle.innerHTML = '<i class="fa-solid fa-compact-disc" aria-hidden="true"></i>';
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

  // Dipakai oleh tombol salin rekening pada template.
  window.copyRekening = copyRekening;
})();
