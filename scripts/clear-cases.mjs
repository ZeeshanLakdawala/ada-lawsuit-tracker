import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./env.mjs";

if (!process.argv.includes("--confirm")) {
  console.error("Refusing to delete rows without --confirm");
  console.error("Usage: pnpm db:clear-cases -- --confirm");
  process.exit(1);
}

const env = readEnvFile();
const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!rawUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(new URL(rawUrl).origin, serviceRoleKey, {
  auth: { persistSession: false }
});

const { error } = await supabase.from("cases").delete().neq("id", "00000000-0000-0000-0000-000000000000");

if (error) {
  console.error(error.message);
  process.exit(1);
}

const { count, error: countError } = await supabase
  .from("cases")
  .select("id", { count: "exact" })
  .limit(1);

if (countError) {
  console.error(countError.message);
  process.exit(1);
}

console.log(JSON.stringify({ table: "cases", remainingRows: count }));
