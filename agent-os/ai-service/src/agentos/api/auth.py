"""Session-token checks for the loopback API."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException, status


def require_session_token(
    authorization: str | None = Header(default=None),
) -> None:
    expected = os.environ.get("AGENTOS_SESSION_TOKEN")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session token is not configured",
        )

    if authorization != f"Bearer {expected}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing session token",
        )
