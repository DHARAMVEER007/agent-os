# AgentOS background service

Local FastAPI sidecar used by the desktop shell for inbox monitoring, drafting,
and notifications.

## Prerequisites

- Python 3.12+
- [`uv`](https://github.com/astral-sh/uv)

## Install and test

```bash
cd ai-service
uv sync --group dev
uv run pytest
```

## Run manually

Tauri normally starts this process. For a manual check:

```bash
export AGENTOS_HOST=127.0.0.1
export AGENTOS_PORT=8741
export AGENTOS_SESSION_TOKEN=dev-token
export AGENTOS_DATA_DIR=/tmp/agentos-dev
uv run python -m agentos
```

Then:

```bash
curl -H "Authorization: Bearer dev-token" http://127.0.0.1:8741/health
curl -H "Authorization: Bearer dev-token" http://127.0.0.1:8741/v1/notifications
```

The service binds only to loopback, requires the session token, and stores
notifications in SQLite under `AGENTOS_DATA_DIR`.
