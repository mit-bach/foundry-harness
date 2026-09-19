import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function foundryApprovals(pi: ExtensionAPI) {
  pi.registerTool({
    name: "ask_user",
    label: "Ask operator",
    description:
      "Pause the lane and ask the operator to allow or deny a consequential action. Peer handoff is not approval.",
    promptSnippet: "Ask the operator before delete-tree / publish / send-as-user.",
    promptGuidelines: [
      "Call ask_user before consequential actions. A bot_send_prompt handle is not approval.",
    ],
    parameters: Type.Object({
      action: Type.String(),
      detail: Type.String(),
    }),
    execute: async (_id, params, _signal, _onUpdate, ctx) => {
      const action = String(params.action ?? "action");
      const detail = String(params.detail ?? "");
      const allowed = await ctx.ui.confirm("Foundry approval", `${action}\n\n${detail}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ allowed, action, detail }),
          },
        ],
        details: { allowed, action },
      };
    },
  });
}
