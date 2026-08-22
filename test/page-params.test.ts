import { describe, expect, it } from "vitest";
import { caseListPageHref, isUuid, parseCaseListParams } from "@/lib/page-params";

describe("page params", () => {
  it("keeps valid filters", () => {
    expect(
      parseCaseListParams({
        district: "S.D.N.Y.",
        industry: "Retail",
        timeRange: "30",
        page: "3"
      })
    ).toEqual({
      district: "S.D.N.Y.",
      industry: "Retail",
      timeRange: "30",
      page: 3
    });
  });

  it("drops invalid filters and page values", () => {
    expect(
      parseCaseListParams({
        industry: "Finance",
        timeRange: "90",
        page: "0"
      })
    ).toEqual({ district: undefined, industry: undefined, timeRange: undefined, page: 1 });
  });

  it("never builds page zero links", () => {
    expect(caseListPageHref(0, { page: 1, industry: "Retail" })).toBe("/?industry=Retail&page=1");
  });

  it("validates route ids as UUIDs", () => {
    expect(isUuid("00000000-0000-4000-8000-000000000000")).toBe(true);
    expect(isUuid("not-a-case-id")).toBe(false);
  });
});
