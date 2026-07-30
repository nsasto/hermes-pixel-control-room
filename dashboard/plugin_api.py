"""Minimal dashboard backend seam for the fixture-first vertical slice."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "fixture", "mode": "view-only"}
