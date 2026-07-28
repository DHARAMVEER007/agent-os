import { invoke } from "@tauri-apps/api/core";

export interface RuntimeStatus {
  application: string;
  native_shell: string;
  background_service: string;
}

export const initialRuntimeStatus: RuntimeStatus = {
  application: "Ready",
  native_shell: "Not checked",
  background_service: "Planned",
};

function isRunningInTauri() {
  return "__TAURI_INTERNALS__" in window;
}

export async function getRuntimeStatus(): Promise<RuntimeStatus> {
  if (!isRunningInTauri()) {
    return {
      application: "Ready",
      native_shell: "Browser preview",
      background_service: "Planned",
    };
  }

  return invoke<RuntimeStatus>("get_runtime_status");
}
