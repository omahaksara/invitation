# Omah Aksara — Shared AI Agent Instructions

This file is the shared operating contract for ChatGPT, Claude, GitHub Copilot, and any other AI or human contributor working in this repository.

## Mission
Maintain and improve the Omah Aksara V2 digital invitation engine without breaking existing client invitations, theme contracts, public URLs, integrations, or release gates.

## Read before changing code
1. Read `README.md`.
2. Read the relevant sections of `docs/DATA-SCHEMA.md`, `docs/RELEASE-CHECKLIST.md`, and `docs/OPERATIONS-RECOVERY.md`.
3. Inspect the current branch, open pull requests, changed files, and latest CI evidence.
4. Follow the existing engine, template, data, and test contracts. Do not invent a second engine or duplicate backend.

## Absolute protected zone: Venni–Rama / Army
- Treat the Venni–Rama invitation and its Army theme as LOCKED production/client assets.
- Do not read for experimentation, edit, delete, rename, migrate, reformat, regenerate, test against, or use these client files/assets as fixtures.
- Do not change its theme presentation, transitions, motion, navigation, configuration, slug, public URL, RSVP, guestbook, Apps Script, or related production integration.
- Do not include the protected invitation in test matrices, screenshots, visual comparisons, or automated browser runs.
- If a proposed change could affect Army indirectly through shared engine/CSS/JS, stop and explain the risk. Require an explicit, separately scoped human decision before proceeding.
- Other work must preserve the locked zone byte-for-byte.

## Client data and production safety
- Never use production client data as test data.
- Never send dummy RSVP or guestbook submissions to production.
- Never change client slugs, invitation URLs, published data, payment details/QR assets, RSVP/guestbook endpoints, Apps Script deployment, or production spreadsheet configuration as part of unrelated work.
- Use demo fixtures, mocks, and isolated TEST backends only.
- Do not expose personal guest data, tokens, credentials, spreadsheet IDs, API keys, or private payment information in issues, PRs, logs, or reports.

## Engineering rules
- Preserve backward compatibility and existing JSON/data contracts.
- Do not remove a feature or file merely because it appears unused; prove references and impact first.
- Keep theme-specific identity intact. Do not force all themes into one visual treatment.
- Avoid unrelated refactors and broad formatting changes.
- Respect reduced-motion, mobile layouts, accessibility, and performance.
- Do not add paid services, API keys, secrets, or external dependencies without explicit approval.
- Do not claim tests passed unless they were actually run and their output was inspected.

## AI collaboration protocol — free-first
GitHub is the shared source of truth. Issues define tasks; branches contain isolated work; pull requests contain proposed changes; checks and review comments record evidence.

1. One task = one issue (or a clearly identified existing issue/PR).
2. Before work, report the current branch, target base, relevant open PRs, protected files, and possible overlap.
3. Assign one implementer to a task. Do not let multiple agents edit the same branch or files concurrently.
4. Use a unique branch named `ai/<agent>/<short-task>` or `chore/<short-task>`; never work directly on `main`.
5. The implementer makes the smallest safe change and opens/updates a PR.
6. A second agent may review the PR read-only and report findings. Reviewers must not silently edit the implementer's branch.
7. The implementer addresses accepted findings and records test evidence.
8. Human owner approves merging. No agent may merge, force-push, delete branches, or close release gates without explicit authorization.
9. If an MCP tool asks for permission, request only the permission needed for the current task. Keep destructive/write actions under confirmation.
10. If two tasks overlap, pause one and coordinate before proceeding.

### Free-tier reality
The free-first workflow is coordinated through GitHub issues, branches, PRs, and manual agent sessions. Do not claim that Claude Free, Copilot Free, and ChatGPT automatically invoke or message one another. Automated cross-agent orchestration may require paid API/agent entitlements; do not add those dependencies to this repository.

## Required task report
Every agent must report:
- Task and issue/PR reference
- Branch and base commit
- Files changed
- Protected-zone impact (must be none)
- Tests actually run and their results
- Checks not run and why
- Remaining risks or blockers
- PR URL, if created

## Stop conditions
Stop without writing if the task requires touching the protected Venni–Rama/Army zone, production integrations, client personal data, destructive operations, unclear migrations, or a conflict with an existing PR. Explain the exact blocker and request a narrowly scoped decision.
