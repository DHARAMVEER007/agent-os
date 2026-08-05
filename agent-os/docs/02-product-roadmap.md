# AgentOS Product Roadmap

**Document status:** Active  
**Product:** AgentOS  
**Target platforms:** Windows and macOS  
**Primary stack:** Tauri, React, TypeScript, Rust, Python, FastAPI, SQLite  
**Roadmap approach:** Milestone-based; complete and verify each phase before expanding scope

## 1. Roadmap Purpose

This roadmap turns the AgentOS product vision into an ordered implementation plan. It is designed for both product delivery and hands-on learning.

AgentOS will be a lightweight, cross-platform desktop AI assistant that:

- remains available through a persistent floating widget;
- monitors connected services in the background;
- displays notifications and unread counts;
- validates email senders before generating drafts;
- generates context-aware email replies;
- requires explicit user approval before sending an email;
- can later support calendars, Teams, Slack, GitHub, files, voice, and other capabilities.

## 2. Product Principles

Every phase must follow these principles:

- [ ] **Cross-platform first:** Windows and macOS behavior is designed and tested together.
- [ ] **Human in control:** Sensitive actions require explicit confirmation.
- [ ] **Privacy by design:** Store credentials securely and send only necessary data to external services.
- [ ] **Lightweight by default:** Minimize idle CPU use, memory use, wake-ups, and startup time.
- [ ] **Modular architecture:** UI, desktop integration, background processing, AI, and external services remain separate.
- [ ] **Reliable state:** The application restores important state after restart or failure.
- [ ] **Extensible capabilities:** New integrations can be added without redesigning the core.
- [ ] **Learning alongside delivery:** Each phase includes concepts to understand, implement, test, and review.

## 3. Version 1 Scope

### Included

- [ ] Persistent bottom-right floating widget
- [ ] Always-on-top behavior
- [ ] Expandable panel approximately 400 × 700 pixels
- [ ] Notification list, chat/history, actions, search, and settings
- [ ] Background monitoring while the panel is collapsed
- [ ] Read/unread notification state and badge count
- [ ] State restoration and launch on login
- [ ] One email provider for the first end-to-end release
- [ ] Sender validation before reply drafting
- [ ] AI-generated reply drafts
- [ ] Yes, No, and Edit approval flow
- [ ] Explicit reconfirmation after an edit
- [ ] Duplicate-send protection and audit history
- [ ] Windows and macOS packaging

### Deferred Until After Version 1

- [ ] Multiple email providers enabled simultaneously
- [ ] Calendar integrations
- [ ] Teams, Slack, GitHub, and Jira integrations
- [ ] Local file search and RAG
- [ ] Voice input and output
- [ ] Local LLM support
- [ ] User-defined automation builder
- [ ] Mobile applications
- [ ] Automatic sending without user approval

## 4. Delivery Strategy

Build AgentOS as a sequence of working vertical milestones. Each phase should end with:

- a runnable result;
- tests or a documented verification checklist;
- updated documentation;
- a short review of what was learned;
- no unresolved blocker that prevents the next phase.

Do not add live email or AI integrations until the desktop shell, local event flow, and notification model work with simulated data.

---

## Phase 0 — Product Vision and Requirements

**Goal:** Agree on the problem, users, scope, behavior, and success criteria before implementation.

### Product Work

- [x] Define the AgentOS vision
- [x] Establish Windows and macOS as Version 1 platforms
- [x] Define the persistent floating-widget experience
- [x] Define email monitoring and reply approval as the first capability
- [ ] Review and finalize the Version 1 scope
- [ ] Define primary user personas and top workflows
- [ ] Write functional requirements
- [ ] Write non-functional requirements
- [ ] Define privacy and security expectations
- [ ] Define measurable success criteria
- [ ] Create a glossary for key terms such as event, notification, draft, approval, and capability

### Learning Focus

- Product vision versus implementation details
- Functional versus non-functional requirements
- MVP scope and prioritization
- Acceptance criteria

### Deliverables

- [x] Product Vision document
- [x] Product Roadmap document
- [ ] Version 1 requirements checklist
- [ ] Initial risk register

### Exit Criteria

- [ ] Version 1 scope is explicit and agreed
- [ ] Sensitive actions requiring confirmation are documented
- [ ] Windows and macOS requirements are included
- [ ] Deferred features are clearly separated from Version 1

---

## Phase 1 — System Architecture and Technical Design

**Goal:** Define how the desktop UI, native shell, Python service, storage, AI, and integrations work together.

### Architecture Work

- [ ] Define component boundaries:
  - [ ] React and TypeScript UI
  - [ ] Tauri desktop shell
  - [ ] Rust native commands and OS integration
  - [ ] Python/FastAPI background and AI service
  - [ ] SQLite persistence
  - [ ] Email provider adapter
  - [ ] OpenAI adapter
- [ ] Define communication between React, Tauri, and Python
- [ ] Decide where the Python service runs and how Tauri manages its lifecycle
- [ ] Define HTTP commands and real-time event delivery
- [ ] Define a normalized event and notification model
- [ ] Define the email-processing state machine
- [ ] Define sender-validation policy and outcomes
- [ ] Define credential and token storage
- [ ] Define audit logging and data-retention rules
- [ ] Define error handling, retry, and offline behavior
- [ ] Isolate Windows- and macOS-specific behavior behind platform adapters
- [ ] Create threat model for email, AI prompts, tokens, and local APIs
- [ ] Record major decisions as Architecture Decision Records

### Required State Flow

```text
New email
  -> deduplicate
  -> validate sender
  -> reject or flag invalid sender
  -> load safe conversation context
  -> generate reply draft
  -> notify user
  -> await Yes / No / Edit
  -> reconfirm edited draft
  -> send once
  -> record outcome
```

### Learning Focus

- Separation of concerns
- Process boundaries and inter-process communication
- Event-driven architecture
- State machines
- Security boundaries and threat modeling

### Deliverables

- [ ] High-level architecture diagram
- [ ] Component responsibility document
- [ ] Email reply state-machine diagram
- [ ] Initial API and event contracts
- [ ] Initial database design
- [ ] Security and privacy design
- [ ] Architecture Decision Records

### Exit Criteria

- [ ] Each component has a clear responsibility
- [ ] UI code does not directly access email or AI provider credentials
- [ ] The Python service lifecycle is defined
- [ ] Platform-specific behavior is isolated
- [ ] Failure, restart, and duplicate-event behavior is documented

---

## Phase 2 — Repository and Project Setup

**Goal:** Create a clean, reproducible development environment and a runnable cross-platform skeleton.

### Project Work

- [ ] Create the repository structure:

```text
agent-os/
├── docs/
├── desktop/          # Tauri + React + TypeScript
├── ai-service/       # Python + FastAPI
├── shared/           # Shared schemas and generated types
├── scripts/
└── README.md
```

- [ ] Initialize Git and define the branching/commit approach
- [ ] Scaffold React with TypeScript
- [ ] Add Tauri and verify a desktop build
- [ ] Scaffold the Python service
- [ ] Add environment configuration without committing secrets
- [ ] Add formatting, linting, and type checking
- [ ] Add unit-test foundations for TypeScript, Rust, and Python
- [ ] Add repeatable development commands
- [ ] Add basic continuous integration for Windows and macOS
- [ ] Document prerequisites and setup steps
- [ ] Verify the starter application on both target operating systems

### Learning Focus

- Repository structure
- TypeScript and React fundamentals
- Rust and Tauri project anatomy
- Python environments and FastAPI basics
- Git, linting, testing, and continuous integration

### Deliverables

- [ ] Runnable Tauri desktop application
- [ ] Runnable local Python health endpoint
- [ ] Desktop-to-service connectivity check
- [ ] Developer setup guide
- [ ] Windows and macOS CI checks

### Exit Criteria

- [ ] A new developer can set up the project from the README
- [ ] Desktop and Python services run together
- [ ] Linting, type checks, and starter tests pass
- [ ] No secrets are stored in source control
- [ ] Builds are verified on Windows and macOS

---

## Phase 3 — Core Desktop UI

**Goal:** Deliver the persistent desktop experience without real email or AI dependencies.

### Floating Widget

- [x] Create the compact agent icon window
- [x] Position it in the bottom-right safe area
- [x] Make it frameless and visually lightweight
- [x] Keep it always on top without stealing focus unnecessarily
- [x] Add an unread badge with support for multi-digit counts
- [ ] Make the widget draggable if enabled in settings — dragging works, the setting does not exist yet
- [x] Save and restore widget position

### Expanded Panel

- [x] Expand from the widget into an approximately 400 × 700 panel
- [x] Keep the panel anchored to the selected screen corner
- [ ] Add notification, conversation, search, actions, and settings views — notifications only so far
- [ ] Collapse on outside click
- [x] Collapse when `Esc` is pressed
- [ ] Return focus appropriately after collapse
- [ ] Add keyboard navigation and accessible labels
- [ ] Add responsive behavior for small screens and display scaling

### Native Desktop Behavior

- [x] Add a system tray/menu-bar entry
- [ ] Add show, hide, settings, and quit actions — show and quit only
- [ ] Handle multiple monitors
- [ ] Keep windows inside the usable screen area
- [ ] Handle resolution, scaling, dock, and taskbar changes
- [ ] Verify window behavior on Windows and macOS

### Learning Focus

- React components, props, state, and hooks
- TypeScript types and interfaces
- CSS layouts, animation, and responsive design
- Tauri window APIs
- Accessibility and cross-platform UX differences

### Deliverables

- [ ] Polished floating widget
- [x] Expandable mobile-sized panel
- [x] Mock notification list and badge
- [ ] System tray/menu-bar controls
- [ ] Cross-platform UI verification notes

### Exit Criteria

- [ ] Widget remains visible while other applications are active
- [ ] Panel opens and closes reliably
- [ ] The UI does not interfere with normal work
- [ ] Multi-monitor and display-scaling cases work
- [ ] Idle UI resource usage meets the initial performance target

---

## Phase 4 — Background Engine and Local Persistence

**Goal:** Run a reliable local service that continues processing when the UI is collapsed.

### Engine Work

- [ ] Start and stop the Python service with the desktop application
- [ ] Add a health check and readiness state
- [ ] Implement graceful shutdown
- [ ] Implement structured logging
- [ ] Define an internal event bus
- [ ] Add background job scheduling
- [ ] Add retry with bounded exponential backoff
- [ ] Add event deduplication
- [ ] Add failure recovery after application restart
- [ ] Prevent multiple conflicting service instances

### Persistence Work

- [ ] Add SQLite migrations
- [ ] Create tables for:
  - [ ] notifications;
  - [ ] source events;
  - [ ] email metadata;
  - [ ] reply draft versions;
  - [ ] approval decisions;
  - [ ] settings;
  - [ ] audit events.
- [ ] Create repository/data-access abstractions
- [ ] Persist processing state transactionally
- [ ] Add retention and cleanup policies
- [ ] Restore state at startup

### Learning Focus

- Python async programming
- Background workers and scheduling
- SQLite schema design and migrations
- Idempotency and retry strategies
- Observability and structured logs

### Deliverables

- [ ] Managed background service
- [ ] Versioned local database
- [ ] Simulated event producer
- [ ] Restart and recovery test
- [ ] Basic diagnostics view or log export

### Exit Criteria

- [ ] Monitoring continues while the UI is collapsed
- [ ] Restarting does not lose or duplicate processed events
- [ ] Service failures are visible and recoverable
- [ ] State changes are persisted safely

---

## Phase 5 — Notification System

**Goal:** Move normalized events from the background engine to the desktop UI in real time.

### Notification Work

- [ ] Define notification categories and severity
- [ ] Create real-time service-to-UI event delivery
- [ ] Persist notifications before displaying them
- [ ] Increment the badge only for new unread items
- [ ] Mark individual notifications as read
- [ ] Add mark-all-read behavior
- [ ] Recalculate unread count from stored state
- [ ] Prevent duplicate badge increments
- [ ] Add notification list pagination or virtualization
- [ ] Add filtering and search
- [ ] Add notification actions
- [ ] Add optional native OS notifications
- [ ] Respect quiet hours and notification preferences

### Learning Focus

- WebSockets or event streams
- Client-side state management
- Derived state and data consistency
- Search, pagination, and list performance

### Deliverables

- [ ] Live simulated notifications
- [ ] Accurate read/unread badge
- [ ] Searchable notification history
- [ ] Notification preference controls

### Exit Criteria

- [ ] Badge state stays correct across restart
- [ ] Duplicate events do not increase the count
- [ ] Opening or marking an item updates the count immediately
- [ ] Large notification lists remain responsive

---

## Phase 6 — Email Integration and Sender Validation

**Goal:** Connect one email provider, monitor the inbox continuously, and process only trusted senders.

### Provider Decision

- [ ] Select the first provider:
  - [ ] Gmail API; or
  - [ ] Microsoft Graph.
- [ ] Document why the provider was selected
- [ ] Define the provider adapter interface so another provider can be added later

### Authentication and Monitoring

- [ ] Implement OAuth 2.0 authorization
- [ ] Store refresh tokens in the operating system credential store
- [ ] Add account connection and disconnection
- [ ] Subscribe to push/change notifications where practical
- [ ] Add safe polling fallback
- [ ] Handle expired authorization and reconnect flows
- [ ] Fetch message metadata, body, thread context, and attachment metadata
- [ ] Normalize provider-specific data
- [ ] Deduplicate messages by stable provider identifiers

### Sender Validation

- [ ] Define trusted address rules
- [ ] Define trusted domain rules
- [ ] Add approved contacts or allowlist support
- [ ] Add blocklist support
- [ ] evaluate provider spam/phishing signals when available
- [ ] Treat email authentication results as signals, not identity proof
- [ ] Record the validation result and reason
- [ ] Do not generate a reply when validation fails
- [ ] Surface rejected or uncertain senders for manual review
- [ ] Make validation rules configurable

### Learning Focus

- OAuth 2.0
- Gmail API or Microsoft Graph
- Push notifications and polling
- Email threading and MIME content
- Sender trust, SPF, DKIM, DMARC, and phishing limitations

### Deliverables

- [ ] Connected email account
- [ ] Continuous new-email monitoring
- [ ] Normalized email records
- [ ] Configurable sender-validation rules
- [ ] Manual-review path for invalid or uncertain senders

### Exit Criteria

- [ ] New messages appear without opening the email client
- [ ] Previously processed messages are not processed again
- [ ] Invalid senders never reach automatic draft generation
- [ ] Credentials are not stored in plain text
- [ ] Disconnecting an account revokes or removes local access

---

## Phase 7 — AI Reply Engine and Human Approval

**Goal:** Generate safe, useful reply drafts for validated senders and send only after explicit approval.

### Draft Generation

- [ ] Define a structured reply-generation request and response
- [ ] Include the current message and only necessary thread context
- [ ] Add system instructions for tone, accuracy, and non-fabrication
- [ ] Detect missing information and use visible placeholders or questions
- [ ] Produce subject and body separately
- [ ] Add confidence and warning flags
- [ ] Reject prompt instructions that attempt to override AgentOS safety rules
- [ ] Redact or minimize sensitive data where appropriate
- [ ] Save the generated draft as a versioned record
- [ ] Add timeout, retry, and manual-draft fallback behavior

### Approval Experience

- [ ] Show recipient, subject, body, validation result, and warnings
- [ ] Display: “I am going to send this reply.”
- [ ] Add **Yes, send**
- [ ] Add **No, cancel**
- [ ] Add **Edit reply**
- [ ] Open an editor with the current subject and body
- [ ] Save each edited version
- [ ] Return to confirmation after editing
- [ ] Require explicit confirmation after every edit
- [ ] Treat closing the panel as no approval

### Safe Sending

- [ ] Validate recipient, subject, and body before sending
- [ ] Block empty drafts and unresolved placeholders
- [ ] Verify the recipient has not changed unexpectedly
- [ ] Use an idempotency key to prevent duplicate sends
- [ ] Disable repeated send clicks while a send is in progress
- [ ] Show sending, sent, failed, and retry states
- [ ] Store provider response and final timestamp
- [ ] Record an audit trail without logging unnecessary message content

### Quality Evaluation

- [ ] Create a representative email test set
- [ ] Test questions, scheduling requests, status requests, and ambiguous messages
- [ ] Test malicious prompt-injection content inside emails
- [ ] Test missing context and attachment references
- [ ] Review tone, factuality, relevance, and completeness
- [ ] Compare generated drafts with user-edited versions

### Learning Focus

- OpenAI API integration
- Prompt design and structured outputs
- Human-in-the-loop workflows
- Prompt-injection defenses
- Idempotent actions and auditability
- AI quality evaluation

### Deliverables

- [ ] AI-generated draft for validated emails
- [ ] Yes / No / Edit confirmation flow
- [ ] Reconfirmation after edits
- [ ] Safe, idempotent send operation
- [ ] Draft quality evaluation report

### Exit Criteria

- [ ] No email is sent without explicit user confirmation
- [ ] Failed sender validation prevents draft generation
- [ ] Editing never triggers automatic sending
- [ ] Double-clicking cannot send twice
- [ ] AI failures leave the user with a clear manual path
- [ ] Audit records explain what happened without exposing unnecessary sensitive content

---

## Phase 8 — Hardening, Packaging, and Version 1 Release

**Goal:** Prepare a secure, stable, efficient release for Windows and macOS.

### Reliability and Performance

- [ ] Measure idle CPU and memory use
- [ ] Reduce unnecessary polling and background wake-ups
- [ ] Test long-running behavior
- [ ] Test offline, sleep, wake, and network-reconnect behavior
- [ ] Test database corruption and safe recovery strategy
- [ ] Test email provider and AI service outages
- [ ] Add crash reporting with privacy controls

### Security

- [ ] Complete threat-model review
- [ ] Review local API exposure and authentication
- [ ] Review credential storage
- [ ] Review log redaction
- [ ] Review dependency vulnerabilities
- [ ] Verify least-privilege permissions
- [ ] Add a clear data-deletion flow

### Cross-Platform Packaging

- [ ] Configure Windows installer
- [ ] Configure macOS application bundle
- [ ] Add application icons and metadata
- [ ] Configure code signing
- [ ] Configure macOS notarization
- [ ] Configure launch-on-login behavior for both platforms
- [ ] Test installation, upgrade, and uninstall
- [ ] Test on supported Windows versions
- [ ] Test on supported macOS versions
- [ ] Publish release notes and known limitations

### Learning Focus

- Performance profiling
- Desktop application security
- Code signing and notarization
- Installers, upgrades, and release management

### Deliverables

- [ ] Signed Windows build
- [ ] Signed and notarized macOS build
- [ ] Installation and upgrade guide
- [ ] Security and privacy notes
- [ ] Version 1 release checklist

### Exit Criteria

- [ ] Core workflows pass end-to-end testing on both platforms
- [ ] Application starts on login when enabled
- [ ] State is restored after restart
- [ ] Idle resource use is within the agreed target
- [ ] Installation, upgrade, and uninstall are verified
- [ ] No open critical security or data-loss issue remains

---

## Phase 9 — Future Capabilities

**Goal:** Evolve AgentOS from an email assistant into an extensible desktop agent platform.

Each capability should use the same event, notification, approval, audit, and settings foundations.

### Additional Integrations

- [ ] Add the second email provider
- [ ] Add Google and Microsoft calendars
- [ ] Add Teams and Slack
- [ ] Add GitHub and Jira
- [ ] Add local file and document search

### Intelligence

- [ ] Add RAG over approved knowledge sources
- [ ] Add optional local LLM support
- [ ] Add personalization based on explicit user preferences
- [ ] Add learning from user edits with clear consent and controls
- [ ] Add multilingual understanding and replies

### Interaction

- [ ] Add voice input and output
- [ ] Add screenshot and OCR understanding
- [ ] Add global keyboard shortcuts
- [ ] Add user-configurable notification rules

### Platform Extensibility

- [ ] Define a capability/plugin interface
- [ ] Add MCP-based tools where appropriate
- [ ] Add a permission model for capabilities
- [ ] Add user-defined workflows and automations
- [ ] Add per-action approval policies without weakening safe defaults

### Possible Later Platforms

- [ ] Evaluate Linux support
- [ ] Evaluate companion mobile applications
- [ ] Evaluate secure cross-device state synchronization

---

## 5. Cross-Phase Workstreams

These activities continue throughout all phases.

### Documentation

- [ ] Keep architecture and setup documents current
- [ ] Record major technical decisions
- [ ] Add diagrams for complex flows
- [ ] Maintain troubleshooting guidance
- [ ] Update the roadmap after milestone reviews

### Testing

- [ ] Add unit tests with each module
- [ ] Add integration tests at process boundaries
- [ ] Add end-to-end tests for critical workflows
- [ ] Maintain Windows and macOS test coverage
- [ ] Add regression tests for every important defect

### Security and Privacy

- [ ] Review new data collection before implementation
- [ ] Minimize stored and transmitted data
- [ ] Keep secrets out of code and logs
- [ ] Require approval for sensitive actions
- [ ] Review third-party dependencies and permissions

### Learning Journal

- [ ] Record what was learned in each phase
- [ ] Explain important concepts in plain language
- [ ] Complete one small exercise before moving on
- [ ] Review the implementation and identify improvements
- [ ] Document mistakes and decisions for future reference

## 6. Milestone Dependency Map

```text
Product Vision
  -> Architecture
  -> Project Setup
  -> Core Desktop UI
  -> Background Engine
  -> Notification System
  -> Email Integration
  -> AI Reply Engine
  -> Hardening and Version 1 Release
  -> Future Capabilities
```

The desktop UI and background-engine work may overlap after the initial contracts are stable. Live email integration depends on reliable background processing and notifications. Safe AI reply sending depends on email integration, sender validation, persistent state, and the approval state machine.

## 7. Version 1 End-to-End Acceptance Scenario

- [ ] User installs AgentOS on Windows or macOS
- [ ] User connects an email account through OAuth
- [ ] User configures trusted sender rules
- [ ] AgentOS starts on login and displays the floating widget
- [ ] A new email arrives while the panel is collapsed
- [ ] The background engine detects and deduplicates it
- [ ] AgentOS validates the sender and records the reason
- [ ] For a valid sender, AgentOS generates and stores a reply draft
- [ ] The widget badge increases
- [ ] User opens the panel and reviews the notification
- [ ] User can cancel, edit, or approve the draft
- [ ] An edited draft returns to confirmation
- [ ] AgentOS sends only after the user selects **Yes, send**
- [ ] Duplicate interaction cannot send the message twice
- [ ] The final state remains correct after restarting the application
- [ ] For an invalid sender, no automatic draft is generated

## 8. Definition of Done for Every Roadmap Item

An item is complete only when:

- [ ] Implementation is finished
- [ ] Relevant tests pass
- [ ] Windows and macOS impact has been considered
- [ ] Error and empty states are handled
- [ ] Security and privacy impact has been reviewed
- [ ] Documentation is updated
- [ ] The behavior has been manually verified
- [ ] No known critical defect remains

## 9. Recommended Starting Point

Begin with the remaining Phase 0 tasks:

1. Finalize Version 1 requirements and success measures.
2. Create the initial risk register.
3. Start Phase 1 with the component architecture and email state machine.
4. Record the first architecture decisions before scaffolding code.

This sequence keeps the project teachable, testable, and extensible while moving steadily toward a working AgentOS Version 1.
