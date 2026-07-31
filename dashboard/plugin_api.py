"""Dashboard backend seam for snapshots and live event delivery.

The current slice serves deterministic fixture state. Hermes hook adapters will
publish normalized events into the same bounded hub in the next slice.
"""

import asyncio
import json
from collections.abc import AsyncIterator

from fastapi import APIRouter
from fastapi import Request
from fastapi.responses import StreamingResponse

router = APIRouter()

_SNAPSHOT = {
    "schemaVersion": 1,
    "mode": "fixture",
    "generatedAt": "2026-07-30T12:00:00.000Z",
    "agents": [
        {"id": "default", "label": "Main / EA", "status": "idle", "station": "reception-main", "task": None},
        {"id": "builder", "label": "Builder", "status": "working", "station": "workstation-01", "task": "Build the control room shell"},
        {"id": "researcher", "label": "Researcher", "status": "waiting", "station": "waiting-lounge", "task": "Waiting for source material"},
    ],
}


class EventHub:
    """Small in-memory fan-out seam; it is not a durable activity store."""

    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[dict]] = set()

    def subscribe(self) -> asyncio.Queue[dict]:
        queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=100)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict]) -> None:
        self._subscribers.discard(queue)

    def publish(self, event: dict) -> None:
        for queue in tuple(self._subscribers):
            if queue.full():
                continue
            queue.put_nowait(event)


event_hub = EventHub()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "fixture", "mode": "view-only"}


@router.get("/snapshot")
async def snapshot() -> dict:
    return json.loads(json.dumps(_SNAPSHOT))


async def _events(request: Request, queue: asyncio.Queue[dict]) -> AsyncIterator[str]:
    try:
        while not await request.is_disconnected():
            try:
                event = await asyncio.wait_for(queue.get(), timeout=15)
                yield f"event: control-room\ndata: {json.dumps(event, separators=(',', ':'))}\n\n"
            except asyncio.TimeoutError:
                yield ": keep-alive\n\n"
    finally:
        event_hub.unsubscribe(queue)


@router.get("/events")
async def events(request: Request) -> StreamingResponse:
    queue = event_hub.subscribe()
    return StreamingResponse(_events(request, queue), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
