// Disclosed strings that are already delegated TLDs (checked against the IANA
// root zone list, 2026-08-19). All six appear on xiyou.domains but cannot be
// applied for in the 2026 round. Each one links out to its own page in the
// IANA Root Zone Database, www.iana.org/domains/root/db/<punycode>.html.
// Re-check new claims against
// https://data.iana.org/TLD/tlds-alpha-by-domain.txt when adding data.
export const existingTlds: string[] = [
  "fan",
  "furniture",
  "silk",
  "soy",
  "storage",
  "公益", // xn--55qw42g
];
