import { describe, expect, it } from "vitest";
import { districtToState } from "@/lib/district-state";

describe("districtToState", () => {
  it("maps common federal districts", () => {
    expect(districtToState("S.D.N.Y.")).toBe("New York");
    expect(districtToState("S.D. Fla.")).toBe("Florida");
    expect(districtToState("E.D. Wis.")).toBe("Wisconsin");
  });

  it("returns Unknown for unmapped districts", () => {
    expect(districtToState("D. Example")).toBe("Unknown");
  });
});
