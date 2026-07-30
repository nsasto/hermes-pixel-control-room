# Hermes Pixel Control Room

This context describes the people-like presences and observable work represented inside the Hermes Pixel Control Room.

## Language

**Agent**:
A configured Hermes profile, including the default profile, represented as one persistent participant in the room.
_Avoid_: Bot, character, session

**Main Agent**:
The Agent designated for executive-assistant and orchestration duties. The default Hermes profile initially holds this designation.
_Avoid_: Master agent, receptionist

**Agent Presence**:
The persistent visual identity through which an Agent appears in the room, including its assigned character and home station.
_Avoid_: Avatar, sprite, agent instance

**Temporary Helper**:
A short-lived visual participant representing a delegated Hermes subagent and linked to its parent Agent.
_Avoid_: Agent Presence, permanent agent

**Execution**:
One Hermes session or run in which an Agent performs work. An Agent may have multiple concurrent Executions without gaining additional Agent Presences.
_Avoid_: Agent, task

**Activity**:
The current observable phase of work within an Execution, derived from Hermes lifecycle and tool events.
_Avoid_: Status, animation

**Authoritative Status**:
The deterministic operational condition of an Agent or Execution, independent of visual movement or ambient behavior.
_Avoid_: Mood, animation state

**Ambient Behavior**:
Non-authoritative visual activity used to make an idle or waiting Agent Presence feel alive without implying work that is not occurring.
_Avoid_: Status, activity

**Station**:
A named functional destination in the office associated with one or more Activity categories.
_Avoid_: Room, desk

**Home Station**:
The default location to which an Agent Presence returns when it has no higher-priority destination.
_Avoid_: Activity station

**Control Room**:
The view-only Hermes web-dashboard tab containing the office simulation and activity side panel.
_Avoid_: Desktop plugin, agent controller

**Event Bridge**:
The local boundary that receives Hermes lifecycle hooks, maintains the latest observable state, and streams it to the visible Control Room.
_Avoid_: History store, source of truth
