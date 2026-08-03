"""Authenticated, minimized Control Room read model.

Kanban is included only as backlog/ownership context. Runtime activity is derived
from Hermes lifecycle hooks and an intentionally metadata-only local journal.
"""
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

_ROOT = Path(__file__).resolve().parent.parent
_HERMES_SOURCE = Path.home() / ".hermes" / "hermes-agent"
for candidate in (_ROOT, _HERMES_SOURCE):
    if str(candidate) not in sys.path:
        sys.path.insert(0, str(candidate))

from runtime.activity_store import recent

router = APIRouter()

@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "mode": "read-only"}

@router.get("/snapshot")
async def snapshot(limit: int = Query(default=200, ge=1, le=500)) -> dict:
    try:
        from tui_gateway.methods_kanban import build_snapshot
        snapshot = build_snapshot({"board": "default", "limit": limit})
        # The journal contains no raw tool arguments/results, messages, prompts,
        # paths, credentials, or other sensitive payloads.
        snapshot["activities"] = recent(limit=limit)
        snapshot["activitySchemaVersion"] = 1
        return snapshot
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Control Room snapshot unavailable") from exc
