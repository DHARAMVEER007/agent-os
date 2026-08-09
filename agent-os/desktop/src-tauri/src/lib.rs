mod platform;
mod sidecar;
mod tray;
mod windows;

use std::sync::{Mutex, MutexGuard, PoisonError};

use tauri::{AppHandle, Manager, RunEvent, State, WebviewWindow, WindowEvent};

use crate::sidecar::{RuntimeConnection, SidecarHandle};
use crate::windows::{store, WidgetLayout};

/// A poisoned lock only means an earlier window operation panicked. The
/// remembered position is still usable, and dropping it would strand the widget.
fn lock_layout(layout: &Mutex<WidgetLayout>) -> MutexGuard<'_, WidgetLayout> {
    layout.lock().unwrap_or_else(PoisonError::into_inner)
}

/// Writes the widget position where the next launch can find it. A failure here
/// costs the user a remembered position, not their session, so it is reported
/// rather than propagated.
fn save_widget_position(app: &AppHandle) {
    let Some(layout) = app.try_state::<Mutex<WidgetLayout>>() else {
        return;
    };
    let Some(position) = lock_layout(&layout).collapsed_position() else {
        return;
    };

    if let Err(error) = store::save(app, position) {
        eprintln!("could not save the widget position: {error}");
    }
}

fn show_existing_instance(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = platform::show_floating_window(&window);
        let _ = window.set_focus();
    }
}

fn stop_sidecar(app: &AppHandle) {
    if let Some(sidecar) = app.try_state::<SidecarHandle>() {
        sidecar.shutdown();
    }
}

#[derive(serde::Serialize)]
struct RuntimeStatus {
    application: &'static str,
    native_shell: &'static str,
    background_service: String,
}

#[tauri::command]
fn get_runtime_status(sidecar: State<'_, SidecarHandle>) -> RuntimeStatus {
    RuntimeStatus {
        application: "Ready",
        native_shell: "Tauri connected",
        background_service: sidecar.background_status(),
    }
}

#[tauri::command]
fn get_runtime_connection(sidecar: State<'_, SidecarHandle>) -> RuntimeConnection {
    sidecar.connection()
}

#[tauri::command]
fn set_widget_expanded(
    window: WebviewWindow,
    layout: State<'_, Mutex<WidgetLayout>>,
    expanded: bool,
) -> tauri::Result<()> {
    {
        let mut layout = lock_layout(&layout);

        if expanded {
            windows::expand(&window, &mut layout)?;
            window.set_focus()?;
        } else {
            windows::collapse(&window, &mut layout)?;
        }
    }

    save_widget_position(window.app_handle());

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // Must be first so a second launch exits before other setup runs.
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_existing_instance(app);
        }))
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let saved_position = store::load(app.handle());
            app.manage(Mutex::new(WidgetLayout::with_collapsed_position(
                saved_position,
            )));
            app.manage(sidecar::start_managed(app.handle()));

            let window = app
                .get_webview_window("main")
                .ok_or_else(|| std::io::Error::other("main window was not created"))?;

            platform::configure_floating_window(&window)?;
            windows::position_at_startup(&window, saved_position)?;
            platform::show_floating_window(&window)?;
            tray::build_tray(app.handle())?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::Moved(position) = event {
                lock_layout(&window.state::<Mutex<WidgetLayout>>()).remember_move(*position);
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_runtime_status,
            get_runtime_connection,
            set_widget_expanded
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // Dragging the widget produces a stream of move events, so the position is
    // written when the session ends rather than on every frame of the drag.
    app.run(|app, event| {
        if let RunEvent::Exit = event {
            stop_sidecar(app);
            save_widget_position(app);
        }
    });
}
