import { announced, type Announced } from "./announced";
import { slugify } from "@/lib/format";
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

// Scraped lead name -> the hand-written applicant it is the same entity as.
// Joined on the name a third party prints, so an upstream rewording silently
// mints a second slug for one applicant and every string it holds turns into
// a fabricated overlap. `tests/` asserts each key still appears upstream.
export const ALIASES: Record<string, string> = {
  "unstoppable domains": "unstoppable",
  "d3 global": "d3",
  "freename.io": "freename",
  "3dns": "3dns",
};

export const leadSlug = (lead: string) =>
  ALIASES[lead.toLowerCase()] ?? `aa-${slugify(lead)}`;

const byLead = new Map<string, Announced[]>();
for (const r of announced) {
  const k = leadSlug(r.lead);
  const group = byLead.get(k);
  if (group) group.push(r);
  else byLead.set(k, [r]);
}

// One source per distinct trade-press URL the table cites. Applicant Auction
// compiled the list; the announcement itself is what we link to.
const OUTLETS: Record<string, string> = {
  "domainincite.com": "Domain Incite",
  "domainnamewire.com": "Domain Name Wire",
  "unstoppabledomains.com": "Unstoppable Domains",
  "globenewswire.com": "GlobeNewswire",
  "prnewswire.com": "PR Newswire",
  "businesswire.com": "Business Wire",
  "coinspeaker.com": "Coinspeaker",
  "circleid.com": "CircleID",
  "abion.com": "Abion",
  "news.google.com": "Google News (syndicated)",
};

// A wire release is the applicant's own words, so it counts as a statement —
// which is what the "Applicant statements" heading on /sources already says,
// so the outlet name does not repeat it.
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

// Upstream marks withdrawal per string: the Unstoppable/Kintsugi row pulled
// .manga and kept .anime, so a row filter would either lose the withdrawal or
// take the live string down with it.
const liveStrings = (r: Announced) =>
  r.strings.filter((t) => !r.withdrawnStrings.includes(t));

export const announcedApplicants: Applicant[] = [...byLead]
  .filter(([, rows]) => !(rows[0].lead.toLowerCase() in ALIASES))
  .map(([slug, rows]) => {
    const live = rows.map((r) => liveStrings(r)).flat();
    const partners = [...new Set(rows.flatMap((r) => r.partners))];
    const noted = rows.find((r) => r.note)?.note ?? null;
    return {
      slug,
      status: "intent" as const,
      name: rows[0].lead,
      backers: partners.length ? `With ${partners.join(", ")}` : "People undisclosed",
      applicationCount: String(new Set(live).size),
      feesPaid: null,
      revealedOn: rows.map((r) => r.date).sort()[0],
      note: noted,
      sourceIds: [
        ...new Set(
          rows
            .map((r) => r.sourceUrl && urlIds.get(r.sourceUrl))
            .filter((x): x is string => !!x)
        ),
      ],
    };
  });

// Extra strings for applicants we already track by hand.
export const announcedClaims: Claim[] = announced.flatMap((r) =>
    liveStrings(r).map((tld) => ({
      tld,
      applicantSlug: leadSlug(r.lead),
      kind: "intent" as const,
      sourceIds: r.sourceUrl ? [urlIds.get(r.sourceUrl)!] : [],
    }))
  );

// Announced and then pulled before filing. Shown on its own, counted nowhere.
export const withdrawnClaims = announced.flatMap((r) =>
    r.withdrawnStrings.map((tld) => ({
      tld,
      applicant: r.lead,
      partners: r.partners,
      withdrawnUrl: r.withdrawnUrl,
      sourceId: r.sourceUrl ? urlIds.get(r.sourceUrl)! : null,
      date: r.date,
    }))
  );
