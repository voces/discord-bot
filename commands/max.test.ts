import { assertEquals } from "https://deno.land/std@0.99.0/testing/asserts.ts";
import { handleMax } from "./max.ts";

Deno.test("works", async () => {
  assertEquals(
    await handleMax({
      id: "856232133118132254",
      name: "max",
      userId: "287706612456751104",
      options: [
        {
          name: "season",
          type: 3,
          value: "2021Q1",
        },
      ],
    }),
    `\`\`\`
mode       rating playedon                      replay round
2v4       1113.95 Sat, 27 Mar 2021 00:25:55 GMT 102487    16
2v4-sheep 1098.52 Mon, 29 Mar 2021 00:01:57 GMT 102991    20
2v4-wolf  1053.49 Sat, 27 Mar 2021 00:25:55 GMT 102487    19
3v5       1032.53 Sun, 28 Mar 2021 22:03:58 GMT 102969     1
3v5-sheep 1024.05 Mon, 18 Jan 2021 17:49:01 GMT  85554     8
3v5-wolf  1025.06 Sun, 28 Mar 2021 22:03:58 GMT 102969     1
5v5       1020.06 Sun, 28 Feb 2021 01:51:10 GMT  95894     0
5v5-sheep 1023.25 Sun, 28 Feb 2021 01:51:10 GMT  95894     0
overall      1116 Sat, 27 Mar 2021 00:25:55 GMT 102487    16
\`\`\``
  );
});
