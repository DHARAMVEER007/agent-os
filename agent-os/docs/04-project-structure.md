# AgentOS Project Structure

**Document status:** Draft  
**Version:** 0.1  
**Date:** 28 July 2026  
**Target platforms:** Windows and macOS  
**Primary stack:** Tauri, React, TypeScript, Rust, Python, FastAPI, SQLite  
**Related documents:** Product Vision, Product Roadmap, System Architecture

## 1. Purpose

This document defines the recommended repository layout and development conventions for AgentOS. Its purpose is to make ownership clear, keep platform-specific code isolated, and give every new feature a predictable home.

The repository is organized as a single product with multiple cooperating parts:

- `desktop/` contains the React interface and Tauri/Rust desktop shell;
- `ai-service/` contains the Python background service and business workflows;
- `shared/` contains language-neutral contracts shared across process boundaries;
- `database/` contains the SQLite schema, migrations, and development fixtures;
- `tests/` contains cross-component and end-to-end tests;
- `docs/` contains product and engineering documentation; and
- `scripts/` contains repeatable development, validation, packaging, and release tasks.

## 2. Repository Design Principles

1. **Organize implementation code by runtime boundary.** React, Rust, and Python have separate homes because they run in different environments and have different responsibilities.
2. **Organize product behavior by feature inside each runtime.** Email, notifications, approvals, settings, and future capabilities should be easy to locate end to end.
3. **Keep shared contracts language-neutral.** TypeScript and Python should generate or validate models from JSON Schema or OpenAPI rather than importing each other's source code.
4. **Keep operating-system differences behind adapters.** Windows and macOS implementations must not be scattered through shared business logic.
5. **Keep generated files out of source folders.** Build output, generated clients, caches, packaged sidecars, and local databases must have defined locations and should not be edited manually.
6. **Never commit secrets or personal mailbox data.** Only safe examples and templates belong in Git.
7. **Start simple.** Create directories when their first real responsibility is implemented; empty architecture should not become maintenance overhead.

## 3. Recommended Initial Folder Tree

```text
agent-os/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.yml
│   │   └── feature.yml
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── desktop/
│   ├── public/
│   │   └── app-icon.svg
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── routes.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── features/
│   │   │   ├── widget/
│   │   │   ├── panel/
│   │   │   ├── notifications/
│   │   │   ├── email/
│   │   │   ├── approvals/
│   │   │   ├── chat/
│   │   │   ├── search/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api/
│   │   │   ├── events/
│   │   │   └── tauri/
│   │   ├── stores/
│   │   ├── styles/
│   │   ├── test/
│   │   ├── types/
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── src-tauri/
│   │   ├── capabilities/
│   │   ├── icons/
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   ├── platform/
│   │   │   ├── sidecar/
│   │   │   ├── state/
│   │   │   ├── tray/
│   │   │   ├── windows/
│   │   │   ├── lib.rs
│   │   │   └── main.rs
│   │   ├── tests/
│   │   ├── build.rs
│   │   ├── Cargo.toml
│   │   ├── Cargo.lock
│   │   └── tauri.conf.json
│   ├── tests/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── ai-service/
│   ├── src/
│   │   └── agentos/
│   │       ├── api/
│   │       │   ├── routes/
│   │       │   ├── dependencies.py
│   │       │   └── websocket.py
│   │       ├── core/
│   │       │   ├── config.py
│   │       │   ├── errors.py
│   │       │   ├── logging.py
│   │       │   └── security.py
│   │       ├── domain/
│   │       │   ├── models/
│   │       │   ├── policies/
│   │       │   └── states/
│   │       ├── features/
│   │       │   ├── notifications/
│   │       │   ├── email/
│   │       │   ├── sender_validation/
│   │       │   ├── drafting/
│   │       │   ├── approvals/
│   │       │   ├── search/
│   │       │   └── settings/
│   │       ├── integrations/
│   │       │   ├── email/
│   │       │   │   ├── base.py
│   │       │   │   ├── gmail/
│   │       │   │   └── microsoft_graph/
│   │       │   ├── ai/
│   │       │   │   ├── base.py
│   │       │   │   └── openai/
│   │       │   └── credentials/
│   │       ├── persistence/
│   │       │   ├── repositories/
│   │       │   ├── sqlite/
│   │       │   └── unit_of_work.py
│   │       ├── services/
│   │       ├── workers/
│   │       ├── application.py
│   │       └── main.py
│   ├── prompts/
│   │   └── email-reply/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── contract/
│   │   ├── fixtures/
│   │   └── conftest.py
│   ├── pyproject.toml
│   ├── uv.lock
│   └── README.md
│
├── shared/
│   ├── openapi/
│   │   └── agentos-api.yaml
│   ├── schemas/
│   │   ├── events/
│   │   ├── notifications/
│   │   ├── email/
│   │   └── approvals/
│   ├── generated/
│   │   ├── typescript/
│   │   └── python/
│   ├── examples/
│   └── README.md
│
├── database/
│   ├── migrations/
│   ├── schema/
│   ├── seeds/
│   ├── fixtures/
│   └── README.md
│
├── tests/
│   ├── e2e/
│   │   ├── desktop/
│   │   └── workflows/
│   ├── smoke/
│   ├── performance/
│   ├── security/
│   ├── fixtures/
│   └── README.md
│
├── scripts/
│   ├── bootstrap/
│   ├── development/
│   ├── generate/
│   ├── quality/
│   ├── packaging/
│   └── release/
│
├── docs/
│   ├── product-vision.md
│   ├── 02-product-roadmap.md
│   ├── 03-system-architecture.md
│   ├── 04-project-structure.md
│   ├── architecture/
│   │   └── decisions/
│   ├── development/
│   ├── operations/
│   ├── security/
│   ├── testing/
│   └── assets/
│       ├── diagrams/
│       ├── wireframes/
│       └── images/
│
├── assets/
│   ├── branding/
│   ├── icons/
│   ├── screenshots/
│   └── store/
│
├── config/
│   ├── development.example.toml
│   ├── test.toml
│   └── logging.example.toml
│
├── .editorconfig
├── .env.example
├── .gitattributes
├── .gitignore
├── .pre-commit-config.yaml
├── AGENTS.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── Taskfile.yml
└── VERSION
```

The tree is a target structure, not a requirement to create every folder immediately. The first implementation milestone only needs the root configuration, `desktop/`, `ai-service/`, `shared/`, `database/`, `docs/`, `scripts/`, and essential tests.

## 4. Directory Responsibilities

### 4.1 `desktop/` — Tauri Desktop Application

This directory produces the installable Windows and macOS application. It contains two related codebases.

#### `desktop/src/` — React and TypeScript

The React application owns presentation and user interaction:

- floating widget and unread badge;
- expanded mobile-sized panel;
- notification list and search;
- email preview and reply editor;
- Yes, No, and Edit approval controls;
- chat/history and settings;
- temporary view state, loading state, and error state; and
- typed calls to the local API, WebSocket, and Tauri commands.

`desktop/src/features/` is the main home for product UI behavior. Each feature may contain its own components, hooks, store slice, types, utilities, and tests:

```text
features/notifications/
├── api/
├── components/
├── hooks/
├── stores/
├── types.ts
├── NotificationList.tsx
└── NotificationList.test.tsx
```

`desktop/src/components/ui/` is only for reusable, domain-neutral primitives such as buttons, dialogs, badges, inputs, and loading indicators. A component that understands email or notification business meaning belongs in the matching feature folder.

`desktop/src/lib/` contains shared infrastructure rather than product features:

- `api/` — generated client configuration, request handling, and session authentication;
- `events/` — WebSocket connection and event dispatch; and
- `tauri/` — typed wrappers around native commands.

#### `desktop/src-tauri/` — Tauri and Rust

The Rust layer owns trusted desktop and operating-system integration:

- always-on-top, frameless, transparent windows;
- widget and panel position, focus, show, hide, and collapse behavior;
- tray or menu-bar integration;
- launch at login;
- native notifications;
- secure access to operating-system credential storage;
- Python sidecar startup, health checking, shutdown, and restart policy; and
- Windows/macOS adapters where behavior differs.

`src-tauri/src/platform/` is the only normal location for platform-specific implementations. Prefer a common trait or interface with `windows` and `macos` implementations over conditionals throughout the codebase.

Rust must not own email, AI, sender-validation, or approval business rules.

### 4.2 `ai-service/` — Python Background and AI Service

This directory contains the long-running application engine. It is packaged as a Tauri sidecar for release and can run directly during development.

The Python service owns:

- inbox monitoring and provider synchronization;
- message deduplication and normalization;
- sender validation;
- email/thread context loading;
- AI draft generation;
- durable notifications and unread counts;
- approval state transitions;
- final send validation and idempotent sending;
- local REST and WebSocket endpoints;
- retry, backoff, rate-limit, and offline behavior; and
- audit events.

Important internal boundaries:

- `api/` translates HTTP/WebSocket requests into application calls. It must not contain business rules.
- `domain/` contains provider-independent models, policies, and state definitions.
- `features/` contains use cases grouped by business capability.
- `integrations/` contains adapters for Gmail, Microsoft Graph, OpenAI, and credential access.
- `persistence/` contains repository implementations and SQLite access.
- `services/` coordinates use cases that span multiple domain areas.
- `workers/` contains long-running monitors, schedulers, and queue consumers.
- `prompts/` contains versioned prompt templates and their documentation. Prompt changes are reviewed like code.

Use the `src` layout so importing `agentos` during tests always exercises the installed package rather than accidentally importing from the repository root.

### 4.3 `shared/` — Cross-Process Contracts

This directory defines the data exchanged between React, Tauri, and Python. It contains contracts, not business logic.

Store here:

- the local FastAPI OpenAPI contract;
- JSON Schemas for real-time events;
- notification, email, draft, approval, and error payload definitions;
- safe example payloads; and
- generated TypeScript/Python contract models if generation is adopted.

Do not place React helpers, Python services, Rust utilities, secrets, or database implementations here.

Contract changes should be backward compatible when practical. A breaking change requires coordinated client/server changes, updated contract tests, and a short Architecture Decision Record when it changes an important boundary.

### 4.4 `database/` — SQLite Design and Evolution

This directory is the source of truth for database evolution:

- `migrations/` — ordered, immutable schema migrations;
- `schema/` — human-readable current schema documentation;
- `seeds/` — deterministic non-personal development data; and
- `fixtures/` — small database states used by integration and migration tests.

The running database file does not belong in this directory or in Git. Production data belongs in the operating system's application-data location. Python is the only writer to the domain database; React and Rust must use the service API.

Once a migration is merged, do not rewrite it. Add a new migration.

### 4.5 `tests/` — Cross-Component Verification

Tests that belong to one runtime stay near that runtime:

- React component and feature tests in `desktop/src/` or `desktop/tests/`;
- Rust unit and integration tests in `desktop/src-tauri/`;
- Python unit, integration, and contract tests in `ai-service/tests/`.

The root `tests/` directory is for behavior crossing those boundaries:

- `e2e/desktop/` — widget, panel, keyboard, focus, and multi-window behavior;
- `e2e/workflows/` — new email through validation, drafting, approval, and sending;
- `smoke/` — packaged application startup and basic health;
- `performance/` — idle CPU, memory, startup, and panel-open measurements;
- `security/` — local API authentication, unsafe input, and secret-leak checks; and
- `fixtures/` — anonymized messages and provider responses used across test suites.

All external email and AI calls should be mocked by default. Tests must never send real email unless they are in an explicitly configured, isolated manual test environment.

### 4.6 `scripts/` — Repeatable Engineering Tasks

Scripts should make common work consistent across local development and continuous integration:

- `bootstrap/` — verify prerequisites and initialize a developer environment;
- `development/` — run the desktop app and Python service together;
- `generate/` — generate contract clients, icons, or version metadata;
- `quality/` — run formatting, linting, type checks, tests, and audits;
- `packaging/` — build the Python sidecar and Tauri bundles; and
- `release/` — prepare signed release artifacts and release notes.

Scripts should be thin, documented, cross-platform where practical, non-destructive by default, and callable through the root task runner. PowerShell and POSIX shell variants may be used only when a portable tool cannot perform the job cleanly.

### 4.7 `docs/` — Product and Engineering Documentation

`docs/` explains what AgentOS is, how it works, and why major decisions were made.

- numbered root documents describe the product and overall design;
- `architecture/decisions/` stores Architecture Decision Records;
- `development/` stores setup and contributor guides;
- `operations/` stores packaging, release, troubleshooting, and recovery procedures;
- `security/` stores threat models, credential handling, and privacy rules;
- `testing/` stores test strategy and manual platform checklists; and
- `assets/` stores diagrams and wireframes used by documentation.

Documentation changes should accompany behavior or architecture changes in the same pull request.

### 4.8 `assets/` — Product and Distribution Media

Root assets are user-facing product resources:

- brand source files;
- application and tray icons;
- screenshots;
- installer artwork; and
- App Store or Microsoft Store media.

Runtime-specific copies may be generated into `desktop/public/` and `desktop/src-tauri/icons/`. Keep the editable source asset in the root `assets/` directory and document the generation command.

Do not use this directory for test fixtures or documentation-only diagrams.

### 4.9 `config/` — Safe Configuration Templates

This directory contains non-secret, environment-specific configuration templates such as polling intervals, feature flags, log levels, and local service settings.

Configuration precedence should be documented and predictable:

```text
built-in defaults
  -> checked-in environment config
  -> local environment variables
  -> user settings stored by AgentOS
```

Files containing access tokens, API keys, OAuth client secrets, mailbox data, or machine-specific paths must not be committed. Provide redacted `.example` files instead.

### 4.10 `.github/` — Collaboration and Automation

This directory standardizes issue reporting, pull-request review, continuous integration, and releases. CI must validate TypeScript, Rust, Python, contracts, and documentation on supported runners.

Release automation should build Windows on Windows and macOS on macOS. Do not assume a bundle built on one operating system is valid for the other.

## 5. Root Configuration Files

| File | Responsibility |
|---|---|
| `README.md` | Product overview, prerequisites, quick start, and links to detailed docs |
| `CONTRIBUTING.md` | Development workflow, commit rules, review expectations, and test commands |
| `SECURITY.md` | Vulnerability reporting and supported-version policy |
| `AGENTS.md` | Instructions for coding agents working in the repository |
| `.gitignore` | Excludes secrets, local databases, build output, logs, caches, and OS files |
| `.gitattributes` | Normalizes line endings and marks binary/generated files |
| `.editorconfig` | Shared whitespace, encoding, and newline defaults |
| `.env.example` | Names documented local variables with safe placeholder values |
| `.pre-commit-config.yaml` | Optional fast checks before a commit |
| `package.json` | Root JavaScript tooling and orchestration commands |
| `pnpm-workspace.yaml` | JavaScript/TypeScript workspace definition |
| `Taskfile.yml` | Cross-language commands such as setup, dev, check, test, and package |
| `VERSION` | Single product version consumed by packaging automation |

Language-specific configuration stays with its runtime:

- TypeScript, Vite, and frontend testing configuration in `desktop/`;
- Cargo and Tauri configuration in `desktop/src-tauri/`; and
- Python dependencies, formatting, linting, typing, and test configuration in `ai-service/pyproject.toml`.

Commit lockfiles for reproducible builds: `pnpm-lock.yaml`, `Cargo.lock`, and the selected Python lockfile.

## 6. Where New Features Should Live

A feature should be implemented as a vertical slice without violating runtime ownership.

For example, an email approval feature may touch:

```text
desktop/src/features/approvals/        # approval user interface
ai-service/src/agentos/features/
  approvals/                           # use cases and state transitions
shared/schemas/approvals/              # API/event contracts
database/migrations/                   # durable state changes
ai-service/tests/                      # Python behavior
desktop/src/features/approvals/        # React tests beside UI code
tests/e2e/workflows/                   # complete user workflow
docs/                                  # behavior and design updates
```

Use these placement rules:

1. **User interface or short-lived view state** goes in `desktop/src/features/<feature>/`.
2. **Native window or OS behavior** goes in `desktop/src-tauri/`, behind `platform/` when it differs by OS.
3. **Business rules and workflows** go in `ai-service/src/agentos/features/<feature>/` or `domain/`.
4. **Third-party SDK code** goes in `ai-service/src/agentos/integrations/<provider>/`.
5. **Public payloads and events** go in `shared/`.
6. **Schema changes** go in `database/migrations/`.
7. **Cross-runtime behavior tests** go in root `tests/`.
8. **Product or architectural decisions** go in `docs/`.

Do not create a general `utils` dumping ground. A helper should stay with its feature until it is genuinely shared. Shared infrastructure belongs in a specifically named module such as `api`, `events`, `time`, or `validation`.

## 7. Naming Conventions

### 7.1 General

- Use clear domain language: `notification`, `email_draft`, `sender_validation`, and `approval`.
- Use the same term across UI, API, database, tests, and documentation.
- Prefer complete words over unexplained abbreviations.
- Name booleans as questions or states: `is_read`, `can_send`, `has_unresolved_placeholders`.
- Include units in names when relevant: `poll_interval_seconds`, `timeout_ms`.

### 7.2 TypeScript and React

- React component files and exported components: `PascalCase.tsx`.
- Hooks: `useSomething.ts`.
- Non-component modules: `camelCase.ts`.
- Variables and functions: `camelCase`.
- Types, interfaces, and enums: `PascalCase`.
- Tests: `*.test.ts` or `*.test.tsx`.
- Avoid default exports for shared components and services; named exports make refactoring safer.

### 7.3 Rust

- Modules, files, functions, and variables: `snake_case`.
- Structs, traits, and enums: `PascalCase`.
- Constants: `SCREAMING_SNAKE_CASE`.
- Keep Tauri command names explicit and action-oriented, such as `collapse_panel` and `set_launch_at_login`.

### 7.4 Python

- Packages, modules, functions, and variables: `snake_case`.
- Classes and exceptions: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Tests: `test_<behavior>.py`.
- Use a leading underscore only for intentionally private implementation details.

### 7.5 Database

- Tables and columns: lowercase `snake_case`.
- Table names: plural nouns, such as `notifications` and `email_drafts`.
- Foreign keys: `<singular_table>_id`.
- Timestamps: `<event>_at`, stored in UTC.
- Migration files: sortable identifier plus action, for example `0001_create_notifications.sql`.

### 7.6 API and Events

- REST paths: lowercase plural nouns, for example `/v1/notifications`.
- JSON fields: `snake_case` for consistency with the Python service.
- Events: `<domain>.<past_tense_action>`, for example `notification.created`, `draft.updated`, and `email.sent`.
- Identifiers: use names that expose scope, such as `notification_id`, not a generic `id` where ambiguity is possible.

## 8. Git and Branching Conventions

Use a lightweight GitHub-flow style:

- `main` is protected and must remain buildable;
- create one short-lived branch for one focused change;
- open a pull request and merge only after required checks and review;
- release from tagged commits on `main`; and
- delete merged branches.

Recommended branch names:

```text
feature/floating-widget
feature/email-approval
fix/unread-count-restart
docs/project-structure
refactor/email-provider-adapter
chore/update-tauri
```

Branch names use lowercase kebab-case after a recognized prefix. Useful prefixes are `feature/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`, and `release/`.

Use small, descriptive commits. Conventional Commit style is recommended:

```text
feat(widget): add collapsed unread badge
fix(email): prevent duplicate reply sends
docs(architecture): record local API decision
test(approval): cover reconfirmation after edit
```

Do not mix broad formatting, dependency upgrades, refactoring, and feature behavior in one commit or pull request unless they are inseparable.

## 9. Development Conventions

### 9.1 Definition of Done

A change is complete when:

- behavior and acceptance criteria are satisfied;
- relevant TypeScript, Rust, Python, contract, and end-to-end tests pass;
- formatters, linters, and type checks pass;
- Windows and macOS impact has been considered;
- error, offline, restart, and duplicate-event behavior has been considered;
- no secrets or personal data were added;
- documentation and example configuration are updated; and
- user-visible behavior has a concise changelog or release-note entry when appropriate.

### 9.2 Dependency Rules

- Prefer standard-library or existing-project solutions before adding a dependency.
- Pin and lock dependencies.
- Keep provider SDKs behind adapters.
- Document why security-sensitive or native dependencies are required.
- Review licenses and maintenance status before adoption.
- Update dependencies in focused pull requests with verification.

### 9.3 Configuration and Secrets

- Use `.env.example` only as documentation for development variables.
- Put developer values in ignored local files.
- Store production credentials through macOS Keychain or Windows Credential Manager.
- Never expose provider or AI keys to React.
- Never log access tokens, authorization headers, full email bodies, or sensitive prompts by default.

### 9.4 Logging and Errors

- Use structured logs with timestamp, severity, component, event name, and correlation ID.
- Prefer safe identifiers and status information over message content.
- Define typed/domain errors in one place per runtime.
- Translate internal errors into stable public error responses at the API boundary.
- Show actionable, non-technical messages in the UI while retaining safe diagnostic context locally.

### 9.5 Generated and Runtime Files

The following must be ignored and reproducible:

- `node_modules/`, frontend build output, and test coverage;
- Rust `target/`;
- Python virtual environments, caches, coverage, and packaged sidecars;
- generated API clients unless the team intentionally commits them;
- local SQLite databases and journals;
- logs, crash reports, and temporary files;
- `.env` and machine-local configuration;
- macOS `.DS_Store` and Windows thumbnail/desktop files.

## 10. Recommended Initial Implementation Order

Create and verify the repository in this order:

1. root `README.md`, ignore rules, editor settings, task runner, and contribution guide;
2. `desktop/` with a minimal Tauri + React + TypeScript application;
3. `ai-service/` with a minimal FastAPI health endpoint and tests;
4. Tauri-managed Python sidecar lifecycle for development;
5. `shared/` with the first health/event contract;
6. simulated notification flow from Python to the React badge;
7. SQLite migration framework and notification persistence;
8. floating widget and expanded panel behavior;
9. sender-validation and email-provider interfaces with test doubles;
10. one live email provider;
11. AI draft generation and the Yes/No/Edit approval state machine; and
12. Windows and macOS packaging, smoke tests, and release automation.

This order proves each boundary before adding live mailbox access or AI costs.

## 11. Initial Repository Setup Checklist

- [ ] Initialize Git and protect `main`
- [ ] Add root README, contribution, security, ignore, and editor files
- [ ] Select and document supported Node.js, Rust, and Python versions
- [ ] Create the Tauri + React + TypeScript desktop application
- [ ] Create the Python package using the `src` layout
- [ ] Add one root command for setup, development, checks, tests, and packaging
- [ ] Add formatting, linting, typing, and unit-test tools for all three languages
- [ ] Add the first OpenAPI or JSON Schema contract
- [ ] Add CI jobs for Windows and macOS
- [ ] Add secret scanning and dependency audit checks
- [ ] Add the SQLite migration convention
- [ ] Add simulated notification and email fixtures
- [ ] Verify that no runtime database, token, or personal email content is tracked
- [ ] Record major setup choices as Architecture Decision Records

## 12. Structure Review Rule

This structure should evolve with demonstrated needs. Before adding a new top-level directory, answer:

1. Does the content belong to an existing runtime, feature, test, documentation, asset, configuration, or script directory?
2. Does the new directory represent a durable architectural boundary?
3. Can a new contributor understand its ownership without tribal knowledge?
4. Does it avoid duplicating a source of truth?

If the new boundary is important and long-lived, document the decision in `docs/architecture/decisions/`.
