import { json } from "https://deno.land/x/sift@0.3.2/mod.ts";
import { handleMax } from "./commands/max.ts";
import { handleSummary } from "./commands/summary.ts";

const wrappedHandler =
  <T>(
    handler: (data: T) => unknown
  ): ((data: T) => Promise<Response> | Response) =>
  async (data: T) => {
    const ret = await handler(data);
    console.log(ret);
    if (ret instanceof Response) return ret;
    return json({ type: 4, data: ret });
  };

export const interactionsMap: Record<
  string,
  // deno-lint-ignore no-explicit-any
  (data: any) => Promise<Response> | Response
> = {
  "855090407675265054": handleSummary,
  "856232133118132254": wrappedHandler(handleMax),
};
