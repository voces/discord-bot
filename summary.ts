import { json } from "https://deno.land/x/sift@0.3.2/mod.ts";

const optionArrayToObject = <
  T extends { name: string; type: number; value: number | string | boolean }
>(
  options: T[]
): { [K in T["name"]]?: T["value"] } => {
  const optMap = {} as { [K in T["name"]]?: T["value"] };
  for (const { name, value } of options) {
    // deno-lint-ignore no-explicit-any
    (optMap as any)[name] = value;
  }
  return optMap;
};

export const handleSummary = ({
  options,
}: {
  id: "855090407675265054";
  name: "summary";
  options?: (
    | { name: "replay"; type: 4; value: number }
    | { name: "period"; type: 3; value: string }
    | { name: "mode"; type: 3; value: string }
  )[];
}): Response => {
  const opts = optionArrayToObject(options ?? []);
  console.log(opts);
  return json({ type: 4, data: { content: "Boo" } });
};
