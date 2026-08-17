//! Starts and stops the local Python FastAPI sidecar during development.
//!
//! Release packaging of a frozen binary sidecar comes later. For now the
//! desktop shell launches `uv run python -m agentos` from `ai-service/`.

use std::io::{Error as IoError, ErrorKind};
use std::net::TcpListener;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{AppHandle, Manager};
use uuid::Uuid;

const READY_TIMEOUT: Duration = Duration::from_secs(20);
const POLL_INTERVAL: Duration = Duration::from_millis(200);

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeConnection {
    pub base_url: String,
    pub ready: bool,
    /// Present only when the sidecar is ready so the UI can call the local API.
    pub token: Option<String>,
}

#[derive(Debug)]
enum SidecarPhase {
    Starting,
    Ready,
    Unavailable(String),
    Stopped,
}

#[derive(Debug)]
pub struct SidecarState {
    port: u16,
    token: String,
    child: Option<Child>,
    phase: SidecarPhase,
}

impl SidecarState {
    fn unavailable(message: impl Into<String>) -> Self {
        Self {
            port: 0,
            token: String::new(),
            child: None,
            phase: SidecarPhase::Unavailable(message.into()),
        }
    }

    fn base_url(&self) -> String {
        format!("http://127.0.0.1:{}", self.port)
    }

    fn status_label(&self) -> String {
        match &self.phase {
            SidecarPhase::Starting => "Starting…".to_string(),
            SidecarPhase::Ready => "Ready".to_string(),
            SidecarPhase::Unavailable(reason) => format!("Unavailable ({reason})"),
            SidecarPhase::Stopped => "Stopped".to_string(),
        }
    }

    fn connection(&self) -> RuntimeConnection {
        let ready = matches!(self.phase, SidecarPhase::Ready);
        RuntimeConnection {
            base_url: if self.port == 0 {
                String::new()
            } else {
                self.base_url()
            },
            ready,
            token: if ready {
                Some(self.token.clone())
            } else {
                None
            },
        }
    }
}

pub struct SidecarHandle {
    inner: Mutex<SidecarState>,
}

impl SidecarHandle {
    pub fn unavailable(message: impl Into<String>) -> Self {
        Self {
            inner: Mutex::new(SidecarState::unavailable(message)),
        }
    }

    pub fn background_status(&self) -> String {
        self.with_state(|state| {
            if matches!(state.phase, SidecarPhase::Ready) && !probe_health(state) {
                state.phase =
                    SidecarPhase::Unavailable("health check failed after ready".into());
            }
            state.status_label()
        })
    }

    pub fn connection(&self) -> RuntimeConnection {
        self.with_state(|state| {
            if matches!(state.phase, SidecarPhase::Ready) && !probe_health(state) {
                state.phase =
                    SidecarPhase::Unavailable("health check failed after ready".into());
            }
            state.connection()
        })
    }

    pub fn shutdown(&self) {
        let mut state = self.inner.lock().unwrap_or_else(|error| error.into_inner());
        if let Some(mut child) = state.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        state.phase = SidecarPhase::Stopped;
    }

    fn with_state<T>(&self, f: impl FnOnce(&mut SidecarState) -> T) -> T {
        let mut state = self.inner.lock().unwrap_or_else(|error| error.into_inner());
        f(&mut state)
    }
}

/// Best-effort start used during app setup. Failures degrade the UI instead of
/// preventing the floating widget from appearing.
pub fn start_managed(app: &AppHandle) -> SidecarHandle {
    match spawn_and_wait_ready(app) {
        Ok(state) => SidecarHandle {
            inner: Mutex::new(state),
        },
        Err(error) => {
            eprintln!("AgentOS sidecar failed to start: {error}");
            SidecarHandle::unavailable(error.to_string())
        }
    }
}

fn spawn_and_wait_ready(app: &AppHandle) -> Result<SidecarState, IoError> {
    let service_dir = resolve_ai_service_dir(app)?;
    let port = reserve_loopback_port()?;
    let token = Uuid::new_v4().to_string();

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| IoError::other(format!("app data dir unavailable: {error}")))?;
    std::fs::create_dir_all(&data_dir)?;

    let child = Command::new("uv")
        .args(["run", "python", "-m", "agentos"])
        .current_dir(&service_dir)
        .env("AGENTOS_HOST", "127.0.0.1")
        .env("AGENTOS_PORT", port.to_string())
        .env("AGENTOS_SESSION_TOKEN", &token)
        .env("AGENTOS_DATA_DIR", data_dir)
        .env("AGENTOS_LOG_LEVEL", "warning")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| {
            IoError::new(
                error.kind(),
                format!(
                    "could not launch `uv` in {}: {error}. Install uv and run `uv sync` in ai-service/",
                    service_dir.display()
                ),
            )
        })?;

    let mut state = SidecarState {
        port,
        token,
        child: Some(child),
        phase: SidecarPhase::Starting,
    };

    let deadline = Instant::now() + READY_TIMEOUT;
    while Instant::now() < deadline {
        if let Some(child) = state.child.as_mut() {
            if let Ok(Some(status)) = child.try_wait() {
                return Err(IoError::new(
                    ErrorKind::Other,
                    format!("sidecar exited during startup with {status}"),
                ));
            }
        }

        if probe_health(&state) {
            state.phase = SidecarPhase::Ready;
            return Ok(state);
        }

        thread::sleep(POLL_INTERVAL);
    }

    if let Some(mut child) = state.child.take() {
        let _ = child.kill();
        let _ = child.wait();
    }

    Err(IoError::new(
        ErrorKind::TimedOut,
        format!(
            "sidecar did not become ready at {} within {}s",
            state.base_url(),
            READY_TIMEOUT.as_secs()
        ),
    ))
}

fn probe_health(state: &SidecarState) -> bool {
    if state.port == 0 || state.token.is_empty() {
        return false;
    }

    let url = format!("{}/health", state.base_url());
    let response = ureq::get(&url)
        .set("Authorization", &format!("Bearer {}", state.token))
        .timeout(Duration::from_secs(1))
        .call();

    match response {
        Ok(body) if body.status() == 200 => body
            .into_json::<serde_json::Value>()
            .ok()
            .and_then(|json| {
                json.get("status")
                    .and_then(|value| value.as_str())
                    .map(|status| status == "ok")
            })
            .unwrap_or(false),
        _ => false,
    }
}

fn reserve_loopback_port() -> Result<u16, IoError> {
    let listener = TcpListener::bind(("127.0.0.1", 0))?;
    Ok(listener.local_addr()?.port())
}

fn resolve_ai_service_dir(app: &AppHandle) -> Result<PathBuf, IoError> {
    if let Ok(from_env) = std::env::var("AGENTOS_AI_SERVICE_DIR") {
        let path = PathBuf::from(from_env);
        return ensure_service_dir(path);
    }

    // desktop/src-tauri -> ../../ai-service when developing from the repo.
    let from_manifest = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("ai-service");
    if from_manifest.join("pyproject.toml").is_file() {
        return ensure_service_dir(from_manifest);
    }

    // Fallback: resource directory next to a packaged app (future layout).
    if let Ok(resource_dir) = app.path().resource_dir() {
        let packaged = resource_dir.join("ai-service");
        if packaged.join("pyproject.toml").is_file() {
            return ensure_service_dir(packaged);
        }
    }

    Err(IoError::new(
        ErrorKind::NotFound,
        "could not locate ai-service/ (set AGENTOS_AI_SERVICE_DIR)",
    ))
}

fn ensure_service_dir(path: PathBuf) -> Result<PathBuf, IoError> {
    let canonical = path.canonicalize().unwrap_or(path);
    if !canonical.join("pyproject.toml").is_file() {
        return Err(IoError::new(
            ErrorKind::NotFound,
            format!("ai-service directory missing pyproject.toml: {}", canonical.display()),
        ));
    }
    if !Path::new(&canonical).is_dir() {
        return Err(IoError::new(
            ErrorKind::NotFound,
            format!("ai-service path is not a directory: {}", canonical.display()),
        ));
    }
    Ok(canonical)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reserve_loopback_port_returns_nonzero() {
        let port = reserve_loopback_port().expect("port");
        assert!(port > 0);
    }

    #[test]
    fn unavailable_status_is_labeled() {
        let handle = SidecarHandle::unavailable("uv missing");
        assert!(handle.background_status().contains("Unavailable"));
        assert!(!handle.connection().ready);
    }
}
