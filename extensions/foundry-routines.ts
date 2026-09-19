import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { loadManifest } from "./lib/manifest.ts";

export default function foundryRoutines(pi: ExtensionAPI) {
  pi.registerTool({
    name: "routine_list",
    label: "List Foundry routines",
    description: "Standing wakes from the Foundry output. A routine is a wake on the owning bot's lane, not /loop.",
    promptSnippet: "List standing Foundry routines (not /loop).",
    parameters: Type.Object({}),
    execute: async () => {
      const manifest = loadManifest();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(manifest.routines ?? [], null, 2) }],
      };
    },
  });

  pi.registerCommand("foundry-routine", {
    description: "Fire a Foundry routine into the current session as follow-up",
    handler: async (args, ctx) => {
      const name = args.trim();
      const manifest = loadManifest(ctx.cwd);
      const r = (manifest.routines ?? []).find(
        (x) => !name || x.name.toLowerCase() === name.toLowerCase() || x.bot === name,
      );
      if (!r) {
        await ctx.ui.notify("No matching routine.", "warning");
        return;
      }
      const receiptDir = path.join(getAgentDir(), "foundry", "receipts");
      fs.mkdirSync(receiptDir, { recursive: true });
      const receipt = {
        name: r.name,
        bot: r.bot,
        status: "queued",
        at: new Date().toISOString(),
      };
      fs.writeFileSync(path.join(receiptDir, `${Date.now()}.json`), `${JSON.stringify(receipt, null, 2)}\n`);
      ctx.sendUserMessage(`[routine:${r.bot}] ${r.prompt}`, { deliverAs: "followUp" });
    },
  });
}
