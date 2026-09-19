/**
 * foundry-roster — WRITE
 * Loads bots from Foundry output. Does not scan ~/.pi/agent/agents.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { loadManifest, protocolBlock, resolveBot } from "./lib/manifest.ts";

export default function foundryRoster(pi: ExtensionAPI) {
  pi.on("before_agent_start", (event) => {
    try {
      const manifest = loadManifest();
      return { systemPrompt: `${event.systemPrompt}\n\n${protocolBlock(manifest)}` };
    } catch {
      return {};
    }
  });

  pi.registerTool({
    name: "bot_search_agents",
    label: "Search Foundry roster",
    description: "Search the Foundry roster by name, slug, or purpose. Not a filesystem of markdown agents.",
    promptSnippet: "Search named Foundry bots (roster, not agent markdown files).",
    parameters: Type.Object({ query: Type.String() }),
    execute: async (_toolCallId, params) => {
      const manifest = loadManifest();
      const q = String(params.query ?? "").toLowerCase();
      const hits = manifest.bots.filter(
        (b) => !q || b.name.toLowerCase().includes(q) || b.slug.includes(q) || b.purpose.toLowerCase().includes(q),
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              hits.map((b) => ({ id: b.id, slug: b.slug, name: b.name, purpose: b.purpose })),
              null,
              2,
            ),
          },
        ],
        details: { count: hits.length },
      };
    },
  });

  pi.registerTool({
    name: "bot_get_profile",
    label: "Foundry bot profile",
    description: "Read one bot from the Foundry roster.",
    promptSnippet: "Read a Foundry bot's instructions, skills, and connectors.",
    parameters: Type.Object({ bot_id: Type.String() }),
    execute: async (_toolCallId, params) => {
      const manifest = loadManifest();
      const bot = resolveBot(manifest, String(params.bot_id ?? ""));
      if (!bot) {
        return { content: [{ type: "text" as const, text: `unknown bot ${params.bot_id}` }] };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(bot, null, 2) }],
        details: { id: bot.id },
      };
    },
  });

  pi.registerCommand("foundry-roster", {
    description: "Print the Foundry roster",
    handler: async (_args, ctx) => {
      const manifest = loadManifest(ctx.cwd);
      await ctx.ui.notify(
        `${manifest.system}: ${manifest.bots.map((b) => b.slug).join(", ")}`,
        "info",
      );
    },
  });
}
