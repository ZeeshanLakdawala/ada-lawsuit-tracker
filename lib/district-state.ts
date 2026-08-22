const DISTRICT_STATE_MAP: Record<string, string> = {
  "C.D. Cal.": "California",
  "N.D. Cal.": "California",
  "S.D. Cal.": "California",
  "E.D. Cal.": "California",
  "S.D.N.Y.": "New York",
  "E.D.N.Y.": "New York",
  "N.D.N.Y.": "New York",
  "W.D.N.Y.": "New York",
  "S.D. Fla.": "Florida",
  "M.D. Fla.": "Florida",
  "N.D. Fla.": "Florida",
  "E.D. Wis.": "Wisconsin",
  "W.D. Wis.": "Wisconsin",
  "N.D. Ill.": "Illinois",
  "C.D. Ill.": "Illinois",
  "S.D. Ill.": "Illinois",
  "D. Mass.": "Massachusetts",
  "D. Minn.": "Minnesota",
  "D. Md.": "Maryland",
  "D.N.J.": "New Jersey",
  "D.D.C.": "District of Columbia",
  "D. Colo.": "Colorado",
  "N.D. Ga.": "Georgia",
  "S.D. Ohio": "Ohio",
  "W.D. Pa.": "Pennsylvania",
  "W.D. Wash.": "Washington",
  "E.D. Missouri": "Missouri"
};

export function districtToState(district: string) {
  return DISTRICT_STATE_MAP[normalizeDistrict(district)] ?? "Unknown";
}

function normalizeDistrict(district: string) {
  return district.trim().replace(/\s+/g, " ").replace(/\.$/, ".");
}
