"""Notification API persistence tests."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

TOKEN = "test-session-token"


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch, tmp_path):
    monkeypatch.setenv("AGENTOS_SESSION_TOKEN", TOKEN)
    monkeypatch.setenv("AGENTOS_DATA_DIR", str(tmp_path))

    # Import after env is set so lifespan uses the temp database.
    from agentos.api.app import app

    with TestClient(app) as test_client:
        yield test_client


def _auth() -> dict[str, str]:
    return {"Authorization": f"Bearer {TOKEN}"}


def test_list_notifications_returns_seeded_items(client: TestClient) -> None:
    response = client.get("/v1/notifications", headers=_auth())
    assert response.status_code == 200
    payload = response.json()
    assert payload["unreadCount"] == 10
    assert len(payload["notifications"]) == 12
    first = payload["notifications"][0]
    assert first["title"] == "Reply ready for review"
    assert first["isRead"] is False
    assert first["replyDraft"]["to"] == "you@company.com"


def test_mark_one_read_updates_unread_count(client: TestClient) -> None:
    response = client.post("/v1/notifications/2/read", headers=_auth())
    assert response.status_code == 200
    assert response.json()["unreadCount"] == 9

    listed = client.get("/v1/notifications", headers=_auth()).json()
    invoice = next(item for item in listed["notifications"] if item["id"] == 2)
    assert invoice["isRead"] is True


def test_mark_all_read_clears_badge(client: TestClient) -> None:
    response = client.post("/v1/notifications/read-all", headers=_auth())
    assert response.status_code == 200
    assert response.json()["unreadCount"] == 0

    listed = client.get("/v1/notifications", headers=_auth()).json()
    assert listed["unreadCount"] == 0
    assert all(item["isRead"] for item in listed["notifications"])


def test_update_reply_draft(client: TestClient) -> None:
    response = client.put(
        "/v1/notifications/1/reply-draft",
        headers=_auth(),
        json={"subject": "Re: Revised", "draftBody": "Updated body"},
    )
    assert response.status_code == 200
    draft = response.json()["notification"]["replyDraft"]
    assert draft["subject"] == "Re: Revised"
    assert draft["draftBody"] == "Updated body"


def test_notifications_require_auth(client: TestClient) -> None:
    assert client.get("/v1/notifications").status_code == 401
