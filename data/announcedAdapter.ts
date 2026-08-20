import { announced, type Announced } from "./announced";
import type { Applicant } from "./applicants";
import type { Claim } from "./claims";
import type { Source, SourceKind } from "./sources";

// Turns the scraped announced-intentions table into applicants, claims and
// sources. Done here rather than by hand so re-running the scraper picks up
// new rows without a merge.
//
// Every row is an announcement, never a confirmed filing, so each claim lands
// as kind "intent" and each applicant as status "intent". A withdrawn row is
// one the applicant pulled before filing — Unstoppable's refund page lists the
// strings that never went to ICANN — so it is carried for the record and
// excluded from every count.

// Rows whose lead entity already has a hand-written applicant record.
const EXISTING: Record<string, string> = {
  "unstoppable domains": "unstoppable",
  "d3 global": "d3",
  "freename.io": "freename",
  "3dns": "3dns",
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);

export const leadSlug = (lead: string) =>
  EXISTING[lead.toLowerCase()] ?? `aa-${slugify(lead)}`;

const byLead = new Map<string, Announced[]>();
for (const r of announced) {
  const k = leadSlug(r.lead);
  byLead.set(k, [...(byLead.get(k) ?? []), r]);
}

// One source per distinct trade-press URL the table cites. Applicant Auction
// compiled the list; the announcement itself is what we link to.
const OUTLETS: Record<string, string> = {
  "domainincite.com": "Domain Incite",
  "domainnamewire.com": "Domain Name Wire",
  "unstoppabledomains.com": "Unstoppable Domains",
  "globenewswire.com": "GlobeNewswire (press release)",
  "prnewswire.com": "PR Newswire (press release)",
  "businesswire.com": "Business Wire (press release)",
  "coinspeaker.com": "Coinspeaker",
  "circleid.com": "CircleID",
  "abion.com": "Abion",
  "news.google.com": "Google News (syndicated)",
};

// A wire release is the applicant's own words, so it counts as a statement.
// Anything not listed is an applicant's own domain by default — the table only
// ever links to a reveal's own site or to a publication named here.
const KINDS: Record<string, SourceKind> = {
  "domainincite.com": "trade",
  "domainnamewire.com": "trade",
  "circleid.com": "trade",
  "globenewswire.com": "applicant",
  "prnewswire.com": "applicant",
  "businesswire.com": "applicant",
  "coinspeaker.com": "press",
  "cryptobriefing.com": "press",
  "news.google.com": "press",
};

const hostOf = (url: string) => new URL(url).hostname.replace(/^www\./, "");
const outletOf = (url: string) => OUTLETS[hostOf(url)] ?? hostOf(url);
const kindOf = (url: string): SourceKind => KINDS[hostOf(url)] ?? "applicant";

const urlIds = new Map<string, string>();
export const announcedSources: Source[] = [];
for (const r of announced) {
  if (!r.sourceUrl || urlIds.has(r.sourceUrl)) continue;
  const id = `aa-${urlIds.size + 1}`;
  urlIds.set(r.sourceUrl, id);
  announcedSources.push({
    id,
    outlet: outletOf(r.sourceUrl),
    title: r.sourceTitle.replace(/^[^:]+:\s*/, ""),
    url: r.sourceUrl,
    date: r.date,
    kind: kindOf(r.sourceUrl),
  });
}

const sourceIdsFor = (rows: Announced[]) => [
  ...new Set(rows.map((r) => r.sourceUrl && urlIds.get(r.sourceUrl)).filter((x): x is string => !!x)),
];

export const announcedApplicants: Applicant[] = [...byLead]
  .filter(([slug]) => slug.startsWith("aa-"))
  .map(([slug, rows]) => {
    const live = rows.filter((r) => !r.withdrawn);
    const partners = [...new Set(rows.flatMap((r) => r.partners))];
    const noted = rows.find((r) => r.note)?.note ?? null;
    return {
      slug,
      status: "intent" as const,
      name: rows[0].lead,
      backers: partners.length ? `With ${partners.join(", ")}` : "People undisclosed",
      applicationCount: String(
        new Set(live.flatMap((r) => r.strings)).size
      ),
      feesPaid: null,
      revealedOn: rows.map((r) => r.date).sort()[0],
      note: noted,
      sourceIds: sourceIdsFor(rows),
    };
  });

// Partners named by the scrape, including for applicants first entered by
// hand — their stored "backers" line predates most of these rows.
// Withdrawn rows are excluded: a partner that pulled out is not who is behind
// the application now.
export const announcedPartners = new Map<string, string[]>(
  [...byLead].map(([slug, rows]) => [
    slug,
    [...new Set(rows.filter((r) => !r.withdrawn).flatMap((r) => r.partners))],
  ])
);

// Extra strings for applicants we already track by hand.
export const announcedClaims: Claim[] = announced
  .filter((r) => !r.withdrawn)
  .flatMap((r) =>
    r.strings.map((tld) => ({
      tld,
      applicantSlug: leadSlug(r.lead),
      kind: "intent" as const,
      sourceIds: r.sourceUrl ? [urlIds.get(r.sourceUrl)!] : [],
    }))
  );

// Announced and then pulled before filing. Shown on its own, counted nowhere.
export const withdrawnClaims = announced
  .filter((r) => r.withdrawn)
  .flatMap((r) =>
    r.strings.map((tld) => ({
      tld,
      applicant: r.lead,
      partners: r.partners,
      sourceId: r.sourceUrl ? urlIds.get(r.sourceUrl)! : null,
      date: r.date,
    }))
  );
