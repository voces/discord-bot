import { expect } from "expect";
import { handleMax } from "./max.ts";
import { ApplicationCommandType } from "npm:discord-api-types/v10";

Deno.test("works", async () => {
  expect(
    await handleMax({
      id: "0001",
      type: ApplicationCommandType.ChatInput,
      name: "max",
      userId: "287706612456751104",
      channelId: "123121223122",
      guildId: undefined,
      channelName: "Foobar",
      options: [
        {
          name: "season",
          type: 3,
          value: "2021Q1",
        },
      ],
    }),
  ).toBe(
    `Your max ratings for 2021Q1:
\`\`\`
Mode       Rating Played on  Replay Round
2v4       1113.02 2021-03-27 102487    16
2v4-sheep  1098.8 2021-03-28 102975     7
2v4-wolf  1053.65 2021-03-27 102487    19
3v5        1049.8 2021-03-28 102964     3
3v5-sheep 1032.26 2021-03-28 102964     0
3v5-wolf  1027.67 2021-03-28 102969     1
4v6       1031.93 2021-02-14  91893     4
4v6-sheep 1024.26 2021-02-14  91893     2
4v6-wolf  1012.75 2021-02-14  91893     4
5v5       1020.06 2021-02-28  95894     0
5v5-sheep 1023.25 2021-02-28  95894     0
overall   1124.62 2021-03-27 102487    16
\`\`\``,
  );
});
