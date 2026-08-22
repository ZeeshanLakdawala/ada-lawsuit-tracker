import { describe, expect, it } from "vitest";
import { parseIndustry } from "@/lib/industry";

describe("industry", () => {
  it("accepts a valid category", () => {
    expect(parseIndustry("Finance")).toBe("Finance");
  });

  it("falls back when AI returns a sentence", () => {
    expect(parseIndustry("This company is probably retail ecommerce.")).toBe("Other");
  });

  it("falls back on empty response", () => {
    expect(parseIndustry("")).toBe("Other");
  });
});
