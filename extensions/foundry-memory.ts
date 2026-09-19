import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

function redact(text: string) {
  return text.replace(
    /(api[_-]?key|password|secret|token|sk-[a-zA-Z0-9]+)\s*[:=]\s*\S+/gi,
    (m) => `${m.split(/[:=]/)[0]}: «redacted»`,
  );
}

function memDir() {
  const dir = path.join(getAgentDir(), "foundry", "memory");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export default function foundryMemory(pi: ExtensionAPI) {
  pi.registerTool({
    name: "memory_read",
    label: "Read bot memory",
    description: "Read MEMORY.md or a topic file for this Foundry bot.",
    promptSnippet: "Read Foundry MEMORY.md or a topic file.",
    parameters: Type.Object({ path: Type.String() }),
    execute: async (_id, params) => {
      const file = path.join(memDir(), String(params.path ?? "MEMORY.md").replace(/\.\./g, ""));
      const body = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "(empty)";
      return { content: [{ type: "text" as const, text: body }] };
    },
  });

  pi.registerTool({
    name: "memory_write",
    label: "Write bot memory",
    description: "Write a memory file. Secrets are redacted.",
    promptSnippet: "Write Foundry memory. Secrets are redacted.",
    parameters: Type.Object({ path: Type.String(), content: Type.String() }),
    execute: async (_id, params) => {
      const rel = String(params.path ?? "MEMORY.md").replace(/\.\./g, "");
      const file = path.join(memDir(), rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, redact(String(params.content ?? "")));
      return { content: [{ type: "text" as const, text: `wrote ${rel}` }] };
    },
  });
}
