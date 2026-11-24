(() => {
  "use strict";

  const programs = new Map();
  let active = null;
  let activeCleanup = null;
  let generation = 0;

  const reducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function readonlyData(value, cache = new WeakMap()) {
    if (!value || typeof value !== "object") return value;
    if (cache.has(value)) return cache.get(value);
    const view = new Proxy(value, {
      get(target, key, receiver) {
        return readonlyData(Reflect.get(target, key, receiver), cache);
      },
      set() { throw new TypeError("Program tema tidak boleh mengubah data undangan."); },
      deleteProperty() { throw new TypeError("Program tema tidak boleh menghapus data undangan."); },
      defineProperty() { throw new TypeError("Program tema tidak boleh mengubah struktur data undangan."); },
      setPrototypeOf() { throw new TypeError("Program tema tidak boleh mengubah prototipe data undangan."); }
    });
    cache.set(value, view);
    return view;
  }

  function register(slug, program) {
    if (!/^[a-z0-9][a-z0-9-]*$/i.test(slug) || !program || typeof program.activate !== "function") {
      throw new TypeError("Program tema harus memiliki slug dan fungsi activate().");
    }
    programs.set(slug, program);
    return () => {
      if (programs.get(slug) === program) programs.delete(slug);
    };
  }

  function deactivate() {
    generation += 1;
    if (typeof activeCleanup === "function") {
      try { activeCleanup(); }
      catch (error) { console.error("Pembersihan program tema gagal:", error); }
    }
    activeCleanup = null;
    active = null;
  }

  function activate(slug, context = {}) {
    deactivate();
    const program = programs.get(slug);
    document.documentElement.dataset.oaThemeProgram = slug || "default";
    if (!program) {
      document.dispatchEvent(new CustomEvent("oa:theme-program-ready", {
        detail: { slug, enhanced: false }
      }));
      return false;
    }

    const current = generation;
    const controller = new AbortController();
    const cleanups = [];
    const root = context.root || document.getElementById("app") || document;
    const api = Object.freeze({
      slug,
      root,
      navigation: context.navigation || document.getElementById("oa-floating-controls"),
      data: readonlyData(context.data || window.__invitationData || {}),
      reducedMotion: reducedMotion(),
      signal: controller.signal,

      addCleanup(fn) {
        if (typeof fn === "function") cleanups.push(fn);
      },

      observe(elements, revealClass, options = {}) {
        const nodes = Array.from(elements || []);
        if (!nodes.length) return;
        if (reducedMotion() || !("IntersectionObserver" in window)) {
          nodes.forEach(node => node.classList.add(revealClass));
          return;
        }
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add(revealClass);
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px", ...options });
        nodes.forEach(node => observer.observe(node));
        cleanups.push(() => observer.disconnect());
      },

      depthMotion(options = {}) {
        const surface = root.querySelector(options.surface || "");
        if (!surface || reducedMotion()) return false;

        const previousSurfaceMarker = surface.getAttribute("data-oa-depth-surface");
        const hadEnteredClass = surface.classList.contains("oa-depth-entered");
        const previousSurfaceVars = {
          axis: surface.style.getPropertyValue("--oa-depth-axis"),
          angle: surface.style.getPropertyValue("--oa-depth-angle")
        };
        const style = document.createElement("style");
        style.dataset.oaDepthMotion = slug;
        style.textContent = `
          [data-oa-depth-surface="${slug}"] {
            transform-style:preserve-3d;
            perspective:1200px;
            rotate:var(--oa-depth-axis, 0 1 0) var(--oa-depth-angle, 0deg);
            transition:rotate 520ms cubic-bezier(.2,.7,.2,1);
          }
          [data-oa-depth-layer="${slug}"] {
            opacity:0;
            translate:var(--oa-depth-x, 0px) calc(var(--oa-depth-y, 0px) + 18px) calc(var(--oa-depth-z, 0px) - 28px);
            transform-style:preserve-3d;
            transition:translate 480ms cubic-bezier(.2,.75,.2,1),opacity 620ms ease!important;
            transition-delay:calc(var(--oa-depth-order, 0) * 110ms);
            backface-visibility:hidden;
          }
          [data-oa-depth-surface="${slug}"].oa-depth-entered [data-oa-depth-layer="${slug}"] {
            opacity:1;
            translate:var(--oa-depth-x, 0px) calc(var(--oa-depth-y, 0px) + var(--oa-depth-scroll, 0px)) var(--oa-depth-z, 0px);
          }
          @media (hover:none),(max-width:700px) {
            [data-oa-depth-surface="${slug}"] { rotate:none; }
            [data-oa-depth-layer="${slug}"] {
              translate:0 14px calc(var(--oa-depth-z, 0px) - 18px);
              transition:translate 480ms cubic-bezier(.2,.7,.2,1),opacity 560ms ease!important;
            }
            [data-oa-depth-surface="${slug}"].oa-depth-entered [data-oa-depth-layer="${slug}"] {
              opacity:1;
              translate:0 var(--oa-depth-scroll, 0px) var(--oa-depth-z, 0px);
            }
          }
          @media (prefers-reduced-motion:reduce) {
            [data-oa-depth-surface="${slug}"],[data-oa-depth-layer="${slug}"] {
              rotate:none!important;translate:none!important;transition:none!important;
            }
          }`;
        document.head.append(style);
        surface.setAttribute("data-oa-depth-surface", slug);
        if (!hadEnteredClass) surface.classList.remove("oa-depth-entered");

        const layerNodes = (options.layers || []).flatMap(item =>
          Array.from(root.querySelectorAll(item.selector || "")).map(node => ({ node, item }))
        );
        const previousLayerMarkers = new Map();
        const previousLayerVars = new Map();
        layerNodes.forEach(({ node, item }) => {
          previousLayerMarkers.set(node, node.getAttribute("data-oa-depth-layer"));
          previousLayerVars.set(node, {
            z: node.style.getPropertyValue("--oa-depth-z"),
            x: node.style.getPropertyValue("--oa-depth-x"),
            y: node.style.getPropertyValue("--oa-depth-y"),
            scroll: node.style.getPropertyValue("--oa-depth-scroll"),
            order: node.style.getPropertyValue("--oa-depth-order")
          });
          node.setAttribute("data-oa-depth-layer", slug);
          node.style.setProperty("--oa-depth-order", String(layerNodes.findIndex(entry => entry.node === node)));
          node.style.setProperty("--oa-depth-z", (Number(item.z) || 0) + "px");
        });

        let frame = 0;
        // Commit the hidden 3D layer state before revealing it on the next frame.
        // Without this layout boundary, browsers may skip the entrance transition.
        if (!hadEnteredClass) void surface.offsetWidth;
        const entranceFrame = window.requestAnimationFrame(() => {
          if (!hadEnteredClass) surface.classList.add("oa-depth-entered");
        });
        let pointerX = 0;
        let pointerY = 0;
        const render = () => {
          frame = 0;
          const rect = surface.getBoundingClientRect();
          const nx = Math.max(-1, Math.min(1, pointerX));
          const ny = Math.max(-1, Math.min(1, pointerY));
          const magnitude = Math.hypot(nx, ny);
          const axis = magnitude > 0.001
            ? (ny / magnitude).toFixed(3) + " " + (-nx / magnitude).toFixed(3) + " 0"
            : "0 1 0";
          surface.style.setProperty("--oa-depth-axis", axis);
          surface.style.setProperty("--oa-depth-angle", Math.min(3.5, magnitude * 2.8).toFixed(2) + "deg");

          const viewportHeight = Math.max(window.innerHeight || 1, 1);
          const progress = Math.max(-1, Math.min(1,
            (rect.top + rect.height * 0.5 - viewportHeight * 0.5) / viewportHeight
          ));
          layerNodes.forEach(({ node, item }) => {
            const factor = Number(item.factor) || 0;
            node.style.setProperty("--oa-depth-x", (nx * 10 * factor).toFixed(1) + "px");
            node.style.setProperty("--oa-depth-y", (ny * 8 * factor).toFixed(1) + "px");
            node.style.setProperty("--oa-depth-scroll", (progress * -10 * factor).toFixed(1) + "px");
          });
        };
        const scheduleRender = () => {
          if (!frame) frame = window.requestAnimationFrame(render);
        };
        const onPointer = event => {
          const rect = surface.getBoundingClientRect();
          pointerX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
          pointerY = ((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1;
          scheduleRender();
        };
        const resetPointer = () => {
          pointerX = 0;
          pointerY = 0;
          scheduleRender();
        };

        const finePointer = window.matchMedia("(hover:hover) and (pointer:fine)");
        if (finePointer.matches) {
          surface.addEventListener("pointermove", onPointer, { passive: true });
          surface.addEventListener("pointerleave", resetPointer, { passive: true });
        }
        window.addEventListener("scroll", scheduleRender, { passive: true });
        window.addEventListener("resize", scheduleRender, { passive: true });
        scheduleRender();

        cleanups.push(() => {
          surface.removeEventListener("pointermove", onPointer);
          surface.removeEventListener("pointerleave", resetPointer);
          window.removeEventListener("scroll", scheduleRender);
          window.removeEventListener("resize", scheduleRender);
          if (frame) window.cancelAnimationFrame(frame);
          window.cancelAnimationFrame(entranceFrame);
          if (!hadEnteredClass) surface.classList.remove("oa-depth-entered");

          if (previousSurfaceMarker === null) surface.removeAttribute("data-oa-depth-surface");
          else surface.setAttribute("data-oa-depth-surface", previousSurfaceMarker);
          if (!hadEnteredClass) surface.classList.remove("oa-depth-entered");
          [
            ["--oa-depth-axis", previousSurfaceVars.axis],
            ["--oa-depth-angle", previousSurfaceVars.angle]
          ].forEach(([key, value]) => {
            if (value) surface.style.setProperty(key, value);
            else surface.style.removeProperty(key);
          });

          layerNodes.forEach(({ node }) => {
            const marker = previousLayerMarkers.get(node);
            if (marker === null) node.removeAttribute("data-oa-depth-layer");
            else node.setAttribute("data-oa-depth-layer", marker);
            const vars = previousLayerVars.get(node);
            [
              ["--oa-depth-z", vars.z],
              ["--oa-depth-x", vars.x],
              ["--oa-depth-y", vars.y],
              ["--oa-depth-scroll", vars.scroll],
              ["--oa-depth-order", vars.order]
            ].forEach(([key, value]) => {
              if (value) node.style.setProperty(key, value);
              else node.style.removeProperty(key);
            });
          });
          style.remove();
        });
        return true;
      }
    });

    try {
      const cleanup = program.activate(api);
      if (typeof cleanup === "function") cleanups.push(cleanup);
      if (current !== generation) {
        controller.abort();
        cleanups.reverse().forEach(fn => { try { fn(); } catch (_) {} });
        return false;
      }
      active = slug;
      activeCleanup = () => {
        controller.abort();
        cleanups.reverse().forEach(fn => {
          try { fn(); }
          catch (error) { console.error("Cleanup tema gagal:", error); }
        });
      };
      document.dispatchEvent(new CustomEvent("oa:theme-program-ready", {
        detail: { slug, enhanced: true }
      }));
      return true;
    } catch (error) {
      controller.abort();
      cleanups.reverse().forEach(fn => { try { fn(); } catch (_) {} });
      console.error("Program tema gagal diaktifkan:", slug, error);
      document.dispatchEvent(new CustomEvent("oa:theme-program-error", {
        detail: { slug, error }
      }));
      return false;
    }
  }

  window.OAThemePrograms = Object.freeze({
    register,
    activate,
    deactivate,
    has: slug => programs.has(slug),
    get active() { return active; }
  });
  window.addEventListener("pagehide", deactivate, { once: true });
})();
