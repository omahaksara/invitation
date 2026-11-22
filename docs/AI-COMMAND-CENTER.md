# Omah Aksara AI Command Center (free-first)

## Purpose
Use GitHub as the shared task board and audit trail for ChatGPT, Claude, GitHub Copilot, and human contributors. This is a coordination workflow, not a promise that the AI products automatically call one another.

## Free-first operating model

| Role | Main responsibility | Coordination channel |
|---|---|---|
| ChatGPT | Task planning, architecture/context checks, risk review, progress summary | GitHub issue/PR and connected GitHub tools |
| Claude Free + GitHub MCP | Repository inspection, scoped edits when available, branch/PR work subject to tool permissions and usage limits | GitHub issue/PR |
| GitHub Copilot Free | In-editor coding assistance and limited chat/completion/review features available to the account | Same branch/PR, used by the human operator |
| Human owner | Approvals, account permissions, final QA, merge and production decisions | GitHub |

Free plans have usage and feature limits. Claude Free and Copilot Free do not provide a guaranteed always-on, autonomous cross-agent team. No paid API, hosted agent, secret, or billing-enabled workflow is configured by this document.

## One-command convention
The owner can start a task in ChatGPT using a natural-language command such as:

> Omah Aksara: kerjakan issue #NN. Baca AGENTS.md, periksa PR yang tumpang tindih, pilih satu implementer, buat branch aman, kerjakan sesuai scope, minta review independen, jalankan QA, dan laporkan bukti. Jangan merge.

ChatGPT can operate the linked GitHub repository where its GitHub tools are available. Claude can work through its GitHub MCP connection after the user opens Claude and gives it the same issue/PR reference. Copilot Free assists in its supported editor/chat context. GitHub keeps the shared record so context does not depend on copying entire conversations.

This is not a single-click broadcast to all three products. A fully automatic dispatcher that calls Claude and Copilot in the background is not included because it can require paid API or agent entitlements.

## Standard workflow
1. Create one issue using the **AI team task** template.
2. Select exactly one implementer and (optionally) one independent reviewer.
3. Check open PRs and changed files for overlap before starting.
4. Create a unique task branch; never work on `main`.
5. Implement only the approved scope.
6. Open a PR with summary, risks, and actual test evidence.
7. Ask the selected reviewer to inspect the PR read-only and comment on the PR.
8. Implementer resolves accepted findings and updates evidence.
9. Human owner performs final review and decides whether to merge.
10. Record completion in the issue.

## Task naming
- Branch: `ai/<agent>/<short-task>` or `chore/<short-task>`
- PR title: `[AI Task #NN] concise outcome`
- Commit: conventional, scoped message where practical.

## Safety gates
- Follow [AGENTS.md](../AGENTS.md) as the highest-priority repository-specific contributor guide.
- Venni–Rama / Army is a locked production/client zone. No agent may inspect it for experiments, edit it, include it in test fixtures, or run automated browser tests against it.
- No production client data, RSVP/guestbook writes, payment data, Apps Script deployments, or production spreadsheet changes.
- Do not grant broad write/delete permissions just to enable reading. Keep MCP tools in confirmation mode where possible.
- Never paste OAuth tokens, API keys, secrets, guest personal data, or private payment details into issues or PRs.
- Human approval is required before merge, production deployment, destructive operations, or changes that may affect protected shared engine behavior.

## Current limitations
- This repository document does not configure Anthropic API access, Copilot coding-agent access, or a third-party orchestration server.
- GitHub Actions can run repository-owned checks on its configured triggers, but this document does not add or change workflows.
- A task is considered complete only when the PR, test evidence, and human decision are recorded.
