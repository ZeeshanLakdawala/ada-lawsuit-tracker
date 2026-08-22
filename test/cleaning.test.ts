import { describe, expect, it } from "vitest";
import { cleanCaseName, cleanText, normalizeRecord } from "@/lib/cleaning";

describe("cleaning", () => {
  it("removes parenthetical suffix from case name", () => {
    expect(cleanCaseName("ABC v XYZ (2025)")).toBe("ABC v XYZ");
  });

  it("trims text and trailing punctuation", () => {
    expect(cleanText("  ABC Inc. ")).toBe("ABC Inc");
  });

  it("rejects missing case number", () => {
    expect(
      normalizeRecord({
        case_name: "A v B",
        defendant: "B",
        plaintiff: "A",
        district: "S.D.N.Y.",
        date_filed: "2026-08-20",
        case_url: "https://example.com"
      })
    ).toBeNull();
  });

  it("rejects invalid dates", () => {
    expect(
      normalizeRecord({
        case_name: "A v B",
        defendant: "B",
        plaintiff: "A",
        district: "S.D.N.Y.",
        date_filed: "not a date",
        case_number: "1:26-cv-1",
        case_url: "https://example.com"
      })
    ).toBeNull();
  });
});
