# Omah Aksara — Shared AI Agent Instructions

This file is the shared operating contract for ChatGPT, Claude, GitHub Copilot, and human contributors.

## Mission
Improve the complete Omah Aksara invitation product: one reliable engine, distinctive modern themes, a polished catalog, and dependable client experiences.

## Read before changing code
1. Read `README.md`.
2. Read relevant sections of `docs/DATA-SCHEMA.md`, `docs/RELEASE-CHECKLIST.md`, and `docs/OPERATIONS-RECOVERY.md`.
3. Inspect the current branch, open pull requests, changed files, and latest CI evidence.
4. Follow existing engine, template, data, and test contracts. Do not invent a second engine or duplicate backend.

## Scope
All themes and invitations, including Army and Venni–Rama, are within the owner's authorized improvement scope. They may be audited, redesigned, refactored, and tested when beneficial to Omah Aksara. Do not treat any theme as permanently locked.

## Client data and production safety
- Back up and verify before migrations, bulk edits, or destructive changes.
- Never use private production client data as test fixtures or expose guest details, credentials, spreadsheet IDs, API keys, or payment information in issues, PRs, logs, or reports.
- Never send dummy RSVP or guestbook submissions to production.
- Do not delete client data, RSVP/guestbook records, payment configuration, public URLs/slugs, Apps Script deployments, spreadsheets, or production endpoints without explicit owner approval and a tested recovery plan.
- Use demo fixtures, mocks, and isolated TEST backends for automated tests.
- Preserve backward compatibility or provide a verified migration and rollback path.

## Engineering rules
- Keep one shared engine and preserve existing JSON/data contracts unless a migration is explicitly designed and tested.
- Keep each theme's visual identity; do not force all themes into one generic treatment.
- Theme names may change, but internal slugs, folder paths, IDs, and public URLs require compatibility aliases or a verified migration.
- Do not remove features/files merely because they appear unused; prove references and impact first.
- Respect reduced-motion, mobile layouts, accessibility, performance, and low-end Android devices.
- Do not add paid services, APIs, secrets, or dependencies without approval.
- Do not claim tests passed unless they were actually run and output inspected.

## AI collaboration protocol — free-first
GitHub is the shared source of truth. Issues define tasks; branches contain isolated work; PRs contain proposed changes; checks and review comments record evidence.
1. One task = one issue or clearly identified existing issue/PR.
2. Inspect open PRs and changed files for overlap before starting.
3. Use a unique branch; never work directly on `main`.
4. Keep changes scoped and reviewable; do not let multiple agents edit the same files concurrently.
5. A second agent may review read-only; accepted findings are addressed in the implementation PR.
6. Human owner approves merge, production deployment, destructive operations, and data migrations.
7. If an MCP tool requests permission, request only what the current task needs.
8. If two tasks overlap, coordinate before proceeding.

### Free-tier reality
GitHub issues, branches, and PRs coordinate manual sessions. Do not claim Claude Free, Copilot Free, and ChatGPT automatically invoke or message one another. Do not add paid API or hosted-agent dependencies without approval.

## Required task report
- Issue/PR and branch/base
- Files changed
- Data, URL, and production integration impact
- Tests actually run and results
- Checks not run and why
- Remaining risks/blockers
- PR URL

## Stop conditions
Pause before destructive data changes, production integration changes, unclear migrations, or unresolved conflicts. Explain the exact risk and request narrowly scoped approval.
