import { INDUSTRIES, type Industry } from "@/lib/types";

const INDUSTRY_SET = new Set<string>(INDUSTRIES);

export function parseIndustry(value: string | null | undefined): Industry {
  const cleanValue = value?.trim();

  if (cleanValue && INDUSTRY_SET.has(cleanValue)) {
    return cleanValue as Industry;
  }

  return "Other";
}

export async function classifyIndustry(defendant: string, caseName = ""): Promise<Industry> {
  if (!defendant.trim()) {
    return "Other";
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return "Other";
  }

  const prompt = `Classify the company into one of these categories:
[Ecommerce, SaaS, Healthcare, Finance, Education, Hospitality, Government, Other]

Company: ${defendant}
Case: ${caseName}

Return ONLY one category.`;

  const models = Array.from(
    new Set(
      [process.env.GEMINI_MODEL, "gemini-1.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"].filter(
        Boolean
      )
    )
  );

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 100
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed with ${response.status}`);
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return parseIndustry(text);
    } catch (error) {
      continue;
    }
  }

  return "Other";
}
