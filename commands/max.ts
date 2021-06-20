import { json } from "https://deno.land/x/sift@0.3.2/mod.ts";
import { optionArrayToObject } from "../util/optionArrayToObject.ts";
import { parseMode } from "../util/parseMode.ts";
import { query } from "../util/query.ts";

const parseSeason = (season: string) =>
  /^20[1-2]\d$/.test(season) ? season : undefined;

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
}): Promise<Response> => {
  const opts = optionArrayToObject(options ?? []);
  const mode = opts.mode ? parseMode(opts.mode) : "%";
  const season = opts.season ? parseSeason(opts.season) : undefined;

  const yearPart = season ? season.slice(0, 4) : new Date().getFullYear();
  const monthPart = season
    ? (parseInt(season[5]) - 1) * 3 + 1
    : Math.floor(new Date().getMonth() / 3) * 3 + 1;
  const start = new Date(`${yearPart}-${monthPart}`);
  const end = new Date(`${yearPart}-${monthPart + 3}`);

  const qs = `SELECT
  outcome.mode,
  outcome.player,
  outcome.rating,
  MAX(replayid) replayid,
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
GROUP BY outcome.mode, outcome.player, outcome.rating
ORDER BY outcome.mode ASC;`;

  console.log(qs);

  const results = await query<
    {
      mode: string;
      player: string;
      rating: number;
      replayid: number;
      round: number;
    }[]
  >(qs);

  const content = JSON.stringify(results);

  return json({ type: 4, data: { content: content.slice(0, 2000) } });
};
