# AgentOS System Architecture

**Document status:** Draft  
**Version:** 0.1  
**Date:** 27 July 2026  
**Target platforms:** Windows and macOS  
**Related documents:** Product Vision, Product Roadmap

## 1. Purpose

This document defines the implementation architecture for AgentOS Version 1. It explains how the React interface, Tauri desktop shell, Python background service, local storage, email provider, and AI provider work together.

The architecture is designed to support:

- one shared codebase for Windows and macOS;
- a persistent, lightweight desktop widget;
- background email monitoring while the panel is collapsed;
- sender validation before AI drafting;
- real-time unread badge updates;
- explicit human approval before sending;
- reliable recovery after restarts and temporary failures; and
- future capabilities without redesigning the desktop foundation.

## 2. Architectural Principles

1. **Separate presentation, native integration, and business logic.** React renders the interface, Tauri manages the desktop environment, and Python runs workflows.
2. **Keep one owner for each type of state.** Python is the only writer for domain data in SQLite. Tauri owns native window state and secrets stored through operating-system facilities.
3. **Treat all incoming content as untrusted.** Sender validation reduces risk but does not make email content or instructions safe.
4. **Require explicit approval for consequential actions.** Draft generation may be automatic; email sending is never automatic in Version 1.
5. **Prefer events over frequent polling.** Use provider push notifications where practical and efficient fallback polling where necessary.
6. **Make restart behavior deterministic.** Durable workflow state is saved before the UI is notified.
7. **Hide platform differences behind adapters.** Shared application code should not contain scattered Windows or macOS conditionals.

## 3. High-Level Architecture

```text
                         ┌──────────────────────────────┐
                         │          User                │
                         └──────────────┬───────────────┘
                                        │ click, edit, approve
                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Tauri Desktop Application                                           │
│                                                                     │
│  ┌──────────────────────────┐      ┌─────────────────────────────┐  │
│  │ React + TypeScript UI    │      │ Tauri / Rust Native Layer  │  │
│  │                          │      │                             │  │
│  │ - floating widget        │◄────►│ - window and focus control │  │
│  │ - expanded panel         │      │ - tray/menu-bar            │  │
│  │ - unread badge           │      │ - auto-start               │  │
│  │ - notifications          │      │ - Python lifecycle         │  │
│  │ - draft editor           │      │ - secure credential access│  │
│  │ - search and settings    │      │ - platform adapters        │  │
│  └────────────┬─────────────┘      └──────────────┬──────────────┘  │
└───────────────┼────────────────────────────────────┼─────────────────┘
                │ local REST + WebSocket             │ starts, monitors,
                │ authenticated on loopback          │ and stops sidecar
                ▼                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │ Python Background Service                               │
       │                                                         │
       │ FastAPI transport │ workflow engine │ event publisher   │
       │ email adapter     │ sender validator│ AI adapter        │
       │ notification svc │ approval/send svc│ job scheduler     │
       └───────────┬────────────────┬────────────────┬────────────┘
                   │                │                │
                   ▼                ▼                ▼
             ┌──────────┐   ┌──────────────┐  ┌──────────────┐
             │ SQLite   │   │ Email        │  │ AI Provider  │
             │ local DB │   │ Provider API │  │ API          │
             └──────────┘   └──────────────┘  └──────────────┘
                                  │
                                  ▼
                         Gmail or Microsoft 365
```

## 4. Component Responsibilities

### 4.1 React and TypeScript UI

React is responsible only for presentation and user interaction.

It will:

- render the collapsed widget and unread badge;
- render the approximately 400 × 700 expanded panel;
- display notifications, email context, drafts, history, search, and settings;
- hold short-lived view state in a client store such as Zustand;
- request data and actions from the Python service;
- receive real-time events through a WebSocket;
- invoke Tauri commands for native window behavior; and
- display clear pending, success, error, offline, and reconnection states.

React will not:

- store provider credentials;
- call Gmail, Microsoft Graph, or the AI provider directly;
- make sender-trust decisions;
- write directly to SQLite; or
- send an email without the approval workflow.

### 4.2 Tauri and Rust Native Layer

Tauri is the trusted desktop and operating-system boundary.

It will:

- create the floating widget and expanded panel windows;
- implement frameless, transparent, always-on-top behavior;
- place windows within the active display's usable area;
- handle outside-click, `Esc`, focus, hide, show, and collapse behavior;
- provide tray or menu-bar actions for Show, Settings, and Quit;
- register and remove launch-at-login behavior;
- start, health-check, restart when safe, and stop the Python sidecar;
- provide the UI with the local service endpoint and short-lived session token;
- access secrets through macOS Keychain or Windows Credential Manager; and
- expose a small set of typed Tauri commands to React.

Tauri should contain minimal business logic. Email processing, sender validation, drafting, approvals, and notification rules belong in Python.

### 4.3 Python Background Service

The Python service is the application engine. FastAPI provides its local API, but workflow code should remain independent of the web framework.

It will:

- monitor connected inboxes;
- normalize provider-specific messages into internal models;
- deduplicate incoming messages;
- validate sender identity and trust policy;
- load safe email and thread context;
- generate and persist AI reply drafts;
- create notifications and maintain read/unread state;
- publish real-time UI events;
- process user edits, cancellations, and approvals;
- perform final validation and idempotent sending;
- manage retries, backoff, provider rate limits, and offline recovery;
- record audit events without logging secrets or unnecessary message content; and
- expose health, readiness, query, command, and event endpoints.

The service continues working when the panel is collapsed because collapse hides UI; it does not stop the desktop process or Python sidecar.

### 4.4 Email Provider Adapter

Provider-specific behavior is hidden behind an interface so the workflow does not depend on Gmail or Microsoft Graph.

```text
EmailProvider
  - connect()
  - refresh_credentials()
  - start_monitoring()
  - fetch_message(message_id)
  - fetch_thread(thread_id)
  - get_authentication_signals(message_id)
  - send_reply(draft, idempotency_key)
```

Version 1 should implement one provider end to end. A second provider should require a new adapter, not changes to the core workflow.

### 4.5 Sender Validation Service

Sender validation runs before email content is sent to the AI drafting service.

It evaluates:

- the actual sender address, not only the display name;
- approved and blocked addresses;
- approved and blocked domains;
- known contacts or prior approved correspondents;
- provider-supplied SPF, DKIM, and DMARC results when available; and
- suspicious mismatches or missing signals.

The result is one of:

- `trusted` — eligible for automatic draft generation;
- `untrusted` — do not draft; record the reason; or
- `manual_review` — notify the user without generating a draft.

Validation is a policy decision, not proof that the message is harmless. Email body text, links, attachments, and instructions remain untrusted input.

### 4.6 AI Adapter

The AI adapter isolates provider SDKs and prompt construction from the workflow.

It will:

- receive only the minimum necessary message and thread context;
- use a versioned system prompt;
- treat email content as data, never as trusted system instructions;
- return structured draft output with subject, body, warnings, and missing information;
- apply timeouts and bounded retries; and
- avoid inventing facts, dates, promises, or actions.

Provider API keys are never exposed to React or stored in SQLite.

### 4.7 Notification Service

The notification service creates durable notification records and calculates unread counts. SQLite is the source of truth; the UI store is only a cached projection.

The service:

- creates one notification per eligible event;
- prevents duplicate notifications using stable provider identifiers;
- marks items read in a transaction;
- returns the authoritative unread count; and
- emits `notification.created`, `notification.updated`, and `unread_count.changed` events.

## 5. Communication Model

AgentOS uses two local communication paths.

### 5.1 React to Tauri Commands

Typed Tauri commands handle trusted desktop operations:

```text
expand_panel()
collapse_panel()
move_widget(position)
set_launch_at_login(enabled)
get_runtime_connection()
quit_application()
```

These commands should be small and platform-neutral. Their Rust implementations call platform adapters where behavior differs.

### 5.2 React to Python REST API

REST is used for queries and user-initiated commands because it is explicit, testable, and easy to retry safely.

Initial endpoints:

```text
GET    /health
GET    /v1/bootstrap
GET    /v1/notifications
POST   /v1/notifications/{id}/read
POST   /v1/notifications/read-all
GET    /v1/emails/{id}
GET    /v1/drafts/{id}
PUT    /v1/drafts/{id}
POST   /v1/drafts/{id}/approve
POST   /v1/drafts/{id}/cancel
GET    /v1/settings
PUT    /v1/settings
```

`POST /v1/drafts/{id}/approve` must receive the expected draft version and an idempotency key. If the user edits a draft, its version changes and the previous approval becomes invalid.

### 5.3 Python to React WebSocket

A WebSocket carries low-volume real-time events:

```text
service.ready
service.degraded
notification.created
notification.updated
unread_count.changed
draft.created
draft.updated
email.processing_failed
email.send_succeeded
email.send_failed
```

Events contain identifiers and small UI summaries, not full secrets or unnecessary email content. After any disconnect, React calls `/v1/bootstrap` and treats that response as authoritative rather than assuming no events were missed.

### 5.4 Local Transport Security

The Python service must:

- bind only to `127.0.0.1`, never all network interfaces;
- use a free port selected at runtime rather than a public fixed port;
- require a random, short-lived session token created for that application run;
- accept requests only from the packaged application origin;
- validate every request and limit payload sizes; and
- avoid writing the session token to logs or persistent storage.

Tauri starts the sidecar, obtains its readiness information, and makes the endpoint and token available to the WebView through a controlled command.

## 6. Data Storage

### 6.1 SQLite Domain Database

Python is the only process allowed to write the AgentOS SQLite database. A single owner avoids lock contention and inconsistent business rules.

Initial tables:

| Table | Purpose |
|---|---|
| `accounts` | Non-secret provider account metadata and connection status |
| `messages` | Normalized message identifiers, metadata, and processing status |
| `sender_decisions` | Validation result, matched rule, and reason |
| `drafts` | Versioned subject/body, status, warnings, and timestamps |
| `notifications` | Notification content, type, read state, and source reference |
| `workflow_runs` | Current state, retry count, and recoverable error details |
| `send_attempts` | Approval version, idempotency key, provider result, and timestamp |
| `settings` | Non-secret application and workflow preferences |
| `audit_events` | Security-relevant actions and outcomes |

Use foreign keys, unique constraints on provider message IDs, indexes for unread and recent-item queries, and migrations from the first release.

### 6.2 Native Window Preferences

Small native-only preferences may be stored through a Tauri-managed local configuration:

- last valid widget position;
- selected monitor identifier when available;
- selected corner;
- panel dimensions; and
- launch-at-login preference.

On startup, Tauri validates saved coordinates against current monitor work areas before displaying the widget.

### 6.3 Credentials and Secrets

OAuth refresh tokens and API keys must use:

- **macOS:** Keychain;
- **Windows:** Credential Manager or an equivalent Tauri secure-storage plugin.

Secrets must not be stored in SQLite, frontend state, source files, logs, or plain-text configuration.

## 7. Background Monitoring and Email Workflow

Push subscriptions or provider change notifications are preferred. When unavailable, use adaptive polling with backoff and jitter. Do not use a tight loop.

```text
MONITORING
    │
    ▼
NEW_MESSAGE_DETECTED
    │
    ▼
DEDUPLICATING ───────── duplicate ───────► COMPLETED
    │ new
    ▼
VALIDATING_SENDER
    ├── untrusted ───────────────────────► REJECTED
    ├── uncertain ───────────────────────► MANUAL_REVIEW
    │ trusted
    ▼
LOADING_CONTEXT
    │
    ▼
GENERATING_DRAFT
    │
    ▼
AWAITING_APPROVAL
    ├── No ──────────────────────────────► CANCELLED
    ├── Edit ─► save new version ────────► AWAITING_APPROVAL
    │ Yes
    ▼
FINAL_VALIDATION
    │
    ▼
SENDING ───── transient error ───────────► RETRYABLE_FAILURE
    │ success
    ▼
SENT
```

Every transition that affects recovery is committed to SQLite before an event is emitted. After a crash or restart, the service resumes only safe work:

- monitoring may restart automatically;
- draft generation may be retried if no durable draft exists;
- pending approvals remain pending;
- sending is reconciled using the stored idempotency key and provider result;
- approval is never inferred from a timeout or restart.

## 8. Unread Badge Flow

```text
Email/provider event
        │
        ▼
Python deduplicates and processes event
        │
        ▼
SQLite transaction creates notification as unread
        │
        ▼
Python calculates authoritative unread count
        │
        ▼
WebSocket emits notification.created + unread_count.changed
        │
        ▼
React store updates widget badge
        │
        ▼
User opens/views item
        │
        ▼
React calls mark-read REST endpoint
        │
        ▼
SQLite updates read state and Python emits new count
```

Rules:

- opening the panel alone does not mark every item read;
- an item is marked read when it is opened or explicitly cleared;
- duplicate events do not increment the count;
- the badge is hidden at zero and may display `99+` above 99;
- on startup or reconnection, `/v1/bootstrap` recalculates the badge from SQLite.

## 9. Startup, Runtime, and Shutdown

### 9.1 Login Startup

The installed Tauri application registers itself as a per-user login item using a supported cross-platform plugin or isolated platform adapter.

Startup sequence:

1. The operating system launches AgentOS after user login.
2. Tauri enforces a single application instance.
3. Tauri loads and validates native window preferences.
4. Tauri obtains required secrets from secure storage.
5. Tauri starts the platform-specific Python sidecar.
6. The sidecar runs database migrations and recovery checks.
7. Tauri waits for `/health` and readiness with a bounded timeout.
8. React loads `/v1/bootstrap` and opens the event WebSocket.
9. The widget appears with the restored authoritative unread count.
10. Background monitoring begins or resumes.

The widget may show a connecting state if the service is not ready. It must not silently show stale data as current.

### 9.2 Runtime Behavior

- Collapsing the panel hides or resizes the UI window; it does not stop monitoring.
- Closing a panel behaves like collapse.
- Tray/menu-bar **Quit** performs a real application shutdown.
- If the Python service exits unexpectedly, Tauri shows a degraded state and may attempt a bounded restart with backoff.
- Repeated failures require a visible recovery action instead of an infinite restart loop.

### 9.3 Graceful Shutdown

On Quit:

1. stop accepting new workflows;
2. persist safe workflow checkpoints;
3. close provider subscriptions and the WebSocket;
4. close SQLite cleanly;
5. stop the Python sidecar; and
6. exit Tauri.

## 10. Cross-Platform Design

Most code is shared:

- React UI and client state;
- Python workflows, domain models, provider adapters, and persistence;
- SQLite schema and migrations;
- REST and WebSocket contracts; and
- core Tauri command interfaces.

Platform differences are isolated:

| Concern | macOS | Windows | Shared approach |
|---|---|---|---|
| Secure secrets | Keychain | Credential Manager | `SecretStore` interface |
| Login startup | Login item | Startup registration | `AutoStart` interface/plugin |
| Tray integration | Menu-bar conventions | Notification-area conventions | Shared commands, native menus |
| Always on top | macOS window levels and Spaces behavior | Windows topmost behavior | `WindowController` adapter |
| Usable screen area | Menu bar and Dock | Taskbar and work area | Tauri monitor/work-area API |
| Display scaling | Retina scale factor | Per-monitor DPI | Logical coordinates in UI |
| Sidecar binary | macOS architecture-specific executable | `.exe` for supported architecture | Tauri sidecar target bundles |
| Code signing | Apple signing and notarization | Authenticode signing | CI release pipeline |

Implementation rules:

- use logical pixels and validate layout at 100%, 125%, 150%, and Retina scaling;
- test bottom, left, and auto-hidden taskbar or Dock configurations;
- recalculate safe position after monitor, resolution, or scaling changes;
- use explicit native APIs or maintained plugins rather than shell commands;
- avoid OS-specific paths in shared code; and
- package and test signed sidecars separately for each target architecture.

## 11. Failure Handling and Reliability

| Failure | Required behavior |
|---|---|
| Python service unavailable | Show degraded status, preserve UI, retry with bounded backoff |
| Network offline | Keep local data available and resume monitoring when online |
| Provider authorization expired | Stop provider work and request reauthentication |
| Duplicate provider event | Ignore through unique source identifiers |
| AI timeout or invalid output | Preserve email state, show retry/manual-draft option |
| Invalid or uncertain sender | Do not generate a draft; record and show the reason |
| WebSocket disconnect | Reconnect, then refresh authoritative bootstrap state |
| Send API timeout | Reconcile by idempotency key before offering retry |
| App crash during approval | Restore pending draft; never assume approval |
| Database migration failure | Do not monitor or send; show a recoverable error |

## 12. Security Boundaries

- Email content, attachment text, links, and sender-supplied instructions are untrusted.
- Sender validation must happen before AI drafting, but trusted senders do not bypass content safeguards.
- Only the Python send service can call the provider's send endpoint.
- The send service requires a current draft version, explicit approval, final validation, and idempotency key.
- Editing any approved draft invalidates that approval.
- Recipient, subject, and body are shown at confirmation time.
- Logs contain identifiers and outcomes by default, not credentials or full message bodies.
- OAuth scopes use least privilege and are separated where providers permit.
- Local API exposure, dependency updates, code signing, and sidecar integrity are part of the threat model.

## 13. Proposed Codebase Structure

```text
agent-os/
├── docs/
│   ├── product-vision.md
│   ├── 02-product-roadmap.md
│   ├── 03-system-architecture.md
│   └── adr/
├── desktop/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── widget/
│   │   │   ├── notifications/
│   │   │   ├── drafts/
│   │   │   └── settings/
│   │   ├── api/
│   │   ├── events/
│   │   ├── store/
│   │   └── types/
│   └── src-tauri/
│       └── src/
│           ├── commands/
│           ├── platform/
│           ├── sidecar/
│           ├── secrets/
│           └── windows/
├── ai-service/
│   ├── agentos/
│   │   ├── api/
│   │   ├── domain/
│   │   ├── workflows/
│   │   ├── email/
│   │   ├── ai/
│   │   ├── notifications/
│   │   ├── persistence/
│   │   ├── security/
│   │   └── jobs/
│   ├── migrations/
│   └── tests/
├── shared/
│   ├── schemas/
│   └── generated/
├── scripts/
└── README.md
```

OpenAPI and event schemas should be the contract source. Generate TypeScript client types from those schemas instead of manually maintaining duplicate Python and TypeScript models.

## 14. Recommended Implementation Order

1. Record the main choices in Architecture Decision Records.
2. Scaffold React, Tauri, and a minimal Python health service.
3. Make Tauri start and stop the Python sidecar.
4. Add authenticated loopback REST and a WebSocket connectivity test.
5. Build the widget and expanded panel with simulated events.
6. Add SQLite migrations, notifications, and unread state.
7. Prove restart recovery and reconnection behavior.
8. Implement one email provider adapter with a mock provider first.
9. Add sender validation and the durable email state machine.
10. Add AI drafting behind an adapter.
11. Add edit, reconfirm, cancel, and idempotent send behavior.
12. Package, sign, and verify Windows and macOS builds.

## 15. Initial Architecture Decisions to Record

Create separate ADRs for:

- Tauri + React as the cross-platform desktop shell;
- Python as a managed sidecar rather than a remote backend;
- authenticated loopback REST plus WebSocket communication;
- Python as the single SQLite domain-data owner;
- operating-system secure storage for credentials;
- one provider adapter for the first end-to-end release;
- versioned drafts and idempotent send approval; and
- platform adapters for Windows and macOS behavior.

## 16. Architecture Exit Criteria

This architecture phase is complete when:

- component ownership is agreed and reflected in the repository;
- Tauri can manage a packaged Python sidecar on Windows and macOS;
- local REST and WebSocket contracts are specified and authenticated;
- the domain schema and migrations are reviewed;
- the email state machine and approval rules are testable;
- unread state recovers correctly after restart and reconnection;
- secrets never pass through the React application;
- platform-specific behavior is behind documented adapters; and
- the major decisions above have ADRs.
