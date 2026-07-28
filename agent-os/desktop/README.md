# AgentOS Desktop

The AgentOS desktop application is a Tauri 2 shell with a React and TypeScript
interface. React owns presentation and short-lived view state; Rust owns trusted
native desktop integration. Email, AI, durable notification state, and workflow
rules will live in the separate Python service.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer
- the current stable Rust toolchain
- the platform prerequisites from the
  [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/)

## Install and run

```sh
pnpm install
pnpm tauri dev
```

For a browser-only frontend preview:

```sh
pnpm dev
```

## Quality checks

```sh
pnpm check
```

Individual commands are available for formatting, linting, type checking,
tests, the frontend build, and the native Tauri build.

## Source boundaries

- `src/app/` composes the application.
- `src/features/` contains product-facing UI behavior.
- `src/lib/` contains shared API, event, and Tauri infrastructure.
- `src/styles/` contains application-wide presentation.
- `src-tauri/` contains Rust commands and native desktop configuration.

Keep provider credentials, email/AI calls, domain persistence, and workflow
decisions out of React and Rust.

## Transparent macOS window

The collapsed robot widget uses a transparent native window. Tauri requires
`app.macOSPrivateApi` for transparent WebViews on macOS. This keeps the robot
background invisible, but applications using this private API are not eligible
for distribution through the Mac App Store. Directly signed and notarized macOS
distribution remains the intended packaging path unless this window strategy is
revisited.
