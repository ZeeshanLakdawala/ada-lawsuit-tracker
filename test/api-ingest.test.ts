import { describe, expect, it } from "vitest";
import { createIngestPost, parseWebhookBody } from "@/lib/ingest-handler";
import { MemoryCasesRepository } from "./memory-repository";

const record = {
  case_name: "Jane Doe v Example Store Inc. (2026)",
  defendant: "Example Store Inc.",
  plaintiff: "Jane Doe",
  district: "S.D.N.Y.",
  date_filed: "2026-08-20",
  case_number: "1:26-cv-12345",
  case_url: "https://example.com/case"
};

describe("POST /api/ingest", () => {
  it("returns success for a valid Bright Data payload", async () => {
    const repository = new MemoryCasesRepository();
    const post = createIngestPost(repository, async () => "Ecommerce");
    const response = await post(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        body: JSON.stringify([{ cases: [record] }])
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      inserted: 1,
      skipped: 0,
      rejected: 0,
      sawDuplicate: false,
      continuationQueued: false
    });
  });

  it("accepts Bright Data aliases inside nested cases", async () => {
    const repository = new MemoryCasesRepository();
    const post = createIngestPost(repository, async () => "Ecommerce");
    const response = await post(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        body: JSON.stringify([
          {
            cases: [
              {
                case_name: "Benavides Moran v. Ana Luisa Retail LLC (S.D.N.Y. 2026)",
                docket_number: "1:26-cv-07125",
                court: "S.D.N.Y.",
                date_filed: "August 21st, 2026",
                plaintiff_name: "Washington Benavides Moran",
                defendant_name: "Ana Luisa Retail LLC",
                case_url:
                  "[https://www.courtlistener.com/docket/74681587/benavides-moran-v-ana-luisa-retail-llc/]"
              }
            ]
          }
        ])
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      inserted: 1,
      skipped: 0,
      rejected: 0,
      sawDuplicate: false,
      continuationQueued: false
    });
    expect(repository.records[0]).toMatchObject({
      case_number: "1:26-cv-07125",
      district: "S.D.N.Y",
      defendant: "Ana Luisa Retail LLC"
    });
  });

  it("accepts Bright Data nested cases arrays", async () => {
    const repository = new MemoryCasesRepository();
    const post = createIngestPost(repository, async () => "Ecommerce");
    const response = await post(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        body: JSON.stringify([
          {
            cases: [
              {
                case_name: "Saenz v. R & D INVESTMENTS, LLC (S.D. Fla. 2026)",
                docket_number: "1:26-cv-25447",
                court: "S.D. Fla.",
                date_filed: "August 12th, 2026",
                plaintiff_name: "LLC",
                defendant_name: "A&Y RESTAURANT",
                case_url: "https://www.courtlistener.com/docket/74639645/saenz-v-r-d-investments-llc/"
              }
            ]
          }
        ])
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      inserted: 1,
      skipped: 0,
      rejected: 0,
      sawDuplicate: false,
      continuationQueued: false
    });
    expect(repository.records[0]).toMatchObject({
      case_number: "1:26-cv-25447",
      plaintiff: "Saenz",
      defendant: "R & D INVESTMENTS, LLC"
    });
  });

  it("repairs escaped underscores and raw newlines from pasted webhook tests", () => {
    const body =
      '[{"cases":[{"case\\_name":"Benavides\nMoran v. Ana Luisa Retail LLC (S.D.N.Y. 2026)","docket\\_number":"1:26-cv-07125"}]}]';

    expect(parseWebhookBody(body)).toEqual([
      {
        cases: [
          {
            case_name: "Benavides Moran v. Ana Luisa Retail LLC (S.D.N.Y. 2026)",
            docket_number: "1:26-cv-07125"
          }
        ]
      }
    ]);
  });

  it("queues continuation only when the page has all new records", async () => {
    const repository = new MemoryCasesRepository();
    const calls: unknown[] = [];
    const post = createIngestPost(repository, {
      classifier: async () => "Ecommerce",
      onAllNew: (result) => calls.push(result)
    });
    const response = await post(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        body: JSON.stringify([{ cases: [record] }])
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ continuationQueued: true });
    expect(calls).toHaveLength(1);
  });

  it("does not queue continuation when a duplicate appears", async () => {
    const repository = new MemoryCasesRepository();
    await repository.insert({ ...record, industry: "Ecommerce" });
    const calls: unknown[] = [];
    const post = createIngestPost(repository, {
      classifier: async () => "Ecommerce",
      onAllNew: (result) => calls.push(result)
    });
    const response = await post(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        body: JSON.stringify([{ cases: [record] }])
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ sawDuplicate: true, continuationQueued: false });
    expect(calls).toHaveLength(0);
  });
});
