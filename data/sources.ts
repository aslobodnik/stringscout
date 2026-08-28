import { announcedSources } from "./announcedAdapter";

// Where a claim came from, in descending order of authority. "applicant" is
// the applicant speaking for itself, wire releases included; "trade" is the
// domain-industry press; "press" is everyone else reporting it secondhand;
// "reference" is not a reveal source at all.
export type SourceKind = "applicant" | "trade" | "press" | "reference";

export type Source = {
  id: string;
  outlet: string;
  title: string;
  url: string;
  date: string;
  kind: SourceKind;
};

export const KIND_ORDER: SourceKind[] = [
  "applicant",
  "trade",
  "press",
  "reference",
];

export const KIND_LABEL: Record<SourceKind, string> = {
  applicant: "Applicant statements",
  trade: "Trade press",
  press: "General press",
  reference: "Reference",
};

// One source per applicant. Program facts cite the Applicant Guidebook
// inline as "AGB §x.x" — no link needed.
const handSources: Source[] = [
  {
    id: "dnw",
    outlet: "Domain Name Wire",
    title: "Oinkadot reveals its 25 new TLD applications",
    url: "https://domainnamewire.com/2026/08/15/oinkadot-tlds/",
    date: "2026-08-15",
    kind: "trade",
  },
  {
    id: "lfg",
    outlet: "Link Freedom Group",
    title: "lfg.link — full list of its 316 applied-for strings",
    url: "https://lfg.link/",
    date: "2026-08-13",
    kind: "applicant",
  },
  {
    id: "tld1",
    outlet: "TLD1 LLC",
    title: "tld1.llc — four applied-for strings",
    url: "https://tld1.llc/",
    date: "2026-08-15",
    kind: "applicant",
  },
  {
    id: "ibest",
    outlet: "internet.Best",
    title: "internet.best/icann2026 — ten applied-for strings",
    url: "https://internet.best/icann2026",
    date: "2026-08-15",
    kind: "applicant",
  },
  {
    id: "endpoint",
    outlet: "Endpoint Domains",
    title: "endpointdomains.com — eight primary applications revealed, more to come",
    url: "https://endpointdomains.com/",
    date: "2026-08-16",
    kind: "applicant",
  },
  {
    id: "cb",
    outlet: "Crypto Briefing",
    title: "Wiz submits community application for .bitcoin ahead of the deadline",
    url: "https://cryptobriefing.com/wiz-bitcoin-domain-icann-application/",
    date: "2026-08-05",
    kind: "press",
  },
  {
    id: "tomx",
    outlet: "X (@T0M_3D)",
    title:
      "Founder post — suffix.domains applied at ICANN for 13 primary strings",
    url: "https://x.com/T0M_3D/status/2089070697025057081",
    date: "2026-08-16",
    kind: "applicant",
  },
  {
    id: "xiyou",
    outlet: "Journey To The West Corporation",
    title: "xiyou.domains — 323 applied-for strings",
    url: "https://xiyou.domains/",
    date: "2026-08-17",
    kind: "applicant",
  },
  {
    id: "dnw-sp",
    outlet: "Domain Name Wire",
    title: "Two more applicants disclose their top level domain strings",
    url: "https://domainnamewire.com/2026/08/17/suffix-phoenix/",
    date: "2026-08-17",
    kind: "trade",
  },
  {
    id: "kasmi-x",
    outlet: "X (@kasmiyouness1)",
    title: "We have applied for .bit and .ion",
    url: "https://x.com/kasmiyouness1/status/2089299017314316687",
    date: "2026-08-17",
    kind: "applicant",
  },
  {
    id: "suins-x",
    outlet: "X (@SuiNSdapp)",
    title: "Sui Naming Limited submitted its application for the .sui TLD",
    url: "https://x.com/SuiNSdapp/status/2089269077747355832",
    date: "2026-08-17",
    kind: "applicant",
  },
  {
    id: "gnw-factory",
    outlet: "GlobeNewswire",
    title: "USA Made in America announces application for .factory",
    url: "https://www.globenewswire.com/news-release/2026/08/14/3345503/0/en/usa-made-in-america-announces-application-for-factory-generic-top-level-domain.html",
    date: "2026-08-14",
    kind: "applicant",
  },
  {
    id: "dnw-ns",
    outlet: "Domain Name Wire",
    title: "Name Space applies for 10 top level domains",
    url: "https://domainnamewire.com/2026/08/18/name-space/",
    date: "2026-08-18",
    kind: "trade",
  },
  {
    id: "durov-x",
    outlet: "X (@durov)",
    title: "Founder post — Telegram has applied for the .gram domain zone",
    url: "https://x.com/durov/status/2089770867576172804",
    date: "2026-08-18",
    kind: "applicant",
  },
  {
    id: "easy-rns",
    outlet: "easyGroup Holdings Ltd (RNS)",
    title: "easyGroup Ltd submits application for .easy domain",
    url: "https://investing.thisismoney.co.uk/rns/news/36148225",
    date: "2026-08-18",
    kind: "applicant",
  },
  {
    id: "dnw-starlight",
    outlet: "Domain Name Wire",
    title: "Namecheap applies for 40 top level domains",
    url: "https://domainnamewire.com/2026/08/19/namecheap-starlight/",
    date: "2026-08-19",
    kind: "trade",
  },
  {
    id: "dnw-grit",
    outlet: "Domain Name Wire",
    title: "Brian Harbin hopes to spread grit with .grit top level domain name",
    url: "https://domainnamewire.com/2026/08/20/brian-harbin-hopes-to-spread-grit-with-grit-top-level-domain-name/",
    date: "2026-08-20",
    kind: "trade",
  },
  {
    id: "hccf-x",
    outlet: "X (@humanccf)",
    title: "The ICANN submission deadline is today, and our application is in (portal screenshot: submitted 12 Aug 2026)",
    url: "https://x.com/humanccf/status/2087692172824911977",
    date: "2026-08-13",
    kind: "applicant",
  },
  {
    id: "ud-filed",
    outlet: "Unstoppable Domains",
    title: "ICANN Applications are in! Some TLDs are eligible for a refund.",
    url: "https://unstoppabledomains.com/blog/categories/announcements/article/icann-applications-are-in",
    date: "2026-08-25",
    kind: "applicant",
  },
  {
    id: "d3-gate-x",
    outlet: "X (@D3inc)",
    title: "Gate Naming Limited have applied to ICANN for the .gate Top-Level Domain",
    url: "https://x.com/D3inc/status/2090832875218415649",
    date: "2026-08-21",
    kind: "press",
  },
  {
    id: "radix",
    outlet: "Radix",
    title: "deux.radix.website — 46 primary applications",
    url: "https://deux.radix.website/",
    date: "2026-08-27",
    kind: "applicant",
  },
  {
    id: "agentcommunity",
    outlet: "Agent Community",
    title: "We Filed the .agent Application. Here Is What It Took.",
    url: "https://agentcommunity.org/blog/we-filed-the-agent-application",
    date: "2026-08-29",
    kind: "applicant",
  },
  {
    id: "di",
    outlet: "Domain Incite",
    title: "Second new gTLD contention set revealed",
    url: "https://domainincite.com/30812-second-new-gtld-contention-set-revealed",
    date: "2025-02-27",
    kind: "trade",
  },
  {
    id: "iana",
    outlet: "IANA",
    title: "Root Zone Database",
    url: "https://www.iana.org/domains/root/db",
    date: "2026-08-27",
    kind: "reference",
  },
];

// Numbered in bucket order so a superscript resolves to exactly one entry and
// the numbering matches the order they are printed on /sources.
export const sources: Source[] = [...handSources, ...announcedSources].sort(
  (a, b) =>
    KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) ||
    a.date.localeCompare(b.date) ||
    // 23 sources share a bucket and a date; without this their numbers are
    // decided by upstream row order and shuffle on every re-scrape
    a.id.localeCompare(b.id)
);

export const sourceIndex = new Map(sources.map((s, i) => [s.id, i + 1]));

export const sourceById = new Map(sources.map((s) => [s.id, s]));
