# Floating Widget Window Behavior

## Current foundation

The compact AgentOS widget is one transparent, frameless Tauri window. Shared
window setup makes it always-on-top, visible on every workspace, and positions
it inside the primary monitor's bottom-right work area.

## Why macOS needs an extra rule

On macOS, a native full-screen application lives in a separate Space.
Always-on-top controls a window's level, but Tauri's generic macOS
implementation uses the ordinary floating-palette level. That level can still
sit underneath a native full-screen application. It also does not by itself
allow the window to participate in another application's full-screen Space.

The macOS adapter therefore combines three native collection behaviors:

- `CanJoinAllSpaces` makes the widget available across normal desktop Spaces.
- `FullScreenAuxiliary` allows it to accompany another application's
  full-screen window.
- `CanJoinAllApplications` marks it as a system-style floating overlay that
  may accompany other applications, including in Stage Manager.

The adapter also assigns `NSStatusWindowLevel`, which is higher than Tauri's
ordinary floating-window level, and brings the widget forward without making
it the key window. Keeping the widget non-key prevents it from stealing typing
focus from the user's active application.

This native rule is isolated in `desktop/src-tauri/src/platform/macos.rs`.
Windows continues to use Tauri's shared always-on-top behavior, so AppKit
details do not leak into cross-platform code.

## Manual verification

1. Start AgentOS with `pnpm tauri dev`.
2. Open a normal application window and maximize it; the robot must remain
   visible above the window.
3. Put an application into native macOS full-screen mode; after the Space
   transition, the robot must remain visible.
4. Switch between multiple desktop and full-screen Spaces; the robot must
   remain available.
5. Drag the robot and confirm dragging still works.

Windows topmost behavior still needs to be checked on a Windows machine before
this milestone is considered cross-platform verified.
