#[cfg(target_os = "macos")]
mod macos;

use tauri::WebviewWindow;

/// Applies the native policies that keep the compact widget above normal apps.
#[cfg(target_os = "macos")]
pub fn configure_floating_window(window: &WebviewWindow) -> tauri::Result<()> {
    macos::configure_floating_window(window)
}

/// Applies the shared topmost policy on platforms without a native adapter.
#[cfg(not(target_os = "macos"))]
pub fn configure_floating_window(window: &WebviewWindow) -> tauri::Result<()> {
    window.set_always_on_top(true)?;
    window.set_visible_on_all_workspaces(true)?;
    Ok(())
}

/// Shows the widget without taking keyboard focus from the active application.
pub fn show_floating_window(window: &WebviewWindow) -> tauri::Result<()> {
    window.show()?;

    #[cfg(target_os = "macos")]
    macos::bring_to_front_without_focus(window)?;

    Ok(())
}
