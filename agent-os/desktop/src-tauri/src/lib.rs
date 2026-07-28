mod platform;
mod windows;

use tauri::Manager;

#[derive(serde::Serialize)]
struct RuntimeStatus {
    application: &'static str,
    native_shell: &'static str,
    background_service: &'static str,
}

#[tauri::command]
fn get_runtime_status() -> RuntimeStatus {
    RuntimeStatus {
        application: "Ready",
        native_shell: "Tauri connected",
        background_service: "Planned",
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let window = app
                .get_webview_window("main")
                .ok_or_else(|| std::io::Error::other("main window was not created"))?;

            platform::configure_floating_window(&window)?;
            windows::position_bottom_right(&window)?;
            platform::show_floating_window(&window)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_runtime_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
