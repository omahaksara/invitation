# GitHub Copilot instructions

Follow the repository-wide rules in [AGENTS.md](../AGENTS.md) before proposing or making changes.

For every task:
- Read the relevant project documentation and inspect current open PRs first.
- Work only on the requested scope and preserve existing engine/data/theme contracts.
- Never modify or use the Venni–Rama / Army invitation or its assets as test fixtures. This is a locked production zone.
- Never send test RSVP/guestbook data to production or change production Apps Script, spreadsheet, endpoint, slug, or client URLs.
- Prefer demo fixtures, mocks, isolated TEST services, and small isolated changes.
- Do not work directly on `main`; use a dedicated branch and PR.
- Do not merge, force-push, delete, or perform destructive actions without explicit human approval.
- Report actual test evidence; distinguish passed, failed, skipped, and not run.
- Do not add paid APIs, secrets, or dependencies without approval.

GitHub issues and PRs are the shared coordination record. Do not assume another AI agent has been invoked or has seen this conversation.