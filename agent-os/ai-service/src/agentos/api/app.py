"""FastAPI application entry for the AgentOS sidecar."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from agentos import __version__
from agentos.api.auth import require_session_token
from agentos.api.notifications import router as notifications_router
from agentos.persistence import connect, initialize_database
from agentos.persistence.notifications import seed_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    connection = connect()
    initialize_database(connection)
    seed_if_empty(connection)
    app.state.db = connection
    try:
        yield
    finally:
        connection.close()


app = FastAPI(
    title="AgentOS background service",
    version=__version__,
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)

# Loopback-only service; every route still requires the session token.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(notifications_router)


@app.get("/health", dependencies=[Depends(require_session_token)])
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "agentos",
        "version": __version__,
    }
