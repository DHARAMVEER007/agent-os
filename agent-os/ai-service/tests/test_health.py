"""Health endpoint contract tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

TOKEN = "test-session-token"


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch, tmp_path):
    monkeypatch.setenv("AGENTOS_SESSION_TOKEN", TOKEN)
    monkeypatch.setenv("AGENTOS_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AGENTOS_SIMULATE_INTERVAL_SECONDS", "0")

    from agentos.api.app import app

    with TestClient(app) as test_client:
        yield test_client


def test_health_requires_bearer_token(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 401


def test_health_rejects_wrong_token(client: TestClient) -> None:
    response = client.get(
        "/health",
        headers={"Authorization": "Bearer wrong"},
    )
    assert response.status_code == 401


def test_health_ok(client: TestClient) -> None:
    response = client.get(
        "/health",
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "agentos",
        "version": "0.1.0",
    }


def test_health_fails_when_token_env_missing(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path,
) -> None:
    monkeypatch.setenv("AGENTOS_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("AGENTOS_SIMULATE_INTERVAL_SECONDS", "0")
    monkeypatch.delenv("AGENTOS_SESSION_TOKEN", raising=False)

    from agentos.api.app import app

    with TestClient(app) as bare_client:
        response = bare_client.get(
            "/health",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
    assert response.status_code == 500
