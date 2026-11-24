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
      depthMotion(options = {}) {
        const surface = root.querySelector(options.surface || "");
        if (!surface || reducedMotion()) return false;
        const style = document.createElement("style");
        style.dataset.oaDepthMotion = slug;
        style.textContent = "[data-oa-depth-surface]{transform-style:preserve-3d;perspective:1200px;rotate:var(--oa-depth-axis,0 0 1) var(--oa-depth-angle,0deg);transition:rotate 520ms cubic-bezier(.2,.7,.2,1)}[data-oa-depth-layer]{translate:var(--oa-depth-x,0px) calc(var(--oa-depth-y,0px) + var(--oa-depth-scroll,0px)) var(--oa-depth-z,0px);transition:translate 520ms cubic-bezier(.2,.7,.2,1);transform-style:preserve-3d}@media(hover:none),(max-width:700px){[data-oa-depth-surface]{rotate:none}[data-oa-depth-layer]{translate:0 0 var(--oa-depth-z,0px)}}@media(prefers-reduced-motion:reduce){[data-oa-depth-surface],[data-oa-depth-layer]{rotate:none!important;translate:none!important;transition:none!important}}";
        document.head.append(style); surface.dataset.oaDepthSurface = slug;
        const layerNodes = (options.layers || []).flatMap(item => Array.from(root.querySelectorAll(item.selector || "")).map(node => ({node,item})));
        layerNodes.forEach(({node,item}) => { node.dataset.oaDepthLayer = slug; node.style.setProperty("--oa-depth-z",(Number(item.z)||0)+"px"); });
        let frame=0, pointerX=0, pointerY=0;
        const render=()=>{ frame=0; const rect=surface.getBoundingClientRect(); const nx=Math.max(-1,Math.min(1,pointerX)), ny=Math.max(-1,Math.min(1,pointerY)); surface.style.setProperty("--oa-depth-axis",ny.toFixed(3)+" "+(-nx).toFixed(3)+" 0"); surface.style.setProperty("--oa-depth-angle",(Math.min(3.5,Math.hypot(nx,ny)*2.8)).toFixed(2)+"deg"); layerNodes.forEach(({node,item})=>{ const factor=Number(item.factor)||0; node.style.setProperty("--oa-depth-x",(nx*10*factor).toFixed(1)+"px"); node.style.setProperty("--oa-depth-y",(ny*8*factor).toFixed(1)+"px"); const progress=Math.max(-1,Math.min(1,(rect.top+rect.height*.5-innerHeight*.5)/Math.max(innerHeight,1))); node.style.setProperty("--oa-depth-scroll",(progress*-10*factor).toFixed(1)+"px"); }); };
        const onPointer=event=>{const rect=surface.getBoundingClientRect();pointerX=((event.clientX-rect.left)/Math.max(rect.width,1))*2-1;pointerY=((event.clientY-rect.top)/Math.max(rect.height,1))*2-1;if(!frame)frame=requestAnimationFrame(render);};
        const reset=()=>{pointerX=0;pointerY=0;if(!frame)frame=requestAnimationFrame(render);};
        const onScroll=()=>{if(!frame)frame=requestAnimationFrame(render);};
        surface.addEventListener("pointermove",onPointer,{passive:true}); surface.addEventListener("pointerleave",reset,{passive:true}); window.addEventListener("scroll",onScroll,{passive:true});
        cleanups.push(()=>{surface.removeEventListener("pointermove",onPointer);surface.removeEventListener("pointerleave",reset);window.removeEventListener("scroll",onScroll);if(frame)cancelAnimationFrame(frame);delete surface.dataset.oaDepthSurface;surface.style.removeProperty("--oa-depth-axis");surface.style.removeProperty("--oa-depth-angle");layerNodes.forEach(({node})=>{delete node.dataset.oaDepthLayer;["--oa-depth-z","--oa-depth-x","--oa-depth-y","--oa-depth-scroll"].forEach(key=>node.style.removeProperty(key));});style.remove();});
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