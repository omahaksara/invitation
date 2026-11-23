# Theme Experience Architecture

## Purpose

Omah Aksara must not behave like one generic invitation website with different color skins. The shared engine provides reliable services; each theme owns its visual composition, interaction choreography, transitions, typography, framing, and motion identity.

## Non-negotiable boundary

### Shared platform services

The core may own only cross-theme capabilities and lifecycle services:

- invitation data access and legacy data compatibility;
- the existing RSVP and guestbook submission contracts;
- navigation state and section routing;
- overlay lifecycle, focus management, escape/back handling, and scroll locking;
- media loading and playback lifecycle;
- motion scheduling, visibility/reduced-motion handling, and cleanup;
- shared accessibility and performance utilities.

The shared platform must not impose a universal cover, section layout, photo frame, overlay appearance, transition preset, typography, or decorative treatment.

### Theme-owned programs

Each theme owns its own program composition. A theme may implement, omit, replace, or reorder:

- entrance / cover choreography (gate, envelope, curtain, scene reveal, or static);
- typography choreography (letter reveal, stagger, drift, sway, tracking, handwriting);
- photo treatment (mask reveal, slide, blur-to-sharp, dissolve, bokeh, parallax, transparent fade);
- section and scene transitions (wipe, zoom, spatial shift, curtain, crossfade, scroll storytelling);
- story composition (timeline, editorial, layered scenes, immersive narrative);
- gallery composition and frame treatment (including frameless);
- event and gift presentation;
- theme-specific overlays and decorative programs;
- navigation presentation, while preserving the shared navigation contract.

A theme must not inherit a visual preset merely because another theme uses it. Shared primitives are optional tools, not mandatory design decisions.

## Program contract

Each theme program should declare:

1. a stable program identifier and version;
2. the DOM regions or slots it owns;
3. its activation conditions and optional configuration;
4. its setup and teardown lifecycle;
5. motion/overlay resources it creates and how they are disposed;
6. its reduced-motion fallback;
7. its dependencies on shared services;
8. the data fields it reads, without mutating invitation or backend data.

Programs must be independently removable. Removing a decorative or motion program must not remove navigation, media playback, RSVP, guestbook, or other unrelated functions. Optional programs must not leave empty wrappers, dead buttons, or console errors.

## Motion principles

- Motion has intent, hierarchy, timing, and an identifiable start/end state.
- Typography and photography may be animated as first-class visual elements.
- Avoid applying the same fade/slide sequence to every section or every theme.
- Do not animate every element simultaneously; preserve reading comfort and focal hierarchy.
- Prefer transform and opacity for continuous motion; avoid layout-thrashing animation.
- Respect `prefers-reduced-motion` and provide a meaningful static/reduced alternative.
- Pause or clean up offscreen/inactive animation loops.
- Never make content visibility depend solely on an animation successfully running.

## Overlay and navigation principles

The core owns overlay mechanics (stacking, focus, escape/back, scroll lock, cleanup). Themes own overlay design and presentation. Fullscreen gallery, story details, event details, and menu panels may look and behave differently per theme while using the same reliable lifecycle service.

The shared navigation contract must remain usable and consistent in function. Its visual placement, shape, transition, and active-state treatment may vary by theme. Avoid duplicate music, scroll, or navigation controls.

## Data and integration protection

This architecture is a presentation and interaction refactor only.

- Do not edit `clients/*/data.json`, client slugs, client mappings, or production invitation records.
- Do not change RSVP or guestbook payload fields, endpoint URLs, Apps Script IDs, sheet mappings, or submission semantics.
- Do not migrate, recreate, or ask clients to reconnect Google Sheets.
- Do not change gifts, bank details, QR assets, production links, or storage/backend contracts.
- Use synthetic demo fixtures or an isolated TEST backend for all verification.
- Preserve legacy theme data contracts through adapters at the presentation boundary; do not rewrite stored client data.

## Visual quality gate

A theme is not complete because it renders or passes static validation. Review the actual experience at 360px, 390px, and desktop:

- entrance choreography and cover controls;
- typography hierarchy, long names, and line wrapping;
- photo/background/frame harmony and focal crop;
- section/scene transitions and scroll behavior;
- overlay opening, closing, stacking, focus, and back/escape;
- gallery gestures and image loading;
- music controls without duplicates;
- RSVP and guestbook against demo/mock or TEST only;
- runtime console errors, horizontal overflow, and layout shifts;
- reduced-motion behavior and animation cleanup.

## Delivery sequence

1. Keep the theme-experience workstream in one reviewable PR; do not split it into overlapping implementation branches.
2. Stabilize shared lifecycle services without changing their visual defaults for every theme.
3. Extract theme-owned programs behind explicit lifecycle boundaries.
4. Prove the architecture on a small number of contrasting existing themes before broad rollout.
5. Refine existing themes' art direction and motion identity; do not add new themes until the current set has meaningful differentiation.
6. Keep each change scoped, reversible, and covered by demo/TEST verification.

## Implemented foundation (PR #141)

- Added `core/theme-programs.js` with slug-based registration, activation, cleanup, cancellation signal, reduced-motion context, and reveal observation.
- Theme programs receive invitation data through a recursive read-only view; they cannot mutate the shared invitation object through the program API.
- The shared renderer activates the selected theme program only after the template scripts and invitation content are ready. A missing or failing optional program does not block the base invitation renderer.
- Independent motion programs are implemented for Karsa, Royal Vintage, Aksara Nocturne, Sirein, Botanical Garden, and Nexus. Their visual treatments differ: editorial stagger, framed cover/card reveal, dark panel depth, sage editorial mask, botanical orbit/reveal, and cinematic portal treatment.
- Twelve existing themes now have independently registered navigation and gallery-overlay presentation programs. The six additional programs cover Aksara Signature, Aksara Velora, Atelier Editorial, Lumina, Kencana Jawa, and Sagara. This is a staged pilot, not yet a claim that all active themes have completed visual differentiation.
- The syntax check now includes the theme runtime. Browser visual QA remains a separate release gate; static/backend success is not evidence of visual correctness.

## Definition of success

One reliable platform, one preserved data/connectivity contract, and genuinely different theme experiences. Shared infrastructure must not force shared appearance.

## Navigasi dan overlay: pemisahan mekanik vs presentasi

Engine tetap menjadi pemilik perilaku navigasi: pemetaan bagian, scroll, status aktif, auto-scroll, musik, menu overflow, dan aksesibilitas. Program tema menerima handle navigasi yang sama melalui konteks aktivasi; tema tidak membuat ulang listener atau kontrol fungsi yang sama.

Setiap program tema memasang kelas presentasi dan stylesheet miliknya sendiri. Pilot dua belas tema saat ini memiliki komposisi berbeda:
- Karsa: dock kapsul gelap di tengah bawah.
- Royal Vintage: rail vertikal burgundy-emas di desktop, dock horizontal pada layar kecil.
- Aksara Nocturne: rail vertikal di sisi kanan, berubah menjadi dock pada layar kecil.
- Sirein: dock ringan di kanan atas, berubah menjadi dock bawah pada layar kecil.
- Botanical Garden: tray organik di kiri bawah.
- Nexus: bar editorial di tengah atas, berubah menjadi dock bawah pada layar kecil.
- Aksara Signature: tray ivory berbentuk medali dengan treatment foto arch.
- Aksara Velora: rail ivory vertikal dengan sudut lembut, beralih ke dock pada layar kecil.
- Atelier Editorial: bar editorial gelap di atas dengan pemisah tipis.
- Lumina: dock gelap neon-pink dengan tombol geometris.
- Kencana Jawa: dock hitam-emas berlapis dengan garis ganda.
- Sagara: rail teal di sisi kanan, beralih ke dock pada layar kecil.

Lightbox tetap dibuat dan dikendalikan engine, termasuk dialog, navigasi foto, Escape, dan pengembalian fokus. Engine memberi identitas tema pada overlay; program tema mengatur atmosfer, warna, bentuk foto, dan treatment visual tanpa menggandakan mekanik overlay.

Perubahan ini hanya menyentuh lapisan presentasi. Kontrak RSVP/guestbook, data undangan, endpoint, aset pembayaran, dan integrasi backend tidak diubah.
