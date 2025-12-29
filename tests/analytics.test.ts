import { describe, expect, it } from "vitest";
import { computeStreakFromRows } from "../server/services/analytics";

function makeDate(offset: number) {
  const date = new Date("2024-01-10T00:00:00Z");
  date.setDate(date.getDate() - offset);
  return date;
}

describe("computeStreakFromRows", () => {
  it("calculates current and longest streaks", () => {
    const rows = [
      { date: makeDate(0), status: "done" },
      { date: makeDate(1), status: "done" },
      { date: makeDate(2), status: "missed" },
      { date: makeDate(3), status: "done" },
      { date: makeDate(4), status: "done" }
    ];

    const result = computeStreakFromRows(rows);
    expect(result.current).toBe(2);
    expect(result.longest).toBe(2);
  });
});
