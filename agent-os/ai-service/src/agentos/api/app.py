"""FastAPI application entry for the AgentOS sidecar."""

from __future__ import annotations

from fastapi import Depends, FastAPI

from agentos import __version__
from agentos.api.auth import require_session_token

app = FastAPI(
    title="AgentOS background service",
    version=__version__,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


@app.get("/health", dependencies=[Depends(require_session_token)])
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "agentos",
        "version": __version__,
    }
