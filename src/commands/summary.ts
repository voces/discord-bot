import { json } from "https://deno.land/x/sift@0.3.2/mod.ts";
import { cleanUsername } from "../util/cleanUsername.ts";
import { optionArrayToObject } from "../util/optionArrayToObject.ts";
import { parseDuration } from "../util/parseDuration.ts";
import { parseMode } from "../util/parseMode.ts";
import { query } from "../util/query.ts";

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
  options?: (
    | { name: "replay"; type: 4; value: number }
    | { name: "period"; type: 3; value: string }
    | { name: "mode"; type: 3; value: string }
  )[];
}): Promise<Response> => {
  const opts = optionArrayToObject(options ?? []);

  let duration = typeof opts.period === "string"
    ? parseDuration(opts.period)
    : undefined;
  duration = duration ? Math.min(duration, 604800) : 0;

  const mode = typeof opts.mode === "string" ? parseMode(opts.mode) : undefined;

  const replay = typeof opts.replay === "number"
    ? `SELECT ${opts.replay} replayid`
    : `SELECT replayid FROM elo.replay${
      duration
        ? ` WHERE playedon >= FROM_UNIXTIME(${Date.now() / 1000 - duration})`
        : ""
    } ORDER BY replayid DESC${!duration ? ` LIMIT 1` : ""}`;

  const result = await query<Row[]>(`SELECT
  player,
  mode,
  SUM(\`change\`) \`change\`,
  MAX(\`change\`) best,
  MIN(\`change\`) worst,
  COUNT(1) rounds
FROM elo.outcome
INNER JOIN (${replay}) AS q1 ON outcome.replayid = q1.replayid${
    mode ? `\nWHERE mode LIKE '${mode}'` : ""
  }
GROUP BY player, mode
ORDER BY 2 ASC, 3 DESC;`);

  if (result.length === 0) {
    return json({ type: 4, data: { content: "no rounds found" } });
  }

  const groups = Object.values(
    result.reduce((groups, row) => {
      const group = groups[row.mode] ?? (groups[row.mode] = []);
      group.push(row);

      return groups;
    }, {} as Record<string, Row[]>),
  );

  let content = "";

  for (const rows of groups) {
    const data = rows.map((r) => ({ ...r, player: cleanUsername(r.player) }));

    const maxNameLength = data.reduce(
      (max, r) => (max > r.player.length ? max : r.player.length),
      6,
    );

    const section = `Changes in ${data[0].mode}:
\`\`\`
${"Player".padStart(maxNameLength)} Change  Best Worst Rounds
${
      data
        .map((r) =>
          [
            r.player.padStart(maxNameLength),
            r.change.toFixed(1).padStart(6),
            r.best.toFixed(1).padStart(5),
            r.worst.toFixed(1).padStart(5),
            r.rounds.toString().padStart(6),
          ].join(" ")
        )
        .join("\n")
    }
\`\`\``;

    if (content.length + section.length > 1999) {
      content += "\n...and more!";
      break;
    }

    content += "\n" + section;
  }

  return json({ type: 4, data: { content: content.slice(0, 2000) } });
};
