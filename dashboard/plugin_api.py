"""Authenticated, read-only Kanban snapshot endpoint for Control Room."""
from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "mode": "read-only"}

@router.get("/snapshot")
async def snapshot(limit: int = Query(default=200, ge=1, le=500)) -> dict:
    try:
        from tui_gateway.methods_kanban import build_snapshot
        return await build_snapshot({"board": "default", "limit": limit})
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Control Room snapshot unavailable") from exc
