use std::fs;
use std::io;
use std::path::PathBuf;

use tauri::{AppHandle, Manager, PhysicalPosition};

const LAYOUT_FILE_NAME: &str = "widget-layout.json";

/// The widget position as written to disk.
///
/// Physical pixels are stored because that is what the window API takes, and
/// the value is clamped to the current work area on load, so a display that
/// disappeared or changed resolution cannot strand the widget off screen.
#[derive(serde::Deserialize, serde::Serialize)]
struct StoredLayout {
    x: i32,
    y: i32,
}

fn layout_path(app: &AppHandle) -> io::Result<PathBuf> {
    let directory = app
        .path()
        .app_config_dir()
        .map_err(|error| io::Error::other(format!("no config directory available: {error}")))?;

    Ok(directory.join(LAYOUT_FILE_NAME))
}

/// Reads the saved position, treating a missing or unreadable file as "no
/// preference yet" so a first run and a corrupt file behave the same way.
pub fn load(app: &AppHandle) -> Option<PhysicalPosition<i32>> {
    let path = layout_path(app).ok()?;
    let contents = fs::read_to_string(path).ok()?;
    let stored = serde_json::from_str::<StoredLayout>(&contents).ok()?;

    Some(PhysicalPosition::new(stored.x, stored.y))
}

pub fn save(app: &AppHandle, position: PhysicalPosition<i32>) -> io::Result<()> {
    let path = layout_path(app)?;

    if let Some(directory) = path.parent() {
        fs::create_dir_all(directory)?;
    }

    let contents = serde_json::to_string(&StoredLayout {
        x: position.x,
        y: position.y,
    })?;

    fs::write(path, contents)
}
