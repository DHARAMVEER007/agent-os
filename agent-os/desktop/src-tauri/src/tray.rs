use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager,
};

use crate::platform;

const SHOW_MENU_ID: &str = "show";
const QUIT_MENU_ID: &str = "quit";

/// Builds the tray/menu-bar icon that is the widget's only chrome now that
/// the app runs as a Dock-less accessory (see `lib.rs`'s activation policy).
pub(super) fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, SHOW_MENU_ID, "Show", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, QUIT_MENU_ID, "Quit", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show, &quit])?;

    let icon = app.default_window_icon().cloned().ok_or_else(|| {
        tauri::Error::from(std::io::Error::other("no default window icon configured"))
    })?;

    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            SHOW_MENU_ID => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = platform::show_floating_window(&window);
                }
            }
            QUIT_MENU_ID => app.exit(0),
            _ => {}
        })
        .build(app)?;

    Ok(())
}
