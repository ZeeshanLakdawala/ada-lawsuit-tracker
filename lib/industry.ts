import { INDUSTRIES, type Industry } from "@/lib/types";

const INDUSTRY_SET = new Set<string>(INDUSTRIES);

export function parseIndustry(value: string | null | undefined): Industry {
  const cleanValue = value?.trim();

  if (cleanValue && INDUSTRY_SET.has(cleanValue)) {
    return cleanValue as Industry;
  }

  return "Other";
}

export async function classifyIndustry(defendant: string): Promise<Industry> {
  if (!defendant.trim()) {
    return "Other";
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return "Other";
  }

  const prompt = `You are classifying entities into predefined industries.

Categories:
[Ecommerce, SaaS, Healthcare, Finance, Education, Hospitality, Government, Other]

Rules:
- Return ONLY one category
- No explanation
- If unsure -> closest category
- If individual -> Other

Defendant: ${defendant}

Answer:`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 8
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
      if (attempt === 1) {
        return "Other";
      }
    }
  }

  return "Other";
}
