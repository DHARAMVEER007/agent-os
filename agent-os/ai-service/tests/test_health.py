"""Health endpoint contract tests."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from agentos.api.app import app

TOKEN = "test-session-token"


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("AGENTOS_SESSION_TOKEN", TOKEN)
    return TestClient(app)


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
) -> None:
    monkeypatch.delenv("AGENTOS_SESSION_TOKEN", raising=False)
    with TestClient(app) as bare_client:
        response = bare_client.get(
            "/health",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
    assert response.status_code == 500
