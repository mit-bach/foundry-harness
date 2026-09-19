import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type FoundryBot = {
  id: string;
  name: string;
  slug: string;
  purpose: string;
  instructions: string;
  skills?: string[];
  connectors?: string[];
  approvalLevel?: string;
};

export type FoundryManifest = {
  system: string;
  version: string;
  description: string;
  bots: FoundryBot[];
  rooms?: Array<{ title: string; host: string; members: string[] }>;
  routines?: Array<{ name: string; bot: string; cadence: string; prompt: string }>;
};

const here = path.dirname(fileURLToPath(import.meta.url));

export function loadManifest(cwd = process.cwd()): FoundryManifest {
  const candidates = [
    process.env.FOUNDRY_OUTPUT,
    path.join(cwd, "foundry-output.json"),
    path.join(cwd, "foundry-output", "aegis.json"),
    path.join(here, "../../foundry-output/aegis.json"),
  ].filter((p): p is string => Boolean(p));

  for (const file of candidates) {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8")) as FoundryManifest;
    }
  }
  throw new Error(
    "Foundry roster missing. Set FOUNDRY_OUTPUT or place foundry-output.json in the project root.",
  );
}

export function resolveBot(manifest: FoundryManifest, token: string): FoundryBot | undefined {
  const t = token.toLowerCase();
  return manifest.bots.find((b) => b.id === token || b.slug === t || b.name.toLowerCase() === t);
}

export function protocolBlock(manifest: FoundryManifest): string {
  const roster = manifest.bots
    .map((b) => `- ${b.name} (${b.slug}): ${b.purpose}`)
    .join("\n");
  return [
    `# Foundry — ${manifest.system}`,
    manifest.description,
    "",
    "Roster (standing identity; not ~/.pi/agent/agents):",
    roster,
    "",
    "Protocol:",
    "- bot_send_prompt accepts immediately and returns a handle. That is not completion.",
    "- bot_await_turn is done only on completed|failed|cancelled.",
    "- User DMs outrank peer wakes. Peer mail queues when a bot is busy.",
    "- Rooms: host wakes members in order. Never skip a busy member.",
    "- Computer is Pi's read/bash/edit/write. Usage overlay is @narumitw/pi-usage.",
    "- Subagents are Foundry bots (slugs above). Builtin scout/researcher agents are disabled.",
    "- Consequential actions must ask_user. A peer handoff is not approval.",
  ].join("\n");
}
