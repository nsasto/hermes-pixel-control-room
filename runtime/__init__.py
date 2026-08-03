"""Hermes runtime observer for the Control Room."""
from __future__ import annotations
import json
from .activity_store import clean_text, event
from .schemas import REPORT_ACTIVITY

_STATES = {"working", "waiting", "blocked", "completed", "failed"}
_ACTIVITIES = {"planning", "coding", "researching", "browsing", "communicating", "reading", "testing", "reviewing", "managing_files", "delegating", "other"}

def _profile(kwargs):
    return clean_text(kwargs.get("profile_name") or kwargs.get("profile") or "default", "default")

def report_activity(args: dict, **kwargs) -> str:
    try:
        state, activity = args.get("state"), args.get("activity")
        summary = clean_text(args.get("summary"))
        if state not in _STATES or activity not in _ACTIVITIES or not summary:
            return json.dumps({"error": "state, activity, and a short summary are required"})
        if state == "blocked" and not clean_text(args.get("blocker")):
            return json.dumps({"error": "blocker is required when state is blocked"})
        if state == "waiting" and not clean_text(args.get("needs")):
            return json.dumps({"error": "needs is required when state is waiting"})
        progress = args.get("progress")
        if progress is not None and (not isinstance(progress, int) or isinstance(progress, bool) or not 0 <= progress <= 100):
            return json.dumps({"error": "progress must be an integer from 0 to 100"})
        event("semantic.report", _profile(kwargs), state=state, activity=activity, summary=summary,
              project=args.get("project"), progress=progress, blocker=args.get("blocker"), needs=args.get("needs"), taskRef=args.get("task_ref"))
        return json.dumps({"ok": True})
    except Exception:
        return json.dumps({"error": "activity report unavailable; continue the task"})

def on_session_start(**kwargs): event("session.started", _profile(kwargs))
def on_session_end(**kwargs): event("session.ended", _profile(kwargs), summary="Session ended")
def on_pre_llm_call(**kwargs): event("llm.started", _profile(kwargs))
def on_post_llm_call(**kwargs): event("llm.completed", _profile(kwargs))
def on_pre_tool_call(tool_name="tool", **kwargs): event("tool.started", _profile(kwargs), toolName=tool_name, toolCategory=_tool_category(tool_name))
def on_post_tool_call(tool_name="tool", **kwargs): event("tool.completed", _profile(kwargs), toolName=tool_name, toolCategory=_tool_category(tool_name))
def on_subagent_start(**kwargs): event("subagent.started", _profile(kwargs), summary="Delegated worker started")
def on_subagent_stop(**kwargs): event("subagent.completed", _profile(kwargs), summary="Delegated worker stopped")
def _tool_category(name):
    text = str(name).lower()
    if "browser" in text or text.startswith("web_"): return "browsing"
    if any(x in text for x in ("read_file", "search_files", "skill_view")): return "reading"
    if any(x in text for x in ("write_file", "patch", "terminal")): return "coding"
    if "test" in text: return "testing"
    if "delegate" in text: return "delegating"
    return "tool"

def register(ctx):
    ctx.register_tool(name="report_activity", toolset="control_room", schema=REPORT_ACTIVITY, handler=report_activity)
    for hook, callback in [("on_session_start", on_session_start), ("on_session_end", on_session_end), ("pre_llm_call", on_pre_llm_call), ("post_llm_call", on_post_llm_call), ("pre_tool_call", on_pre_tool_call), ("post_tool_call", on_post_tool_call), ("subagent_start", on_subagent_start), ("subagent_stop", on_subagent_stop)]:
        ctx.register_hook(hook, callback)
