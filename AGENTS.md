# Control Room contributor rules

## Live activity reporting

The control-room activity feed represents what an agent is doing now. It is separate from Kanban, which is backlog/ownership information only.

When the `hermes-control-room-observer` plugin is enabled, call `report_activity` immediately after accepting work, at material phase changes, before waiting for approval/input, on blocking, and immediately before a verified completion/failure/cancellation.

Schema: `state` = `working|waiting|blocked|completed|failed`; `activity` = `planning|coding|researching|browsing|communicating|reading|testing|reviewing|managing_files|delegating|other`; short present-tense `summary`; optional `project`, integer `progress` 0–100, `task_ref`; required `blocker` for blocked and `needs` for waiting.

Accuracy: report the present action, not eventual goal; do not derive activity from Kanban; do not claim a tool action before it starts or completion before verification; update only at material phase changes; never include secrets, raw prompts, private messages, or sensitive tool output. If reporting fails, continue the task.

## Telemetry precedence

The UI resolves status in this order: approval/input request → waiting; active tool → runtime-derived station; active LLM → working; unresolved semantic blocker → blocked; recent semantic report → summary; inactivity timeout → idle. Kanban never determines live activity.
