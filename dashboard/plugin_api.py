"""Authenticated, read-only Kanban snapshot endpoint for Control Room."""
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

# The dashboard service is installed from a venv; its source root must be on
# sys.path for Hermes' internal read-only snapshot serializer dependencies.
_HERMES_SOURCE = Path.home() / ".hermes" / "hermes-agent"
if str(_HERMES_SOURCE) not in sys.path:
    sys.path.insert(0, str(_HERMES_SOURCE))

router = APIRouter()

@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "mode": "read-only"}

@router.get("/snapshot")
async def snapshot(limit: int = Query(default=200, ge=1, le=500)) -> dict:
    try:
        from tui_gateway.methods_kanban import build_snapshot
        return build_snapshot({"board": "default", "limit": limit})
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Control Room snapshot unavailable") from exc
