# Foundry harness

A **Pi coding-agent package** that turns Pi into a GrokBot-class floor: named bots from a Foundry roster, one lane each, handles that accept before they run, rooms, memory, routines, and operator approvals.

This is not a reimplementation of Pi. The engine is [Pi](https://github.com/earendil-works/pi). The rest is wired from the actual GitHub packages, then a thin Foundry layer on top.

## Install

You need [Pi](https://pi.dev) first:

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

Then install this package:

```bash
pi install git:github.com/mit-bach/foundry-harness
```

Or from a clone:

```bash
git clone https://github.com/mit-bach/foundry-harness.git
cd foundry-harness
pi install .
```

Confirm with `pi list`. You should see `git:github.com/mit-bach/foundry-harness`.

Drop a roster in the project you run Pi from:

```bash
cp foundry-output/aegis.json ./foundry-output.json
pi
```

`foundry-output.json` is the architecture Foundry emits (bots, rooms, routines). Override the path with `FOUNDRY_OUTPUT=/absolute/path.json`.

## What you get

| Piece | Avenue | Source |
| --- | --- | --- |
| Engine (read / bash / edit / write, sessions, TUI) | use existing | [`@earendil-works/pi-coding-agent`](https://github.com/earendil-works/pi) |
| Usage / quota | use existing | [`@narumitw/pi-usage`](https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-usage) |
| Subagents | choose + bind | [`nicobailon/pi-subagents`](https://github.com/nicobailon/pi-subagents) |
| Rooms | steal, no messenger-swarm | [`Timur00Kh/pi-agents-talk-to-each-other`](https://github.com/Timur00Kh/pi-agents-talk-to-each-other) `agent-room` |
| Roster | write | this repo |
| Handle protocol (`bot_send_prompt` / `bot_await_turn`) | write | this repo, on top of agent-room |
| Memory | write | this repo |
| Routines | write | this repo |
| Approvals (`ask_user`) | write | this repo |

See [SOURCE.md](SOURCE.md) for exact GitHub commits and what is custom vs upstream.

## Commands

Inside Pi:

- `/foundry-roster` — print the loaded bots
- `/foundry-routine [name]` — fire a standing wake onto the owning bot's lane
- Plus every command from **pi-subagents** (`/subagents`, `/agents`, …) and **agent-room** (`/room`, …)
- Usage overlay from **pi-usage**

## Protocol (short)

- `bot_send_prompt` returns a **handle immediately**. That is accept, not done.
- `bot_await_turn` is done only on `completed | failed | cancelled`.
- One serial lane per bot. User DMs outrank peer wakes; peer mail queues.
- Rooms: host wakes members in order. Do not skip a busy member.
- The computer is Pi's own tools. There is no fake allowlisted shell in this package.
- Consequential actions (delete tree, publish, send-as-user) must `ask_user`.

## Roster shape

```json
{
  "system": "Aegis",
  "version": "1.0",
  "description": "Chief of Staff routes, research reads, ops watches, computer writes.",
  "bots": [
    {
      "id": "bot_atropos",
      "name": "Atropos",
      "slug": "atropos",
      "purpose": "Chief of Staff",
      "instructions": "…",
      "skills": ["routing"],
      "connectors": [],
      "approvalLevel": "ask"
    }
  ],
  "rooms": [{ "title": "Floor", "host": "atropos", "members": ["atropos", "clio"] }],
  "routines": [{ "name": "Morning floor brief", "bot": "hermes", "cadence": "daily", "prompt": "…" }]
}
```

Each bot is registered as a **pi-subagents runtime agent** under its slug. Builtin scout/researcher/… agents are disabled. Filesystem agent-directory discovery is excluded so the roster is Foundry output, not `~/.pi/agent/agents`.

## License

MIT. Vendored `agent-room` keeps its upstream MIT license (Timur00Kh).
