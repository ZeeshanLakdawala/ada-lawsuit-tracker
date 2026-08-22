import { describe, expect, it } from "vitest";
import {
  cleanCaseName,
  cleanPartyName,
  cleanText,
  cleanUrl,
  extractPlaintiffFromCaseName,
  normalizeDate,
  normalizeRecord,
  parsePartiesFromCaseName
} from "@/lib/cleaning";

describe("cleaning", () => {
  it("removes parenthetical suffix from case name", () => {
    expect(cleanCaseName("ABC v XYZ (2025)")).toBe("ABC v XYZ");
  });

  it("trims text and trailing punctuation", () => {
    expect(cleanText("  ABC Inc. ")).toBe("ABC Inc");
  });

  it("removes jurisdiction descriptions from party names", () => {
    expect(
      cleanPartyName(
        "Partners Preferred Yield II, Ltd., a California Limited Partnership, Colorado Authority Relinquished December 15, 2005"
      )
    ).toBe("Partners Preferred Yield II, Ltd");
    expect(cleanPartyName("PCH Lube Center, A California Limited Partnership")).toBe("PCH Lube Center");
  });

  it("rejects missing case number", () => {
    expect(
      normalizeRecord({
        case_name: "A v B",
        defendant: "B",
        plaintiff: "A",
        district: "S.D.N.Y.",
        date_filed: "2026-08-20",
        case_url: "https://example.com"
      })
    ).toBeNull();
  });

  it("rejects invalid dates", () => {
    expect(
      normalizeRecord({
        case_name: "A v B",
        defendant: "B",
        plaintiff: "A",
        district: "S.D.N.Y.",
        date_filed: "not a date",
        case_number: "1:26-cv-1",
        case_url: "https://example.com"
      })
    ).toBeNull();
  });

  it("normalizes ordinal month dates from Bright Data", () => {
    expect(normalizeDate("August 21st, 2026")).toBe("2026-08-21");
  });

  it("normalizes Bright Data field aliases", () => {
    expect(
      normalizeRecord({
        case_name: "Benavides\nMoran v. Ana Luisa Retail LLC (S.D.N.Y. 2026)",
        defendant_name: "Ana Luisa Retail\nLLC",
        plaintiff_name: "Washington\nBenavides Moran",
        court: "S.D.N.Y.",
        date_filed: "August\n21st, 2026",
        docket_number: "1:26-cv-07125",
        case_url: "[https://www.courtlistener.com/docket/74681587/benavides-moran-v-ana-luisa-retail-llc/]"
      })
    ).toEqual({
      case_name: "Benavides Moran v. Ana Luisa Retail LLC",
      defendant: "Ana Luisa Retail LLC",
      plaintiff: "Washington Benavides Moran",
      district: "S.D.N.Y",
      date_filed: "2026-08-21",
      case_number: "1:26-cv-07125",
      case_url: "https://www.courtlistener.com/docket/74681587/benavides-moran-v-ana-luisa-retail-llc/"
    });
  });

  it("uses case name when Bright Data gives a plaintiff suffix fragment", () => {
    expect(
      normalizeRecord({
        case_name: "Benavides Moran v. Scandinavian Designs, Inc. (S.D.N.Y. 2026)",
        defendant_name: "Scandinavian Designs",
        plaintiff_name: "Inc.",
        court: "S.D.N.Y.",
        date_filed: "August 21st, 2026",
        docket_number: "1:26-cv-07126",
        case_url: "https://example.com/case"
      })
    ).toMatchObject({
      case_name: "Benavides Moran v. Scandinavian Designs, Inc.",
      plaintiff: "Benavides Moran",
      defendant: "Scandinavian Designs, Inc"
    });
  });

  it("uses case name direction when Bright Data reverses parties", () => {
    expect(
      normalizeRecord({
        case_name: "Stanley v. ARFAAN Investments, LLC (N.D. Ga. 2026)",
        defendant_name: "Solomon Stanley",
        plaintiff_name: "ARFAAN Investments",
        court: "N.D. Ga.",
        date_filed: "August 12th, 2026",
        docket_number: "1:26-cv-04548",
        case_url: "https://example.com/case"
      })
    ).toMatchObject({
      case_name: "Stanley v. ARFAAN Investments, LLC",
      plaintiff: "Stanley",
      defendant: "ARFAAN Investments, LLC"
    });
  });

  it("keeps expanded plaintiff names when they match the case name plaintiff", () => {
    expect(
      normalizeRecord({
        case_name: "Benavides Moran v. Ana Luisa Retail LLC (S.D.N.Y. 2026)",
        defendant_name: "Ana Luisa Retail LLC",
        plaintiff_name: "Washington Benavides Moran",
        court: "S.D.N.Y.",
        date_filed: "August 21st, 2026",
        docket_number: "1:26-cv-07125",
        case_url: "https://example.com/case"
      })
    ).toMatchObject({
      plaintiff: "Washington Benavides Moran",
      defendant: "Ana Luisa Retail LLC"
    });
  });

  it("extracts plaintiff names from case names", () => {
    expect(extractPlaintiffFromCaseName("Dena Peterson v. Bagelnow Bakeshop LLC")).toBe("Dena Peterson");
  });

  it("parses party direction from case names", () => {
    expect(parsePartiesFromCaseName("Pagan v. Dolce & Gabbana USA Inc. (S.D. Fla. 2026)")).toEqual({
      plaintiff: "Pagan",
      defendant: "Dolce & Gabbana USA Inc"
    });
  });

  it("keeps descriptive plaintiff captions intact", () => {
    expect(
      parsePartiesFromCaseName(
        "A.A., a minor, by and through his Next Friend, B.B. v. Mobile County Public School System"
      )
    ).toEqual({
      plaintiff: "A.A., a minor, by and through his Next Friend, B.B",
      defendant: "Mobile County Public School System"
    });
  });

  it("keeps legal suffixes from case names when Bright Data truncates defendants", () => {
    expect(
      normalizeRecord({
        case_name: "Benavides Moran v. J & J Group, LLC (S.D.N.Y. 2026)",
        defendant_name: "J & J Group",
        plaintiff_name: "Benavides Moran",
        court: "S.D.N.Y.",
        date_filed: "August 14th, 2026",
        docket_number: "1:26-cv-06946",
        case_url: "https://example.com/case"
      })
    ).toMatchObject({
      defendant: "J & J Group, LLC"
    });
  });

  it("extracts a URL from markdown link text", () => {
    expect(cleanUrl("[https://example.com/case](https://example.com/case)")).toBe(
      "https://example.com/case"
    );
  });
});
