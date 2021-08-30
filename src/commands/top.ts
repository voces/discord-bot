import { cleanUsername } from "../util/cleanUsername.ts";
import { formatTable } from "../util/formatTable.ts";
import { optionArrayToObject } from "../util/optionArrayToObject.ts";
import { parseMode } from "../util/parseMode.ts";
import { parseSeason } from "../util/parseSeason.ts";
import { query } from "../util/query.ts";

export const handleTop = async ({
  options,
}: {
  userId: string;
  options?: (
    | { name: "season"; type: 3; value: string }
    | { name: "mode"; type: 3; value: string }
  )[];
}): Promise<string> => {
  const opts = optionArrayToObject(options ?? []);
  const mode = opts.mode ? parseMode(opts.mode) : "2v4";
  const season = parseSeason(opts.season) ??
    `${new Date().getFullYear()}Q${Math.floor(new Date().getMonth() / 3) + 1}`;

  const results = (
    await query<{ player: string; rating: number; rounds: number }[]>(
      `SELECT player, rating, rounds FROM elo.elos WHERE season = "${season}" AND \`mode\` = "${mode}" ORDER BY rating DESC LIMIT 10;`,
    )
  ).map((r) => ({
    rounds: r.rounds,
    rating: Math.round(r.rating),
    player: cleanUsername(r.player),
  }));

  if (results.length === 1) {
    return "There are no results.";
  }

  const content = `Top 10 in ${mode} in ${season}:
\`\`\`
${
    formatTable([
      ["Player", "Rating", "Rounds"],
      ...results.map((r) => [
        r.player,
        r.rating,
        r.rounds,
      ]),
    ])
  }
\`\`\``;

  return content.slice(0, 2000);
};
