# Visual audit — 31 active theme covers

**Evidence:** Playwright cover screenshots from GitHub Actions run 90, head `c2aab114e55d241722980e85eedcf98c7077a0c8`. This audit is based on a contact sheet of desktop cover screenshots, not full subjective review of every viewport. It is an evidence-based triage, not a claim of final visual approval.

## Findings

### P0 — shared demo photo is masking theme identity
The same Arkan–Arunika demo photo is used across most covers. This is intentional fixture reuse for functional QA, but it makes it impossible to judge the themes' photo art direction and creates an impression of theme sameness. Do not change client photos. For visual QA, create a theme-neutral photo set or varied synthetic assets isolated to the demo fixture.

### P1 — cover composition converges on the same pattern
Many themes repeat the centered couple-name treatment over a darkened full-bleed photo, with a similar small metadata block and CTA. Color, ornament and font changes alone do not sufficiently differentiate them. Avoid mass CSS changes; redesign each cover around a distinct composition.

### P1 — typography hierarchy and photo legibility
Some screenshot variants show names or small metadata overlapping visually with the photo subjects or background texture. The first screen needs clear hierarchy: names, event label, supporting details, CTA. Check contrast over both bright and dark portions of each photo and avoid ornamental text collisions.

### P2 — decorative frame is overused or too subtle to carry identity
Frames and borders appear in several covers but are not always meaningful. A theme should either use a distinctive frame as part of its concept or intentionally omit one. Avoid applying a generic border to every cover.

### P2 — themes that should remain illustration/card based
Sunda Watercolor and Gebyok Candra use illustrated or card-style covers. Do not force full-bleed photo composition into them; preserve their concept and refine their own reveal.

## Visual redesign groups (not final theme assignments)

Use these as directions for individual theme concepts, and confirm the design against the actual template before editing:
- **Editorial / asymmetric split:** photo on one side, typography and event metadata on the other; intentional whitespace.
- **Full-bleed cinematic:** photo fills the screen, title uses controlled placement, subtle vignette and slow reveal.
- **Invitation card / paper object:** layered paper, embossed typography, restrained shadows, invitation-like composition.
- **Arch / portrait gallery:** photo framed by an arch, portrait crop and generous margins.
- **Botanical / organic:** soft organic masks, leaf-inspired details, restrained motion; never overlay ornaments on text.
- **No-frame modern minimal:** typography and composition carry the identity; no unnecessary border or panel.
- **Traditional craft / heritage:** specific texture and layout inspired by the theme; not merely gold color applied to a common layout.
- **Illustrated / watercolor:** artwork remains the main visual; use scene transitions and typography that support the illustration.

## Remediation sequence

1. Make a dedicated visual QA fixture with varied synthetic/stock-safe photos and no production data; test a couple/portrait/full-bleed and bright/dark image conditions.
2. Select the most visually repetitive covers first and give each a genuinely different composition (layout, crop, typography hierarchy, frame/no-frame, motion entrance), rather than changing colors only.
3. Review mobile first: safe areas, name legibility, CTA placement, nav unobtrusiveness, and scroll/reveal behavior.
4. Audit motion per theme: entrance, title, photo, section reveal, and overlay should be a coherent choreography. Use animation only where it reinforces the concept; support reduced motion.
5. After each small group of theme redesigns, rerun static/backend/browser checks and inspect screenshot evidence. Keep PR #141 Draft until human visual QA is complete.

## Safety boundary

This audit does not authorize changes to client invitation records, client photos, slugs, production links, RSVP/guestbook endpoints or contracts, Apps Script/Sheet mappings, gift/payment details, QR assets, or backend behavior. Changes must remain limited to theme presentation and isolated demo fixtures.

## Re-audit after browser run #103 — 24 November 2026

**Evidence:** 31 desktop cover screenshots and 31 mobile screenshots from [run #103](https://github.com/omahaksara/invitation/actions/runs/45296070941), head `0f0913239a876c9650bd4c708b1e79253e67900e`. The full contact sheet confirms that the shared demo couple photo is still masking some of the differences, but it also exposes a cluster of covers using near-identical centered text over a full-bleed photo.

### Completed in the current follow-up
- **Kinze:** desktop cover changed to an asymmetric editorial split: quiet typographic column on the left and full-height portrait on the right. Mobile retains a centered cover treatment with a restrained frame.
- **Sirein:** cover changed to an ivory portrait-arch composition with a compact editorial text block below the portrait. Short-height viewport rules reduce the portrait and spacing so the open action remains reachable.
- These are presentation-only changes. No invitation data, feature contracts, links, or backend behavior were changed.

### Next visual pass
1. Review the new Kinze and Sirein screenshots from the next CI run at desktop, mobile, and short-height desktop sizes.
2. Give the remaining repeated full-bleed compositions their own layouts in small groups. Prioritize Romantic Floral, Taupe, Aksara Signature, Aksara Velora, Army, and Karsa, but do not force every theme into a different layout if its existing composition is already distinctive.
3. Replace the one-photo demo limitation only with explicitly isolated visual QA assets; never change client photos or production fixture references.
4. Keep the PR Draft until the new screenshots are reviewed and all functional checks pass.

The 31/31 browser result from run #103 is the baseline, not proof that the two new cover changes have already passed. Their verification belongs to the next run.


## Re-audit after browser run #107 and cover pass — 24 November 2026

**Baseline evidence:** [run #107](https://github.com/omahaksara/invitation/actions/runs/45302954615), head `e132b42ea241f624dc5088efea97355eda32e256`, passed static validation, backend mocks, and the 31-theme desktop/mobile browser smoke. Its artifact contains 124 screenshots. This verifies the pre-redesign baseline, including the Taupe split-cover update.

### New presentation-only cover redesigns
- **Aksara Signature:** warm botanical editorial split; portrait occupies the right side on desktop and the upper portion on mobile, with ink typography on paper below/alongside it.
- **Aksara Velora:** atelier portrait arch paired with an ivory typographic column; mobile stacks portrait above the invitation text.
- **Army:** deep forest ceremonial cover with a left-aligned title block and muted portrait; mobile anchors the title block at the lower edge.
- **Karsa:** restrained forest-green typographic cover with a slim gold corner frame and subdued background photo; name hierarchy is stacked instead of centered as a single line.

These changes affect only theme CSS presentation. The next browser run must be on the final combined branch head; run #107 does not verify these later commits.

### Verification from browser run #110 — 24 November 2026

**Evidence:** [run #110](https://github.com/omahaksara/invitation/actions/runs/45304201130), source-code HEAD `582aa1624b798cc365b1de03533d577b6ef9b8a8`. Static validation, backend mocks, and browser smoke all completed successfully. The browser artifact `theme-browser-visual-evidence` contains desktop/mobile screenshots for the active themes.

A visual review of the four redesigned cover pairs (Aksara Signature, Aksara Velora, Army, Karsa) confirms their intended distinct compositions are present at desktop and mobile sizes. The invitation CTA is visible in the captured covers; no obvious title clipping or horizontal overflow is apparent in these eight cover captures. This is a targeted cover review, not full aesthetic approval of all 31 themes.

### Remaining release gate
- Inspect the full-page desktop/mobile captures for duplicate music/navigation controls, especially Karsa and Army; cover-only captures do not prove dock behavior.
- Review reduced-motion behavior and section/reveal transitions beyond the cover.
- Continue the wider 31-theme aesthetic review; passing smoke tests is not equivalent to subjective design approval.
- Keep PR #141 Draft until these remaining visual checks are complete.

## Follow-up typography refinement — ampersand placement

Four cover templates received a presentation-only refinement so the ampersand sits on its own centered line between the two names, rather than reading as an inline separator:
- Aksara Signature
- Romantic Floral
- Kinze
- Karsa

The Karsa cover now has an explicit ampersand element so its position can be styled independently.
- Botanical Garden: its cover name row also now stacks the groom, centered ampersand, and bride vertically; this is a cover-only CSS adjustment.
- A source review of nearby themes found several already had a dedicated centered ampersand line (including Aksara Nocturne, Calestial, Earty, Jendela Senja, and Kencana Jawa), so those were left unchanged.
 These changes affect only cover typography/layout; invitation data, links, forms, and backend contracts are unchanged. Static/backend CI should be checked on the resulting branch head. Browser smoke is intentionally skipped for PR #141 per the temporary workflow condition; visual confirmation on real rendered screenshots remains outstanding for this follow-up.


### Second ampersand pass — additional cover templates

A second source audit found seven more covers where the name separator was inline or visually attached to one name. Their cover markup/styles now give the ampersand its own centered line:
- Aurelia Noir
- Elegance
- Gebyok Candra
- Sagara
- Sunda Watercolor
- Lumina
- Jendela Senja (source review showed the cover separator was inline, so it was refined in this pass)

These are scoped to the cover title only. Footer signatures, section headings, guestbook labels, and other ordinary prose using “&” remain unchanged. The edits preserve the existing name data bindings and do not alter invitation data, slugs, links, RSVP/guestbook, or Apps Script contracts. Static/backend validation must be checked against the latest branch head; browser smoke remains intentionally skipped for PR #141, so rendered visual confirmation is still a separate release gate.


## Verification status correction — 24 November 2026

The earlier notes saying browser smoke was intentionally skipped describe a temporary historical workflow state and are no longer current. Browser smoke has been re-enabled for PR #141 and runs across active themes on desktop and mobile. Latest PR-head run for commit `1041b7f57fd73ef1c036c86ba8d2df1eed774f88`:
- Static validation and backend mock tests: passed.
- Browser smoke: still running at last check; no new visual artifact available yet.
- PR #141 remains Draft and unmerged.


## Luma cover composition refinement

Luma's cover presentation CSS now shifts from a full-bleed cinematic photo with a centered arched glass panel to a paper-and-portrait layout: desktop uses a warm paper field with a portrait panel on the right and typography on the left; mobile stacks the portrait above the invitation text panel. This is a presentation-only override. Rendered confirmation is pending the current browser smoke artifact.


## Cinematic re-art direction — 24 November 2026

- **Romantic Floral** now uses a full-bleed cinematic cover with left-aligned stacked name hierarchy, a controlled image vignette, restrained orbital linework, photo/name reveal choreography, and a curtain-style exit.
- Desktop keeps the photo immersive; mobile transitions to a top-photo/lower-copy composition with a diagonal image edge and safe-area-aware CTA.
- Reduced-motion disables the cover choreography and restores a static presentation.
- The change is CSS-only in `templates/romantic-floral/index.html`; no markup bindings, links, IDs, forms, data, or backend contracts changed.
- Commit: `86f941dfd17548e4277df5618e456af5fec292d8`.

**Verification status:** the previous screenshot artifact from run #62 / HEAD `13ce40c5c7104256d7985c523376b35112fc4fa4` predates this change and is not evidence for the new composition. The current PR head has no PR-triggered workflow run or commit status reported by the available GitHub checks at this checkpoint. Browser screenshots, runtime checks, and CI for the new SHA remain pending; do not treat this theme as visually verified yet.
