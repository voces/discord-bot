import { json } from "https://deno.land/x/sift@0.3.2/mod.ts";
import { parseDuration } from "./util/parseDuration.ts";

const optionArrayToObject = <
  T extends { name: string; type: number; value: number | string | boolean }
>(
  options: T[]
): { [K in T["name"]]?: T["value"] } => {
  const optMap = {} as { [K in T["name"]]?: T["value"] };
  for (const { name, value } of options) {
    // deno-lint-ignore no-explicit-any
    (optMap as any)[name] = value;
  }
  return optMap;
};

export const handleSummary = ({
  options,
}: {
  id: "855090407675265054";
  name: "summary";
  options?: (
    | { name: "replay"; type: 4; value: number }
    | { name: "period"; type: 3; value: string }
    | { name: "mode"; type: 3; value: string }
  )[];
}): Response => {
  const opts = optionArrayToObject(options ?? []);

  const duration =
    typeof opts.period === "string" ? parseDuration(opts.period) : undefined;

  const replay =
    typeof opts.replay === "number"
      ? opts.replay
      : `(SELECT replayid FROM elo.replay${
          duration
            ? ` WHERE playedon >= FROM_UNIXTIME(${
                Date.now() / 1000 - duration
              })`
            : ""
        }ORDER BY replayid DESC ${!duration ? ` LIMIT 1` : ""})`;

  const query = `SELECT player, SUM(\`change\`) \`change\`, MAX(\`change\`) best, MIN(\`change\`) worst, \`mode\`, COUNT(1) rounds FROM elo.outcome WHERE replayid IN ${replay}${
    opts.mode ? ` AND \`mode\` = ${opts.mode}` : ""
  } GROUP BY player ORDER BY 2 DESC;`;

  return json({ type: 4, data: { content: query } });
};
