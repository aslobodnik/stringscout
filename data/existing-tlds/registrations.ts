import snapshot from "./registration-counts.json";

const month = String(snapshot.proposed.find(row => row.reportingMonth !== null)!.reportingMonth);

// Keep the source audit data on the server; send only display counts to Explore.
export const exploreRegistrations = {
  counts: Object.fromEntries(snapshot.proposed.flatMap(row =>
    typeof row.registeredDomains === "number" ? [[row.tld, row.registeredDomains]] : []
  )) as Record<string, number>,
  month: `${month.slice(0, 4)}-${month.slice(4)}`,
  source: snapshot.source,
  sourceLabel: "nTLDData",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
};
