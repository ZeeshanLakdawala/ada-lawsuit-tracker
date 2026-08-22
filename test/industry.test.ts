import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyIndustry, parseIndustry } from "@/lib/industry";

const originalGeminiKey = process.env.GEMINI_API_KEY;

afterEach(() => {
  process.env.GEMINI_API_KEY = originalGeminiKey;
  vi.restoreAllMocks();
});

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

  it("tries the current Flash alias when the PRD model is unavailable", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: "Ecommerce" }] } }]
          }),
          { status: 200 }
        )
      );

    await expect(classifyIndustry("Ana Luisa Retail LLC", "Benavides Moran v. Ana Luisa Retail LLC")).resolves.toBe(
      "Ecommerce"
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("gemini-1.5-flash");
    expect(fetchMock.mock.calls[1][0]).toContain("gemini-flash-lite-latest");
  });
});
