import { formatTable } from "../util/formatTable.ts";
import { optionArrayToObject } from "../util/optionArrayToObject.ts";
import { parseMode } from "../util/parseMode.ts";
import { query } from "../util/query.ts";

const parseSeason = (season: string) =>
  /^20[1-2]\dQ[1-4]$/.test(season) ? season : undefined;

export const handleMax = async ({
  options,
  userId,
}: {
  id: "856232133118132254";
  name: "max";
  userId: string;
  options?: (
    | { name: "season"; type: 3; value: string }
    | { name: "mode"; type: 3; value: string }
  )[];
}): Promise<string> => {
  const opts = optionArrayToObject(options ?? []);
  const mode = opts.mode ? parseMode(opts.mode) : "%";
  const season = opts.season ? parseSeason(opts.season) : undefined;

  const yearPart = season ? season.slice(0, 4) : new Date().getFullYear();
  const monthPart = season
    ? (parseInt(season[5]) - 1) * 3 + 1
    : Math.floor(new Date().getMonth() / 3) * 3 + 1;
  const start = new Date(`${yearPart}-${monthPart}Z`);
  const end = new Date(`${yearPart}-${monthPart + 3}Z`);

  const results = await query<
    {
      mode: string;
      rating: number;
      playedon: Date;
      replayid: number;
      round: number;
    }[]
  >(`SELECT
  outcome.mode,
  outcome.rating,
  replay.playedon,
  MAX(outcome.replayid) replayid,
  MAX(round) round
FROM elo.outcome
INNER JOIN (
  SELECT
      mode,
      player,
      MAX(rating) max
  FROM elo.outcome
  INNER JOIN elo.replay ON outcome.replayid = replay.replayid
  WHERE
      playedon >= date '${start.toISOString().slice(0, 10)}'
      AND playedon < date '${end.toISOString().slice(0, 10)}'
      AND player = (
          SELECT battlenettag
          FROM elo.discordBattleNetMap
          WHERE discordId = '${userId}'
      )
      AND mode LIKE '${mode}'
  GROUP BY mode, player
) q1 ON
  outcome.mode = q1.mode
  AND outcome.rating = q1.max
  AND outcome.player = q1.player
INNER JOIN elo.replay ON outcome.replayid = replay.replayid
GROUP BY outcome.mode, outcome.rating
ORDER BY outcome.mode ASC;`);

  const content = `\`\`\`
${formatTable([
  ["mode", "rating", "playedon", "replay", "round"],
  ...results.map((r) => [
    r.mode,
    r.rating,
    new Date(r.playedon).toISOString().slice(0, 10),
    r.replayid,
    r.round,
  ]),
])}
\`\`\``;

  return content.slice(0, 2000);
};
