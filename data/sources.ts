export type Source = {
  id: string;
  outlet: string;
  title: string;
  url: string;
  date: string;
};

// One source per applicant. Program facts cite the Applicant Guidebook
// inline as "AGB §x.x" — no link needed.
export const sources: Source[] = [
  {
    id: "dnw",
    outlet: "Domain Name Wire",
    title: "Oinkadot reveals its 25 new TLD applications",
    url: "https://domainnamewire.com/2026/08/15/oinkadot-tlds/",
    date: "2026-08-15",
  },
  {
    id: "lfg",
    outlet: "Link Freedom Group",
    title: "lfg.link — full list of its 316 applied-for strings",
    url: "https://lfg.link/",
    date: "2026",
  },
  {
    id: "tld1",
    outlet: "TLD1 LLC",
    title: "tld1.llc — four applied-for strings",
    url: "https://tld1.llc/",
    date: "2026-08-15",
  },
  {
    id: "ibest",
    outlet: "internet.Best",
    title: "internet.best/icann2026 — ten applied-for strings",
    url: "https://internet.best/icann2026",
    date: "2026-08-15",
  },
  {
    id: "endpoint",
    outlet: "Endpoint Domains",
    title: "endpointdomains.com — eight primary applications revealed, more to come",
    url: "https://endpointdomains.com/",
    date: "2026-08-16",
  },
  {
    id: "cb",
    outlet: "Crypto Briefing",
    title: "Wiz submits community application for .bitcoin ahead of the deadline",
    url: "https://cryptobriefing.com/wiz-bitcoin-domain-icann-application/",
    date: "2026-08-05",
  },
  {
    id: "tomx",
    outlet: "X (@T0M_3D)",
    title:
      "Founder post — suffix.domains applied at ICANN for 13 primary strings",
    url: "https://x.com/T0M_3D/status/2089070697025057081",
    date: "2026-08-16",
  },
  {
    id: "xiyou",
    outlet: "Journey To The West Corporation",
    title: "xiyou.domains — 323 applied-for strings",
    url: "https://xiyou.domains/",
    date: "2026-08-17",
  },
  {
    id: "dnw-sp",
    outlet: "Domain Name Wire",
    title: "Two more applicants disclose their top level domain strings",
    url: "https://domainnamewire.com/2026/08/17/suffix-phoenix/",
    date: "2026-08-17",
  },
  {
    id: "kasmi-x",
    outlet: "X (@kasmiyouness1)",
    title: "We have applied for .bit and .ion",
    url: "https://x.com/kasmiyouness1/status/2089299017314316687",
    date: "2026-08-17",
  },
  {
    id: "suins-x",
    outlet: "X (@SuiNSdapp)",
    title: "Sui Naming Limited submitted its application for the .sui TLD",
    url: "https://x.com/SuiNSdapp/status/2089269077747355832",
    date: "2026-08-17",
  },
  {
    id: "gnw-factory",
    outlet: "GlobeNewswire (press release)",
    title: "USA Made in America announces application for .factory",
    url: "https://www.globenewswire.com/news-release/2026/08/14/3345503/0/en/usa-made-in-america-announces-application-for-factory-generic-top-level-domain.html",
    date: "2026-08-14",
  },
  {
    id: "dnw-ns",
    outlet: "Domain Name Wire",
    title: "Name Space applies for 10 top level domains",
    url: "https://domainnamewire.com/2026/08/18/name-space/",
    date: "2026-08-18",
  },
  {
    id: "durov-x",
    outlet: "X (@durov)",
    title: "Founder post — Telegram has applied for the .gram domain zone",
    url: "https://x.com/durov/status/2089770867576172804",
    date: "2026-08-18",
  },
  {
    id: "easy-rns",
    outlet: "easyGroup Holdings Ltd (RNS)",
    title: "easyGroup Ltd submits application for .easy domain",
    url: "https://investing.thisismoney.co.uk/rns/news/36148225",
    date: "2026-08-18",
  },
  {
    id: "dnw-starlight",
    outlet: "Domain Name Wire",
    title: "Namecheap applies for 40 top level domains",
    url: "https://domainnamewire.com/2026/08/19/namecheap-starlight/",
    date: "2026-08-19",
  },
];

export const sourceIndex = new Map(sources.map((s, i) => [s.id, i + 1]));
