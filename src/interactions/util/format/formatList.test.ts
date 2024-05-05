import { expect } from "expect";
import { formatList } from "../format/formatList.ts";

Deno.test("empty", () => expect(formatList([])).toBe(""));

Deno.test("one", () => expect(formatList(["foo"])).toBe("foo"));

Deno.test("two", () => expect(formatList(["foo", "bar"])).toBe("foo and bar"));

Deno.test("three", () =>
  expect(formatList(["foo", "bar", "baz"])).toBe("foo, bar, and baz"));
