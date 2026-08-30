import { getCasesRepository } from "@/lib/cases-repository";
import { continueBrightDataSync } from "@/lib/brightdata-sync";

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const repository = getCasesRepository();
  const result = await continueBrightDataSync(repository, undefined, {
    startPage: 1,
    maxPage: Number(process.env.BRIGHTDATA_SYNC_MAX_PAGE ?? 20)
  });

  console.log("Bright Data cron sync finished", result);

  return Response.json({
    ok: true,
    result
  });
}
