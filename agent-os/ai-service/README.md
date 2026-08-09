# AgentOS background service

Local FastAPI sidecar used by the desktop shell for inbox monitoring, drafting,
and notifications. Version 1 starts with a secured `/health` endpoint.

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
uv run python -m agentos
```

Then:

```bash
curl -H "Authorization: Bearer dev-token" http://127.0.0.1:8741/health
```

The service binds only to loopback and requires the session token on every
request.
