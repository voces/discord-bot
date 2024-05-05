import { z } from "npm:zod";
import { discord } from "./discord.ts";

export const zLobby = z.object({
  id: z.union([z.number(), z.string()]),
  host: z.string(),
  map: z.string().transform((v) =>
    v.replace(/\.w3[xm]$/, "").replace(/_/g, " ")
  ),
  name: z.string(),
  server: z.string(),
  slotsTaken: z.number(),
  slotsTotal: z.number(),
  messages: z.object({ channel: z.string(), message: z.string() }).array()
    .optional()
    .default([]),
  deadAt: z.number().optional(),
});
export type Lobby = z.infer<typeof zLobby>;

const zGameList = z.object({ body: zLobby.array() });

const thLobby = z.object({
  id: z.number(),
  host: z.string(),
  path: z.string(),
  name: z.string(),
  region: z.string(),
  slots_taken: z.number(),
  slots_total: z.number(),
}).transform(({ path, region, slots_taken, slots_total, ...v }) => ({
  ...v,
  map: path,
  server: region,
  slotsTaken: slots_taken,
  slotsTotal: slots_total,
  messages: [],
}));
const thGameList = z.object({ results: thLobby.array() });

let dataSource: "none" | "wc3stats" | "wc3maps" = "none";

export const wc3stats = {
  gamelist: async (): Promise<Lobby[]> => {
    const wc3StatsLobbies = await fetch("https://api.wc3stats.com/gamelist")
      .then((r) => r.json())
      .then((r) => zGameList.parse(r).body)
      .catch(() => []);
    if (wc3StatsLobbies.length > 0) {
      if (dataSource !== "wc3stats") {
        dataSource = "wc3stats";
        discord.applications.editCurrent({
          description: "Lobby feed: wc3stats.com",
        });
      }
      return wc3StatsLobbies;
    }

    const wc3MapsLobbies = await fetch("https://wc3maps.com/api/lobbies")
      .then((r) => r.json())
      .then((r) => thGameList.parse(r).results)
      .catch(() => []);
    if (wc3MapsLobbies.length > 0 && dataSource !== "wc3maps") {
      dataSource = "wc3maps";
      discord.applications.editCurrent({
        description: "Lobby feed: wc3maps.com",
      });
    } else if (dataSource !== "none") {
      dataSource = "none";
      discord.applications.editCurrent({
        description: "Lobby feed: down",
      });
    }
    return wc3MapsLobbies;
  },
};
