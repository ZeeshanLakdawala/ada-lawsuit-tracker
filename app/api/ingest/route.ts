import { getCasesRepository } from "@/lib/cases-repository";
import { createIngestPost } from "@/lib/ingest-handler";

export async function POST(request: Request) {
  return createIngestPost(getCasesRepository())(request);
}
