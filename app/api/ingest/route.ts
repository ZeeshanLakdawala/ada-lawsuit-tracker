import { after } from "next/server";
import { continueBrightDataSync } from "@/lib/brightdata-sync";
import { getCasesRepository } from "@/lib/cases-repository";
import { createIngestPost } from "@/lib/ingest-handler";

export const maxDuration = 300;

export async function POST(request: Request) {
  const repository = getCasesRepository();

  return createIngestPost(repository, {
    onAllNew() {
      after(async () => {
        try {
          const result = await continueBrightDataSync(repository);
          console.log("Bright Data continuation finished", result);
        } catch (error) {
          console.error("Bright Data continuation failed", error);
        }
      });
    }
  })(request);
}
