import { describe, it, expect } from "vitest";
import { prettyString, formatUnixSecondsToDate, formatUnixSecondsToMonthDayTime } from "../utils/format";

describe("utils/format", () => {
  it("prettyString converts snake/camel to spaced title case", () => {
    expect(prettyString("invoice_total")).toBe("Invoice Total");
    expect(prettyString("invoiceTotal")).toBe("Invoice Total");
    expect(prettyString("Amount-Value")).toBe("Amount Value");
  });

  it("formatUnixSecondsToDate returns short date", () => {
    const d = new Date(Date.UTC(2024, 0, 15, 0, 0, 0)); // Jan 15, 2024
    const sec = Math.floor(d.getTime() / 1000);
    const out = formatUnixSecondsToDate(sec);
    expect(out.length).toBeGreaterThan(0);
  });

  it("formatUnixSecondsToMonthDayTime returns date + time", () => {
    const d = new Date(Date.UTC(2024, 0, 15, 12, 34, 0));
    const sec = Math.floor(d.getTime() / 1000);
    const out = formatUnixSecondsToMonthDayTime(sec);
    expect(out).toMatch(/, \d{2}:\d{2}$/);
  });
});


