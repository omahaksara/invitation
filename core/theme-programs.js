(() => {
  "use strict";
  const programs = new Map();
  let active = null;
  let activeCleanup = null;
  let generation = 0;

  const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    return () => { if (programs.get(slug) === program) programs.delete(slug); };
  }

  function deactivate() {
    generation += 1;
    if (typeof activeCleanup === "function") {
      try { activeCleanup(); } catch (error) { console.error("Pembersihan program tema gagal:", error); }
    }
    activeCleanup = null;
    active = null;
  }

  function activate(slug, context = {}) {
    deactivate();
    const program = programs.get(slug);
    document.documentElement.dataset.oaThemeProgram = slug || "default";
    if (!program) {
      document.dispatchEvent(new CustomEvent("oa:theme-program-ready", { detail: { slug, enhanced: false } }));
      return false;
    }
    const current = generation;
    const controller = new AbortController();
    const cleanups = [];
    const api = Object.freeze({
      slug,
      root: context.root || document.getElementById("app") || document,
      navigation: context.navigation || document.getElementById("oa-floating-controls"),
      data: readonlyData(context.data || window.__invitationData || {}),
      reducedMotion: reducedMotion(),
      signal: controller.signal,
      addCleanup(fn) { if (typeof fn === "function") cleanups.push(fn); },
      observe(elements, revealClass, options = {}) {
        const nodes = Array.from(elements || []);
        if (!nodes.length) return;
        if (reducedMotion() || !("IntersectionObserver" in window)) {
          nodes.forEach(node => node.classList.add(revealClass));
          return;
        }
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(revealClass);
          observer.unobserve(entry.target);
        }), { threshold: 0.08, rootMargin: "0px 0px -4% 0px", ...options });
        nodes.forEach(node => observer.observe(node));
        cleanups.push(() => observer.disconnect());
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
        cleanups.reverse().forEach(fn => { try { fn(); } catch (error) { console.error("Cleanup tema gagal:", error); } });
      };
      document.dispatchEvent(new CustomEvent("oa:theme-program-ready", { detail: { slug, enhanced: true } }));
      return true;
    } catch (error) {
      controller.abort();
      cleanups.reverse().forEach(fn => { try { fn(); } catch (_) {} });
      console.error("Program tema gagal diaktifkan:", slug, error);
      document.dispatchEvent(new CustomEvent("oa:theme-program-error", { detail: { slug, error } }));
      return false;
    }
  }

  window.OAThemePrograms = Object.freeze({ register, activate, deactivate, has: slug => programs.has(slug), get active() { return active; } });
  window.addEventListener("pagehide", deactivate, { once: true });
})();