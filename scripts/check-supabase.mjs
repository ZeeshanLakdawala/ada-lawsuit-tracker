import { createClient } from "@supabase/supabase-js";
import { readEnvFile } from "./env.mjs";

const env = readEnvFile();
const rawUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!rawUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabaseUrl = new URL(rawUrl).origin;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const { count, error } = await supabase
  .from("cases")
  .select("id", { count: "exact" })
  .limit(1);

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(JSON.stringify({ table: "cases", reachable: true, count }));
