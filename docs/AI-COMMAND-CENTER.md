# Omah Aksara AI Command Center (free-first)

## Purpose
Use GitHub as the shared task board and audit trail for ChatGPT, Claude, GitHub Copilot, and human contributors. This coordinates work; it does not mean the products automatically call one another.

## Free-first operating model
| Role | Main responsibility | Coordination channel |
|---|---|---|
| ChatGPT | Planning, architecture/context checks, risk review, progress summary | GitHub issues/PRs and connected tools |
| Claude Free + GitHub MCP | Repository inspection and scoped edits subject to permissions and usage limits | GitHub issue/PR |
| GitHub Copilot Free | In-editor coding assistance and supported chat/completion features | Same branch/PR, operated by the human |
| Human owner | Approvals, account permissions, final QA, merge and production decisions | GitHub |

Free plans have usage and feature limits. This workflow does not configure paid APIs, hosted agents, secrets, or a fully autonomous cross-agent dispatcher.

## One-command convention
> Omah Aksara: kerjakan issue #NN. Baca AGENTS.md, periksa PR yang tumpang tindih, buat branch aman, kerjakan sesuai scope, minta review independen, jalankan QA, dan laporkan bukti. Jangan merge.

ChatGPT can operate the linked repository where tools are available. Claude can work through its GitHub MCP connection when the user opens Claude and gives it the same issue/PR reference. Copilot assists in its supported editor/chat context. GitHub keeps the shared record; this is not a one-click broadcast.

## Standard workflow
1. Create or select one issue.
2. Check open PRs and changed files for overlap.
3. Select one implementer and optionally one independent reviewer.
4. Create a unique task branch; never work directly on `main`.
5. Implement the smallest useful change.
6. Open/update a PR with summary, risks, and actual test evidence.
7. Request read-only review; address accepted findings.
8. Human owner reviews and decides whether to merge.
9. Record completion and evidence in the issue.

## Safety and scope
- All themes and invitations, including Army and Venni–Rama, may be improved when authorized by the owner; no theme is permanently locked.
- Back up and verify before migrations or destructive edits.
- Do not delete client records, RSVP/guestbook records, payment configuration, public URLs/slugs, Apps Script deployments, spreadsheets, or production endpoints without explicit approval and a tested recovery plan.
- Use demo/mock/TEST services. Never send dummy RSVP or guestbook submissions to production.
- Preserve existing contracts or provide tested migration and rollback.
- Keep themes visually distinct, mobile-first, accessible, performant, and respectful of reduced-motion.
- Never paste OAuth tokens, API keys, secrets, guest personal data, or private payment details into issues or PRs.
- Human approval is required before merge, production deployment, destructive operations, and data migrations.

## Current limitations
- This document does not configure Anthropic API access, Copilot coding-agent access, or a third-party orchestration server.
- GitHub Actions run only workflows configured in the repository.
- Completion requires a reviewed PR, test evidence, and the human owner's merge/production decision.
