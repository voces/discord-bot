import { handleMax } from "./commands/max.ts";
import { handleSummary } from "./commands/summary.ts";

export const interactionsMap: Record<
  string,
  // deno-lint-ignore no-explicit-any
  (data: any) => Promise<Response> | Response
> = {
  "855090407675265054": handleSummary,
  "856232133118132254": handleMax,
};
