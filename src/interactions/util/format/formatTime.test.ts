import { expect } from "expect";
import { formatTime } from "./formatTime.ts";

Deno.test("zero", () => expect(formatTime(0)).toBe("0"));

Deno.test("1", () => expect(formatTime(1)).toBe("1 second"));

Deno.test("30", () => expect(formatTime(30)).toBe("30 seconds"));

Deno.test("60", () => expect(formatTime(60)).toBe("1 minute"));

Deno.test("61", () => expect(formatTime(61)).toBe("1 minute and 1 second"));

Deno.test("62", () => expect(formatTime(62)).toBe("1 minute and 2 seconds"));

Deno.test("120", () => expect(formatTime(120)).toBe("2 minutes"));

Deno.test("121", () => expect(formatTime(121)).toBe("2 minutes and 1 second"));

Deno.test("122", () => expect(formatTime(122)).toBe("2 minutes and 2 seconds"));

Deno.test("3600", () => expect(formatTime(3600)).toBe("1 hour"));

Deno.test("3601", () => expect(formatTime(3601)).toBe("1 hour and 1 second"));

Deno.test("3660", () => expect(formatTime(3660)).toBe("1 hour and 1 minute"));

Deno.test("3661", () =>
  expect(formatTime(3661)).toBe("1 hour, 1 minute, and 1 second"));

Deno.test("7322", () =>
  expect(formatTime(7322)).toBe("2 hours, 2 minutes, and 2 seconds"));
