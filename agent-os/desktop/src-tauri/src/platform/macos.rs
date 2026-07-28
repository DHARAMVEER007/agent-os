use objc2_app_kit::{NSStatusWindowLevel, NSWindow, NSWindowCollectionBehavior};
use tauri::WebviewWindow;

fn floating_collection_behavior(current: NSWindowCollectionBehavior) -> NSWindowCollectionBehavior {
    current
        | NSWindowCollectionBehavior::CanJoinAllSpaces
        | NSWindowCollectionBehavior::FullScreenAuxiliary
        | NSWindowCollectionBehavior::CanJoinAllApplications
}

fn native_window(window: &WebviewWindow) -> tauri::Result<&NSWindow> {
    let native_window = window.ns_window()?;

    // SAFETY: Tauri returns the NSWindow owned by this live WebviewWindow, and
    // AgentOS invokes these helpers from Tauri's setup callback on the main
    // thread. The WebviewWindow remains alive for the returned reference.
    Ok(unsafe { &*native_window.cast::<NSWindow>() })
}

/// Configures both Space membership and stacking order for the macOS widget.
pub(super) fn configure_floating_window(window: &WebviewWindow) -> tauri::Result<()> {
    let native_window = native_window(window)?;
    let behavior = native_window.collectionBehavior();

    native_window.setCollectionBehavior(floating_collection_behavior(behavior));
    native_window.setLevel(NSStatusWindowLevel);
    native_window.setHidesOnDeactivate(false);
    native_window.setCanHide(false);

    Ok(())
}

/// Orders the widget above inactive applications without making it the key window.
pub(super) fn bring_to_front_without_focus(window: &WebviewWindow) -> tauri::Result<()> {
    native_window(window)?.orderFrontRegardless();

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn adds_all_floating_space_behaviors_without_losing_existing_flags() {
        let behavior = floating_collection_behavior(NSWindowCollectionBehavior::Stationary);

        assert!(behavior.contains(NSWindowCollectionBehavior::Stationary));
        assert!(behavior.contains(NSWindowCollectionBehavior::CanJoinAllSpaces));
        assert!(behavior.contains(NSWindowCollectionBehavior::FullScreenAuxiliary));
        assert!(behavior.contains(NSWindowCollectionBehavior::CanJoinAllApplications));
    }
}
