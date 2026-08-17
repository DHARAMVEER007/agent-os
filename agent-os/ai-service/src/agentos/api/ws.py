"""WebSocket stream for low-volume service events."""

from __future__ import annotations

import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from agentos import __version__

router = APIRouter()


@router.websocket("/v1/events")
async def service_events(websocket: WebSocket) -> None:
    expected = os.environ.get("AGENTOS_SESSION_TOKEN")
    provided = websocket.query_params.get("token")
    if not expected or provided != expected:
        await websocket.close(code=4401)
        return

    hub = websocket.app.state.events
    await hub.connect(websocket)
    await websocket.send_json(
        {
            "type": "service.ready",
            "service": "agentos",
            "version": __version__,
        }
    )

    try:
        while True:
            # Clients may send ping frames as plain text; ignore payload.
            await websocket.receive_text()
    except WebSocketDisconnect:
        await hub.disconnect(websocket)
