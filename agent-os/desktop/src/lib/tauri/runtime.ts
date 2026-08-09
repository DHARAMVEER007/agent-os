import { invoke } from "@tauri-apps/api/core";

export interface RuntimeStatus {
  application: string;
  native_shell: string;
  background_service: string;
}

export interface RuntimeConnection {
  baseUrl: string;
  ready: boolean;
  token: string | null;
}

export const initialRuntimeStatus: RuntimeStatus = {
  application: "Ready",
  native_shell: "Not checked",
  background_service: "Not checked",
};

function isRunningInTauri() {
  return "__TAURI_INTERNALS__" in window;
}

export async function getRuntimeStatus(): Promise<RuntimeStatus> {
  if (!isRunningInTauri()) {
    return {
      application: "Ready",
      native_shell: "Browser preview",
      background_service: "Not running in desktop shell",
    };
  }

  return invoke<RuntimeStatus>("get_runtime_status");
}

export async function getRuntimeConnection(): Promise<RuntimeConnection> {
  if (!isRunningInTauri()) {
    return {
      baseUrl: "",
      ready: false,
      token: null,
    };
  }

  return invoke<RuntimeConnection>("get_runtime_connection");
}
