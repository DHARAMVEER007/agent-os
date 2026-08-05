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
