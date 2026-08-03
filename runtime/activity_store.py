"""Privacy-minimized activity journal shared by the runtime observer and dashboard.

This is observer-owned metadata, not a transcript, Kanban board, or tool-result log.
"""
from __future__ import annotations

import json
import os
import tempfile
import time
from pathlib import Path
from threading import RLock
from typing import Any

_MAX_EVENTS = 500
_MAX_TEXT = 160
_LOCK = RLock()


def _home() -> Path:
    return Path(os.environ.get("HERMES_HOME", Path.home() / ".hermes"))


def activity_path() -> Path:
    return _home() / "control-room" / "activity-v1.json"


def clean_text(value: Any, fallback: str = "") -> str:
    if value is None:
        return fallback
    return " ".join(str(value).replace("\x00", "").split())[:_MAX_TEXT] or fallback


def _read() -> list[dict[str, Any]]:
    try:
        value = json.loads(activity_path().read_text("utf-8"))
        return value if isinstance(value, list) else []
    except (OSError, ValueError, TypeError):
        return []


def append(event: dict[str, Any]) -> None:
    """Best-effort, atomic local event write. Observation must never break work."""
    try:
        with _LOCK:
            events = _read()
            events.append(event)
            events = events[-_MAX_EVENTS:]
            path = activity_path()
            path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            fd, temporary = tempfile.mkstemp(prefix="activity-", suffix=".json", dir=path.parent)
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as handle:
                    json.dump(events, handle, separators=(",", ":"))
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(temporary, path)
                os.chmod(path, 0o600)
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
    except Exception:
        pass


def event(kind: str, profile_name: str = "default", **fields: Any) -> None:
    payload = {
        "eventId": f"{time.time_ns():x}",
        "occurredAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "kind": kind,
        "profileName": clean_text(profile_name, "default"),
    }
    payload.update({key: clean_text(value) if key in {"summary", "toolName", "toolCategory", "state", "activity", "needs", "blocker", "project", "taskRef"} else value for key, value in fields.items() if value is not None})
    append(payload)


def recent(limit: int = 200) -> list[dict[str, Any]]:
    return _read()[-max(1, min(int(limit), _MAX_EVENTS)):]
