import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./env.mjs";

const INDUSTRIES = new Set([
  "Retail",
  "Real Estate",
  "Ecommerce",
  "Healthcare",
  "Education",
  "Hospitality",
  "Financial",
  "Technology",
  "Travel",
  "Other"
]);

const env = readEnvFile();
const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = env.GEMINI_API_KEY;
const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? 100);
const delayMs = Number(process.argv.find((arg) => arg.startsWith("--delay-ms="))?.split("=")[1] ?? 4200);
const reclassifyAll = process.argv.includes("--all");

if (!rawUrl || !serviceRoleKey || !geminiKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GEMINI_API_KEY");
  process.exit(1);
}

const supabase = createClient(new URL(rawUrl).origin, serviceRoleKey, {
  auth: { persistSession: false }
});

let query = supabase
  .from("cases")
  .select("id,case_name,defendant,industry")
  .order("date_filed", { ascending: false })
  .limit(limit);

if (!reclassifyAll) {
  query = query.eq("industry", "Other");
}

const { data: cases, error } = await query;

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
    await waitBetweenGeminiCalls();
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
  await waitBetweenGeminiCalls();
}

async function waitBetweenGeminiCalls() {
  if (delayMs > 0) {
    await sleep(delayMs);
  }
}

console.log(
  JSON.stringify({
    scanned: cases?.length ?? 0,
    updated,
    unchanged
  })
);

async function classifyIndustry(defendant, caseName) {
  if (isUnclassifiableDefendant(defendant ?? "")) {
    return "Other";
  }

  const models = [env.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-flash-lite-latest"].filter(Boolean);
  const prompt = `Classify the company into one of these categories:
[Retail, Real Estate, Healthcare, Hospitality, Financial, Education, Technology, Ecommerce, Travel, Other]

Company: ${defendant}
Case: ${caseName}

Return ONLY one category.
If the company cannot be identified, return Other.
If the defendant is a person name, return Other.`;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUnclassifiableDefendant(defendant) {
  const value = defendant.trim();

  if (!value) {
    return true;
  }

  if (["inc", "inc.", "llc", "ltd", "ltd.", "corp", "corp.", "company"].includes(value.toLowerCase())) {
    return true;
  }

  return value.split(/\s+/).length === 1 && ["inc", "inc.", "llc", "ltd", "ltd.", "corp", "corp.", "company"].includes(value.toLowerCase());
}
