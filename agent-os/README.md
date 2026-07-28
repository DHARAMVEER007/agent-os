# AgentOS

AgentOS is a cross-platform desktop AI assistant for Windows and macOS. It is designed to run as a lightweight floating desktop companion, monitor connected services, surface important updates, and help users complete actions while keeping them in control.

The first product milestone is an email reply workflow that:

- monitors for new email,
- validates sender identity,
- drafts a context-aware reply,
- presents the draft for review,
- supports editing or cancellation, and
- sends only after explicit user confirmation.

## Planned architecture

- `desktop/` — Tauri, React, and TypeScript desktop application
- `ai-service/` — Python AI and background service
- `shared/` — shared schemas and contracts
- `database/` — database assets and migrations
- `docs/` — product and engineering documentation
- `scripts/` — development and automation scripts
- `tests/` — cross-component tests

## Project status

The repository is in its initial foundation phase. Product planning and architecture documents are available in `docs/`.

## Next milestone

Scaffold the Tauri + React desktop application and the Python service, then verify communication through a local health endpoint.
