import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function isRunningInTauri() {
  return "__TAURI_INTERNALS__" in window;
}

export async function setWidgetExpanded(expanded: boolean): Promise<void> {
  if (!isRunningInTauri()) {
    return;
  }

  await invoke("set_widget_expanded", { expanded });
}

export function startWindowDrag(): void {
  if (!isRunningInTauri()) {
    return;
  }

  void getCurrentWindow().startDragging();
}

/// Collapses the panel when the user clicks into another application.
export async function onWindowBlur(handler: () => void): Promise<() => void> {
  if (!isRunningInTauri()) {
    return () => {};
  }

  return getCurrentWindow().onFocusChanged(({ payload: focused }) => {
    if (!focused) {
      handler();
    }
  });
}

/// Tray "Settings" asks the frontend to expand and open that tab.
export async function onOpenSettingsRequest(
  handler: () => void,
): Promise<() => void> {
  if (!isRunningInTauri()) {
    return () => {};
  }

  return listen("open-settings", () => {
    handler();
  });
}
