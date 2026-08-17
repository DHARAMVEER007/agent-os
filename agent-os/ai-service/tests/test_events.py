"""Realtime event stream tests."""

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


def test_events_require_token(client: TestClient) -> None:
    with pytest.raises(Exception):
        with client.websocket_connect("/v1/events"):
            pass


def test_events_ready_and_mark_read_broadcast(client: TestClient) -> None:
    with client.websocket_connect(f"/v1/events?token={TOKEN}") as websocket:
        ready = websocket.receive_json()
        assert ready["type"] == "service.ready"

        response = client.post(
            "/v1/notifications/2/read",
            headers={"Authorization": f"Bearer {TOKEN}"},
        )
        assert response.status_code == 200

        updated = websocket.receive_json()
        assert updated["type"] == "notification.updated"
        assert updated["notificationId"] == 2

        unread = websocket.receive_json()
        assert unread["type"] == "unread_count.changed"
        assert unread["unreadCount"] == 9
