import { collection, kvdex } from "jsr:@olli/kvdex";
import { z } from "npm:zod";
import { zLobby } from "./wc3stats.ts";

const kv = await Deno.openKv();

export type RuleKey = "map" | "host" | "name" | "server";

export type Rule =
  | { type: "and" | "or"; rules: Rule[] }
  | { type: "term"; key: RuleKey; value: string | RegExp };
const zRule: z.ZodType<Rule> = z.lazy(() =>
  z.union([
    z.object({
      type: z.union([z.literal("and"), z.literal("or")]),
      rules: zRule.array(),
    }),
    z.object({
      type: z.literal("term"),
      key: z.union([
        z.literal("map"),
        z.literal("host"),
        z.literal("name"),
        z.literal("server"),
      ]),
      value: z.union([z.string(), z.instanceof(RegExp)]),
    }),
  ])
);

const zAlert = z.object({
  channel: z.string(),
  rule: zRule,
  message: z.string().optional(),
});
export type Alert = z.infer<typeof zAlert>;

export const db = kvdex(kv, {
  alerts: collection(zAlert, { idGenerator: (v) => v.channel }),
  lobbies: collection(zLobby.array()),
});
