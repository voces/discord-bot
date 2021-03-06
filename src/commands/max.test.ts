import { assertEquals } from "../deps.ts";
import { handleMax } from "./max.ts";

Deno.test("works", async () => {
  assertEquals(
    await handleMax({
      userId: "287706612456751104",
      options: [
        {
          name: "season",
          type: 3,
          value: "2021Q1",
        },
      ],
    }),
    `Your max ratings for 2021Q1:
\`\`\`
Mode       Rating Played on  Replay Round
2v4       1113.95 2021-03-27 102487    16
2v4-sheep 1098.52 2021-03-29 102991    20
2v4-wolf  1053.49 2021-03-27 102487    19
3v5       1032.53 2021-03-28 102969     1
3v5-sheep 1024.05 2021-01-18  85554     8
3v5-wolf  1025.06 2021-03-28 102969     1
5v5       1020.06 2021-02-28  95894     0
5v5-sheep 1023.25 2021-02-28  95894     0
overall      1116 2021-03-27 102487    16
\`\`\``,
  );
});
