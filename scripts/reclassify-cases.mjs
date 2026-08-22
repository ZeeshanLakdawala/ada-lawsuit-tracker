import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./env.mjs";

const INDUSTRIES = new Set([
  "Ecommerce",
  "SaaS",
  "Healthcare",
  "Finance",
  "Education",
  "Hospitality",
  "Government",
  "Other"
]);

const env = readEnvFile();
const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = env.GEMINI_API_KEY;
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 100);

if (!rawUrl || !serviceRoleKey || !geminiKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GEMINI_API_KEY");
  process.exit(1);
}

const supabase = createClient(new URL(rawUrl).origin, serviceRoleKey, {
  auth: { persistSession: false }
});

const { data: cases, error } = await supabase
  .from("cases")
  .select("id,case_name,defendant,industry")
  .eq("industry", "Other")
  .order("date_filed", { ascending: false })
  .limit(limit);

if (error) {
  console.error(error.message);
  process.exit(1);
}

let updated = 0;
let unchanged = 0;

for (const caseRecord of cases ?? []) {
  const industry = await classifyIndustry(caseRecord.defendant, caseRecord.case_name);

  if (industry === caseRecord.industry) {
    unchanged += 1;
    continue;
  }

  const { error: updateError } = await supabase
    .from("cases")
    .update({ industry })
    .eq("id", caseRecord.id);

  if (updateError) {
    console.error(updateError.message);
    process.exit(1);
  }

  updated += 1;
}

console.log(
  JSON.stringify({
    scanned: cases?.length ?? 0,
    updated,
    unchanged
  })
);

async function classifyIndustry(defendant, caseName) {
  if (!defendant?.trim()) {
    return "Other";
  }

  const models = [env.GEMINI_MODEL, "gemini-1.5-flash", "gemini-flash-lite-latest", "gemini-flash-latest"].filter(
    Boolean
  );
  const prompt = `Classify the company into one of these categories:
[Ecommerce, SaaS, Healthcare, Finance, Education, Hospitality, Government, Other]

Company: ${defendant}
Case: ${caseName}

Return ONLY one category.`;

  for (const model of Array.from(new Set(models))) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
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
        continue;
      }

      const data = await response.json();
      const value = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (INDUSTRIES.has(value)) {
        return value;
      }
    } catch {
      continue;
    }
  }

  return "Other";
}
