import { handleSummary } from "./summary.ts";

export const interactionsMap: Record<
  string,
  // deno-lint-ignore no-explicit-any
  (data: any) => Promise<Response> | Response
> = {
  "855090407675265054": handleSummary,
};
