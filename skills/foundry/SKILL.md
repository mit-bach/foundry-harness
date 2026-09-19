---
name: foundry
description: Foundry floor protocol — roster, handles, rooms, routines, approvals. Use when routing work between named bots or when the operator talks about the harness.
---

# Foundry protocol

This session is a Foundry harness on top of Pi.

## Roster

Standing identity comes from Foundry output (`foundry-output.json` or `FOUNDRY_OUTPUT`), not from `~/.pi/agent/agents` markdown. Call `bot_search_agents` / `bot_get_profile`. `/foundry-roster` prints the floor.

Each bot slug is also a pi-subagents runtime agent. Builtin scout/researcher/… agents are disabled.

## Handles (4a)

`bot_send_prompt({ bot_id, prompt })` **accepts immediately** and returns `{ accepted, handle_id, … }`.

That is not completion.

`bot_await_turn({ handle_id })` is complete only when `status` is `completed`, `failed`, or `cancelled`.

Never say a teammate finished because the handle was accepted or because you got an ack.

## Rooms (4c)

Room presence, inbox, and `room_send_message` come from Timur00Kh `agent-room` (vendored). Do not use messenger-swarm. The host wakes members in turn and waits on busy members.

## Computer

Pi's own tools. No second filesystem.

## Approvals

`ask_user` for consequential actions. A peer handoff is not approval.

## Routines

`/foundry-routine [name]` fires a standing wake onto the owning bot's lane. It is not `/loop`.
