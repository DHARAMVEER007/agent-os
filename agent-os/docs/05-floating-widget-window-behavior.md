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

## Expanding into the panel

The widget and the panel share one window. `set_widget_expanded` resizes it
between the 104 × 104 robot and the 400 × 700 panel.

Three rules keep that resize correct:

- The new position is computed from the requested size instead of the window's
  reported size. A size change is not observable through `outer_size` until the
  platform applies it, so reading it back anchors the panel using the collapsed
  dimensions and pushes most of the panel off screen.
- The requested size is clamped to the monitor work area minus its margins, so
  a 700-pixel panel still fits a short display.
- Measurements use the monitor the window currently sits on, so a widget dragged
  to a second display is placed against that display's work area.

## Staying where the user put it

The widget is only positioned in the default bottom-right corner at startup.
After that its position belongs to the user, so `WidgetLayout` remembers where
the collapsed widget sat before it expanded:

- Expanding holds the window's bottom-right corner still, so the panel grows
  away from the corner the widget already occupies instead of jumping.
- Collapsing returns the widget to the remembered position rather than to the
  default corner.
- A panel that the user dragged while it was open carries that movement over,
  so the widget collapses to the corner of wherever the panel ended up.

Positions that would land outside the work area are clamped back inside, which
is why the remembered position is stored rather than recalculated: a panel
clamped against the top of the screen would otherwise drag the widget downwards
on every expand and collapse cycle.

## Surviving a restart

The remembered position is written to `widget-layout.json` in the application
config directory and read back during setup, so the widget reappears where the
user left it instead of in the default corner.

Three details make that safe:

- A missing or unreadable file is treated the same as a first run. A saved
  position is a convenience, so a corrupt file must not stop the app from
  starting.
- The loaded position is clamped to the current work area. A display that was
  unplugged or changed resolution between runs cannot strand the widget off
  screen.
- Dragging emits a continuous stream of move events, so those only update the
  remembered position in memory. The file is written when the widget expands or
  collapses and once more when the application exits.

## Dragging versus opening

The collapsed robot is both a drag handle and a button, so a press alone cannot
decide which the user meant. The widget waits until the pointer has travelled
past a small threshold before handing the gesture to the native drag, and a
gesture that became a drag does not also open the panel.

## Manual verification

1. Start AgentOS with `pnpm tauri dev`.
2. Open a normal application window and maximize it; the robot must remain
   visible above the window.
3. Put an application into native macOS full-screen mode; after the Space
   transition, the robot must remain visible.
4. Switch between multiple desktop and full-screen Spaces; the robot must
   remain available.
5. Drag the robot and confirm dragging still works and does not open the panel.
6. Click the robot without moving it; the panel must open fully inside the
   bottom-right corner of the work area.
7. Collapse with the panel control and with `Esc`; the robot must return to the
   position it had before expanding, not to the default corner.
8. Drag the robot to the top-left, expand, and collapse; the robot must still
   come back to the top-left even though the panel was clamped on screen.
9. Drag the expanded panel, then collapse; the robot must appear at the panel's
   last corner.
10. Drag the robot, quit from the tray, and start AgentOS again; the robot must
    reappear where it was left.

Windows topmost behavior still needs to be checked on a Windows machine before
this milestone is considered cross-platform verified.
