REPORT_ACTIVITY = {
    "name": "report_activity",
    "description": "Report the agent's present work phase to the Control Room. Use on task acceptance, material phase change, waiting/blocking, and immediately before completion/failure. This is observational only and never replaces actual tool/runtime evidence.",
    "parameters": {
        "type": "object",
        "properties": {
            "state": {"type": "string", "enum": ["working", "waiting", "blocked", "completed", "failed"]},
            "activity": {"type": "string", "enum": ["planning", "coding", "researching", "browsing", "communicating", "reading", "testing", "reviewing", "managing_files", "delegating", "other"]},
            "summary": {"type": "string", "description": "One short present-tense description of current work."},
            "project": {"type": "string"},
            "progress": {"type": "integer", "minimum": 0, "maximum": 100},
            "blocker": {"type": "string"},
            "needs": {"type": "string"},
            "task_ref": {"type": "string"}
        },
        "required": ["state", "activity", "summary"]
    }
}
