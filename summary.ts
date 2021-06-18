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

type Row = {
  player: string;
  change: number;
  best: number;
  worst: number;
  mode: string;
  rounds: number;
};

export const handleSummary = async ({
  options,
}: {
  id: "855090407675265054";
  name: "summary";
  options?: (
    | { name: "replay"; type: 4; value: number }
    | { name: "period"; type: 3; value: string }
    | { name: "mode"; type: 3; value: string }
  )[];
}): Promise<Response> => {
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
        } ORDER BY replayid DESC ${!duration ? ` LIMIT 1` : ""})`;

  const query = `SELECT player, SUM(\`change\`) \`change\`, MAX(\`change\`) best, MIN(\`change\`) worst, mode, COUNT(1) rounds FROM elo.outcome WHERE replayid IN ${replay}${
    opts.mode ? ` AND mode = ${opts.mode}` : ""
  } GROUP BY player ORDER BY 2 DESC;`;

  const result: Row[] = await fetch("https://w3x.io/sql", {
    headers: {
      "x-dbproxy-user": "elopublic",
      "x-dbproxy-password": Deno.env.get("SQL_PASSWORD")!,
      "x-dbproxy-database": "elo",
    },
    method: "POST",
    body: query,
  }).then((r) => r.json());

  if (result.length === 0)
    return json({ type: 4, data: { content: "no rounds found" } });

  const groups = result.reduce((groups, row) => {
    const group = groups[row.mode] ?? (groups[row.mode] = []);
    group.push(row);

    return groups;
  }, {} as Record<string, Row[]>);

  const content = Object.values(groups)
    .map((rows) => {
      rows = rows.map((r) => ({ ...r, player: r.player.split("#")[0] }));

      const maxNameLength = rows.reduce(
        (max, r) => (max > r.player.length ? max : r.player.length),
        6
      );

      return `changes in ${rows[0].mode}:
\`\`\`
${"Player".padStart(maxNameLength)} Change  Best Worst Rounds
${rows
  .map((r) =>
    [
      r.player.padStart(maxNameLength),
      r.change.toFixed(1).padStart(6),
      r.best.toFixed(1).padStart(5),
      r.worst.toFixed(1).padStart(5),
      r.rounds.toString().padStart(6),
    ].join(" ")
  )
  .join("\n")}
\`\`\``;
    })
    .join("\n");

  return json({ type: 4, data: { content } });
};
