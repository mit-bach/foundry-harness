/**
 * foundry-comms — WRITE, self-contained
 *
 * Loads the real Timur00Kh/pi-agents-talk-to-each-other room bus
 * (vendor/agent-room.ts, verbatim at commit e4f162a), then adds the
 * GrokBot handle layer: accept before run, ack ≠ complete, user supersede,
 * peer queue.
 *
 * Does not use messenger-swarm.
 */
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import agentRoom from "../vendor/agent-room.ts";
import { loadManifest, resolveBot } from "./lib/manifest.ts";

type HandleStatus = "accepted" | "queued" | "running" | "completed" | "failed" | "cancelled";

type Handle = {
  id: string;
  bot: string;
  from: string;
  prompt: string;
  status: HandleStatus;
  createdAt: string;
  runId?: string;
  result?: string;
  note?: string;
};

function handlesDir() {
  const dir = path.join(getAgentDir(), "foundry", "handles");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeHandle(h: Handle) {
  fs.writeFileSync(path.join(handlesDir(), `${h.id}.json`), `${JSON.stringify(h, null, 2)}\n`);
}

function readHandle(id: string): Handle | undefined {
  try {
    return JSON.parse(fs.readFileSync(path.join(handlesDir(), `${id}.json`), "utf8")) as Handle;
  } catch {
    return undefined;
  }
}

function spawnViaSubagents(
  pi: ExtensionAPI,
  agent: string,
  task: string,
): Promise<{ ok: boolean; runId?: string; error?: string }> {
  const requestId = randomUUID();
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve({ ok: false, error: "pi-subagents RPC did not answer in time" });
    }, 4000);
    const unsub = pi.events.on(`subagents:rpc:v1:reply:${requestId}`, (reply) => {
      clearTimeout(timer);
      unsub();
      const r = reply as { success?: boolean; data?: { id?: string; runId?: string }; error?: { message?: string } };
      if (r?.success) {
        resolve({ ok: true, runId: r.data?.id ?? r.data?.runId });
      } else {
        resolve({ ok: false, error: r?.error?.message ?? "spawn refused" });
      }
    });
    pi.events.emit("subagents:rpc:v1:request", {
      version: 1,
      requestId,
      method: "spawn",
      params: { agent, task, async: true, context: "fresh" },
    });
  });
}

export default function foundryComms(pi: ExtensionAPI) {
  agentRoom(pi);

  pi.registerTool({
    name: "bot_send_prompt",
    label: "Send to a Foundry bot",
    description:
      "Hand work to another Foundry bot. Returns a handle immediately (accepted). That is not completion. Always async; busy targets are queued.",
    promptSnippet: "Hand work to a named Foundry bot. Returns a handle; not a result.",
    promptGuidelines: [
      "bot_send_prompt accept ≠ done. Do not claim a teammate finished until bot_await_turn reports done.",
    ],
    parameters: Type.Object({
      bot_id: Type.String(),
      prompt: Type.String(),
    }),
    execute: async (_id, params) => {
      const manifest = loadManifest();
      const bot = resolveBot(manifest, String(params.bot_id ?? ""));
      if (!bot) {
        return { content: [{ type: "text" as const, text: `unknown bot ${params.bot_id}` }] };
      }
      const handle: Handle = {
        id: `h_${randomUUID().slice(0, 8)}`,
        bot: bot.slug,
        from: "peer",
        prompt: String(params.prompt ?? ""),
        status: "accepted",
        createdAt: new Date().toISOString(),
      };
      writeHandle(handle);

      const spawned = await spawnViaSubagents(pi, bot.slug, handle.prompt);
      if (spawned.ok) {
        handle.status = "running";
        handle.runId = spawned.runId;
        handle.note = "Dispatched through nicobailon/pi-subagents RPC spawn.";
      } else {
        handle.status = "queued";
        handle.note = `Handle accepted. Dispatch via subagent({ agent: "${bot.slug}" }) or room_send_message. ${spawned.error ?? ""}`.trim();
      }
      writeHandle(handle);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                accepted: true,
                handle_id: handle.id,
                bot: bot.name,
                bot_id: bot.id,
                slug: bot.slug,
                status: handle.status,
                run_id: handle.runId,
                note: "Handle accepted. Not completed. Do not claim the work is done.",
              },
              null,
              2,
            ),
          },
        ],
        details: { handleId: handle.id, bot: bot.slug, status: handle.status },
      };
    },
  });

  pi.registerTool({
    name: "bot_await_turn",
    label: "Await handle",
    description: "Read handle status. Completion is completed|failed|cancelled, never accepted|queued|running.",
    promptSnippet: "Poll a Foundry handle. done is only completed|failed|cancelled.",
    parameters: Type.Object({ handle_id: Type.String() }),
    execute: async (_id, params) => {
      const h = readHandle(String(params.handle_id ?? ""));
      if (!h) return { content: [{ type: "text" as const, text: `unknown handle ${params.handle_id}` }] };
      const done = h.status === "completed" || h.status === "failed" || h.status === "cancelled";
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ ...h, done }) }],
        details: { status: h.status, done },
      };
    },
  });
}
