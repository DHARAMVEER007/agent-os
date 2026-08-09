"""Run the local FastAPI sidecar: ``python -m agentos``."""

from __future__ import annotations

import os

import uvicorn


def main() -> None:
    host = os.environ.get("AGENTOS_HOST", "127.0.0.1")
    if host not in {"127.0.0.1", "localhost", "::1"}:
        raise SystemExit(
            "AGENTOS_HOST must be a loopback address (got {host!r})".format(
                host=host
            )
        )

    port_raw = os.environ.get("AGENTOS_PORT")
    if not port_raw:
        raise SystemExit("AGENTOS_PORT is required")

    try:
        port = int(port_raw)
    except ValueError as error:
        raise SystemExit(f"AGENTOS_PORT must be an integer: {error}") from error

    if not os.environ.get("AGENTOS_SESSION_TOKEN"):
        raise SystemExit("AGENTOS_SESSION_TOKEN is required")

    uvicorn.run(
        "agentos.api.app:app",
        host=host,
        port=port,
        log_level=os.environ.get("AGENTOS_LOG_LEVEL", "info"),
    )


if __name__ == "__main__":
    main()
