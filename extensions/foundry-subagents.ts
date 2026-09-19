/**
 * foundry-subagents — CHOOSE (nicobailon/pi-subagents)
 *
 * Installs the real npm package from https://github.com/nicobailon/pi-subagents
 * then:
 *   - disableBuiltins so scout/researcher/… are not the roster
 *   - exclude agent markdown directories
 *   - register each Foundry bot as a runtime agent (bound to a bot, not a Pi session file)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import registerSubagents from "pi-subagents";
import { registerAgent } from "pi-subagents/agents";
import { loadManifest } from "./lib/manifest.ts";

function writeFoundrySubagentSettings(cwd: string) {
  const settingsPath = path.join(cwd, ".pi", "settings.json");
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as Record<string, unknown>;
  } catch {
    settings = {};
  }
  const subagents =
    settings.subagents && typeof settings.subagents === "object"
      ? (settings.subagents as Record<string, unknown>)
      : {};
  subagents.disableBuiltins = true;
  subagents.agentScanDirs = [];
  subagents.agentExcludeDirs = [
    path.join(os.homedir(), ".pi", "agent", "agents"),
    path.join(os.homedir(), ".agents"),
    path.join(cwd, ".pi", "agents"),
    path.join(cwd, ".agents"),
    path.join(cwd, "agents"),
  ];
  settings.subagents = subagents;
  fs.writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
}

export default function foundrySubagents(pi: ExtensionAPI) {
  writeFoundrySubagentSettings(process.cwd());
  registerSubagents(pi);

  pi.on("session_start", (_event, ctx) => {
    writeFoundrySubagentSettings(ctx.cwd);
    const manifest = loadManifest(ctx.cwd);
    for (const bot of manifest.bots) {
      registerAgent({
        pi,
        name: bot.slug,
        definition: {
          description: bot.purpose,
          systemPrompt: bot.instructions,
          systemPromptMode: "replace",
          inheritProjectContext: true,
          inheritGlobalContext: false,
          inheritSkills: true,
          skills: bot.skills,
        },
      });
    }
  });
}
