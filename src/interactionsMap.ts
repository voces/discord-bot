import { json } from "https://deno.land/x/sift@0.3.2/mod.ts";
import { handleMax } from "./commands/max.ts";
import { handleSummary } from "./commands/summary.ts";
import { handleTop } from "./commands/top.ts";

const wrappedHandler = <T>(
  handler: (data: T) => unknown,
): ((data: T) => Promise<Response> | Response) =>
  async (data: T) => {
    const ret = await handler(data);
    if (ret instanceof Response) return ret;
    return json({ type: 4, data: { content: ret } });
  };

const wrapHandlers = (
  // deno-lint-ignore no-explicit-any
  map: Record<string, (data: any) => unknown>,
) =>
  Object.fromEntries(
    Object.entries(map).map(([k, v]) => [k, wrappedHandler(v)]),
  );

export const interactionsMap: Record<
  string,
  (data: unknown) => Promise<Response> | Response
> = wrapHandlers({
  summary: handleSummary,
  max: handleMax,
  top: handleTop,
});
