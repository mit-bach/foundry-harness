# Provenance

This package does **not** reimplement Pi. If a previous demo looked like a fake coding agent, that was a browser preview of the floor protocol. This repo is the installable artifact.

## Installed from GitHub / npm (not rewritten)

| Package | Install | Upstream | Version / pin |
| --- | --- | --- | --- |
| Pi engine | peer: you already run `pi` | https://github.com/earendil-works/pi | `@earendil-works/pi-coding-agent` ≥ 0.85 |
| Subagents | `dependencies.pi-subagents` | https://github.com/nicobailon/pi-subagents | `^0.69.0` (npm, published from that repo) |
| Usage | `dependencies.@narumitw/pi-usage` and listed in `package.json#pi.extensions` | https://github.com/narumiruna/pi-extensions/tree/main/packages/pi-usage | `^0.60.8` |
| Agent room | vendored **verbatim** | https://github.com/Timur00Kh/pi-agents-talk-to-each-other | commit `e4f162a`, file `extensions/agent-room/index.ts` |

`vendor/agent-room.ts` is a byte-for-byte copy of upstream at that commit (messenger-swarm is **not** included). License: `vendor/AGENT-ROOM-LICENSE`.

To re-verify the room copy:

```bash
git clone --depth 1 https://github.com/Timur00Kh/pi-agents-talk-to-each-other.git /tmp/pi-room
git -C /tmp/pi-room fetch --depth 1 origin e4f162a && git -C /tmp/pi-room checkout e4f162a
diff -u /tmp/pi-room/extensions/agent-room/index.ts vendor/agent-room.ts
```

Empty diff = we did not rewrite it.

## Foundry modifications on top of those packages

**pi-subagents** is imported, not forked. `extensions/foundry-subagents.ts` then:

1. Sets `subagents.disableBuiltins = true` so scout / researcher / worker / … are not the roster.
2. Sets `subagents.agentScanDirs = []` and `subagents.agentExcludeDirs` so `~/.pi/agent/agents` and project `agents/` markdown are not standing identity.
3. `registerAgent()` for every bot in Foundry output — children bind to a **bot slug**, not a markdown session file.

**agent-room** is loaded as-is, then `extensions/foundry-comms.ts` adds the GrokBot handle layer (`bot_send_prompt` accepts before run, `bot_await_turn`, ack ≠ complete). Dispatch of accepted work goes through pi-subagents RPC `spawn` when that bus is up, otherwise the model is told to use the real `subagent` / `room_send_message` tools.

**@narumitw/pi-usage** is loaded from `node_modules` via the Pi package manifest. No wrapper rewrite.

## Written here (custom extensions)

- `extensions/foundry-roster.ts`
- `extensions/foundry-comms.ts` (handle protocol only; room bus is upstream)
- `extensions/foundry-subagents.ts` (config + runtime agents)
- `extensions/foundry-memory.ts`
- `extensions/foundry-routines.ts`
- `extensions/foundry-approvals.ts`
- `extensions/lib/manifest.ts`

## Intentionally not in this package

- A fake Pi SPI / toy `bash` allowlist. The computer **is** Pi.
- Messenger-swarm.
- Builtin pi-subagents markdown agents as the client roster.
