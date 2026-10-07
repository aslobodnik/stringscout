// PROTOTYPE, throwaway. Mock Reveal Day data for judging layout only.
// Real: the strings and applicant names (data/claims.ts, kind primary/backup)
// and Vant Nexus's stated replacement strings. Invented: every other
// replacement string, the pairing of Vant Nexus's replacements to its
// primaries, entity fields, application types, the "Mock" applicants, and
// every link between entities. No link is invented between two real companies:
// the only real one carried is Starlight Registry under Namecheap, as disclosed.
import { claims } from "@/data/claims";
import { applicants } from "@/data/applicants";
import { sources } from "@/data/sources";
import { rootZone } from "@/data/rootZone";

export type Status = "open" | "blocked-applied" | "blocked-twin" | "none";
export type AppType = "standard" | "brand" | "geo" | "community";
// who can register: anyone (open), the applicant and its affiliates only
// (brand, AGB Q179), or a registry that asked to keep every name for itself
// (closed: Code of Conduct exemption, AGB Q185-187)
export type Registration = "open" | "brand" | "closed";

// people as the record names them, by the AGB question that asked
export type Role = { role: string; names: string[] };

export type MockApp = {
  id: string;
  tld: string; // the A-label, as the record keys it
  uLabel?: string; // an IDN's U-label, what a reader sees
  applicant: string;
  slug: string;
  replacement: string | null; // A-label
  replacementU?: string; // an IDN replacement's U-label
  status: Status;
  // every application that knocks the replacement out (AGB §5.1): one that
  // applied for the same string, or one that named it as its replacement too
  blockers: { name: string; how: "applied" | "named" }[];
  near?: string; // house issue label when the replacement is a singular/plural of another string
  setSize: number;
  type: AppType;
  registration: Registration;
  entity: {
    jurisdiction: string;
    website: string;
    parent: string | null; // direct parent (AGB Q26), else ultimate (Q36)
    ultimate?: string | null; // ultimate parent (AGB Q36)
    people: string;
    roles?: Role[];
  };
  preReveal: { outlet: string; url: string; date: string } | null;
  fixture: boolean;
  group: string; // slug of the group this applicant belongs to
};

// What ties the entities of a group together, strongest first. The first two
// are stated by the applicant; the last two are inferred from shared details.
export type Link = "parent" | "control" | "person" | "address";

export type MockEntity = {
  slug: string;
  name: string;
  jurisdiction: string;
  people: string;
  roles?: Role[];
  fixture: boolean;
  apps: MockApp[];
};

export type MockGroup = {
  slug: string;
  name: string;
  link: Link | null; // null: one entity filing under its own name
  evidence: string | null; // the detail the link rests on
  entities: MockEntity[];
  apps: MockApp[];
  inSets: number;
  rivals: { slug: string; name: string; tlds: string[] }[]; // groups it meets in a set, most first
};

export type Outlook = "empty" | "resolve" | "stays";

export type MockSet = {
  tld: string;
  apps: MockApp[];
  switchable: number;
  stuck: number; // left if every applicant that can switch does
  outlook: Outlook;
};

// A person the records name, with every entity that names them. Only the
// person questions count (AGB 104 directors, 105 officers, 107 executives);
// shareholders and controllers are often companies.
export type MockPerson = {
  slug: string;
  name: string; // as first printed
  roles: string[]; // every role they hold, across entities
  entities: { slug: string; name: string; roles: string[]; group: string }[];
  apps: MockApp[];
  inSets: number;
};

export type MockData = {
  apps: MockApp[];
  sets: MockSet[];
  people?: MockPerson[]; // most applications first
  groups: MockGroup[]; // most applications first
  stats: {
    groups: number;
    applications: number;
    strings: number;
    applicants: number;
    replacements: number;
    sets: number;
    inContention: number;
    canSwitch: number;
    blocked: number;
    people?: number;
  };
  disclosed: Record<string, number>; // primary strings disclosed before reveal, per applicant
};

// which disclosed strings to carry, kept under 100 applications
const TAKE: Record<string, string[] | "all"> = {
  oinkadot: "all",
  endpoint: "all",
  suffix: "all",
  namespace: "all",
  vantnexus: ["portal", "island", "truck"],
  wiz: "all",
  usamade: "all",
  suinaming: "all",
  telegram: "all",
  easygroup: "all",
  hccf: "all",
  hch: "all",
  dotlocal: "all",
  inwx: "all",
  dotfurry: "all",
  agentcommunity: "all",
  worldchess: "all",
  radix: ["agent", "bit", "stack", "research", "asi", "intelligence", "mart", "profile", "wallet", "mind"],
  starlight: ["asi", "intelligence", "mart", "brain", "fab", "forge"],
};

// slug|tld -> replacement. Vant Nexus's three are its stated replacements
// (data/claims.ts, kind backup); the pairing to primaries is invented.
const REPLACE: Record<string, string> = {
  "vantnexus|portal": "profile",
  "vantnexus|island": "park",
  "vantnexus|truck": "beach",
  "oinkadot|bit": "byte",
  "radix|bit": "byte",
  "oinkadot|stack": "heap",
  "radix|stack": "pile",
  "suffix|research": "inquiry",
  "radix|agent": "agents",
  "radix|asi": "agi",
  "radix|intelligence": "insight",
  "starlight|mart": "emporium",
  "namespace|brain": "cortex",
  "starlight|brain": "mind",
  "starlight|fab": "fabricate",
  "radix|wallet": "vault",
  "mock-a|wallet": "purse",
  "oinkadot|moon": "luna",
  "mock-e|moon": "luna",
  "mock-f|moon": "lunar",
  "mock-g|moon": "luna",
  "oinkadot|dragon": "wyrm",
  "oinkadot|panda": "bamboo",
  "endpoint|happy": "glad",
  "endpoint|true": "real",
  "suffix|this": "real",
  "wiz|bitcoin": "btc",
  "usamade|factory": "foundry",
};

const TYPE: Record<string, AppType> = {
  "easygroup|easy": "brand",
  "telegram|gram": "brand",
  "dotlocal|twente": "geo",
  "dotfurry|furry": "community",
};

const FIXTURES: { slug: string; name: string; tld: string }[] = [
  { slug: "mock-a", name: "Mock Applicant A", tld: "wallet" },
  { slug: "mock-b", name: "Mock Applicant B", tld: "wallet" },
  { slug: "mock-c", name: "Mock Applicant C", tld: "vault" },
  { slug: "mock-e", name: "Mock Applicant E", tld: "moon" },
  { slug: "mock-f", name: "Mock Applicant F", tld: "moon" },
  { slug: "mock-g", name: "Mock Applicant G", tld: "moon" },
  { slug: "mock-h", name: "Mock Applicant H", tld: "luna" },
  { slug: "mock-j", name: "Mock Applicant J", tld: "lantern" },
  { slug: "mock-k", name: "Mock Applicant K", tld: "meadow" },
  { slug: "mock-l", name: "Mock Applicant L", tld: "harbor" },
];

// one of each kind of link, so the layout meets every case
const GROUPS: { slug: string; name: string; link: Link; evidence: string; members: string[] }[] = [
  { slug: "namecheap", name: "Namecheap", link: "parent", evidence: "Namecheap", members: ["starlight"] },
  {
    slug: "mock-holdings",
    name: "Mock Holdings",
    link: "parent",
    evidence: "Mock Holdings",
    members: ["mock-a", "mock-e", "mock-h", "mock-j", "mock-k", "mock-l"],
  },
  { slug: "mock-bf", name: "Mock Applicant B + 1", link: "person", evidence: "P. Placeholder", members: ["mock-b", "mock-f"] },
  { slug: "mock-cg", name: "Mock Applicant C + 1", link: "address", evidence: "1 Placeholder Street, Dover", members: ["mock-c", "mock-g"] },
];
const GROUP_OF = new Map(GROUPS.flatMap((g) => g.members.map((m) => [m, g] as const)));

const JURIS = ["Delaware", "Ireland", "Cayman Islands", "Singapore", "Wyoming", "Germany", "Netherlands", "British Virgin Islands"];

const delegated = new Set(rootZone);

export function buildMock(): MockData {
  const srcById = new Map(sources.map((s) => [s.id, s]));
  const appByslug = new Map(applicants.map((a) => [a.slug, a]));

  type Seed = { slug: string; name: string; tld: string; fixture: boolean; sourceId?: string };
  const seeds: Seed[] = [];
  const seen = new Set<string>();
  for (const c of claims) {
    if (c.kind !== "primary") continue;
    const take = TAKE[c.applicantSlug];
    if (!take) continue;
    if (take !== "all" && !take.includes(c.tld)) continue;
    const k = `${c.applicantSlug}|${c.tld}`;
    if (seen.has(k)) continue;
    seen.add(k);
    seeds.push({
      slug: c.applicantSlug,
      name: appByslug.get(c.applicantSlug)?.name ?? c.applicantSlug,
      tld: c.tld,
      fixture: false,
      sourceId: c.sourceIds[0],
    });
  }
  for (const f of FIXTURES) seeds.push({ slug: f.slug, name: f.name, tld: f.tld, fixture: true });

  // who applied for each string, and who named each replacement
  const appliedBy = new Map<string, Seed[]>();
  for (const s of seeds) appliedBy.set(s.tld, [...(appliedBy.get(s.tld) ?? []), s]);
  const replacedBy = new Map<string, Seed[]>();
  for (const s of seeds) {
    const r = REPLACE[`${s.slug}|${s.tld}`];
    if (r) replacedBy.set(r, [...(replacedBy.get(r) ?? []), s]);
  }
  const applied = new Set(appliedBy.keys());
  const named = new Set([...applied, ...replacedBy.keys()]);

  const apps: MockApp[] = seeds.map((s, i) => {
    const replacement = REPLACE[`${s.slug}|${s.tld}`] ?? null;
    let status: Status = "none";
    const blockers: MockApp["blockers"] = [];
    let near: string | undefined;
    if (replacement) {
      const holders = (appliedBy.get(replacement) ?? []).filter((o) => o !== s);
      const twins = (replacedBy.get(replacement) ?? []).filter((o) => o !== s);
      for (const o of holders) blockers.push({ name: o.name, how: "applied" });
      for (const o of twins) blockers.push({ name: o.name, how: "named" });
      status = holders.length ? "blocked-applied" : twins.length ? "blocked-twin" : "open";
      const forms = [replacement + "s", replacement.endsWith("s") ? replacement.slice(0, -1) : ""];
      const hit = forms.find((f) => f && (named.has(f) || delegated.has(f)));
      if (hit) near = delegated.has(hit) ? `plural of .${hit}` : `near .${hit}`;
    }
    const a = appByslug.get(s.slug);
    const src = s.sourceId ? srcById.get(s.sourceId) : undefined;
    return {
      id: `MOCK-${String(i + 1).padStart(4, "0")}`,
      tld: s.tld,
      applicant: s.name,
      slug: s.slug,
      replacement,
      status,
      blockers,
      near,
      setSize: appliedBy.get(s.tld)!.length,
      type: TYPE[`${s.slug}|${s.tld}`] ?? "standard",
      registration: TYPE[`${s.slug}|${s.tld}`] === "brand" ? "brand" : "open",
      entity: {
        jurisdiction: JURIS[s.slug.length % JURIS.length],
        website: src ? new URL(src.url).hostname : "example.com",
        parent: GROUP_OF.get(s.slug)?.link === "parent" ? GROUP_OF.get(s.slug)!.name : null,
        people: a?.backers ?? (GROUP_OF.get(s.slug)?.link === "person" ? "P. Placeholder, director" : "names per APS"),
      },
      preReveal: src ? { outlet: src.outlet, url: src.url, date: src.date } : null,
      fixture: s.fixture,
      group: GROUP_OF.get(s.slug)?.slug ?? s.slug,
    };
  });
  apps.sort((x, y) => x.tld.localeCompare(y.tld) || x.applicant.localeCompare(y.applicant));

  const sets: MockSet[] = [...applied]
    .filter((t) => appliedBy.get(t)!.length > 1)
    .map((tld) => {
      const members = apps.filter((a) => a.tld === tld);
      const switchable = members.filter((a) => a.status === "open").length;
      const stuck = members.length - switchable;
      const outlook: Outlook = stuck === 0 ? "empty" : stuck === 1 ? "resolve" : "stays";
      return { tld, apps: members, switchable, stuck, outlook };
    })
    .sort((x, y) => y.apps.length - x.apps.length || x.tld.localeCompare(y.tld));

  const disclosed: Record<string, number> = {};
  for (const c of claims)
    if (c.kind === "primary" && TAKE[c.applicantSlug])
      disclosed[c.applicantSlug] = (disclosed[c.applicantSlug] ?? 0) + 1;

  // groups: the declared and inferred ones above, and every other applicant
  // as a group of one under its own name
  const bySlug = new Map<string, MockApp[]>();
  for (const a of apps) bySlug.set(a.group, [...(bySlug.get(a.group) ?? []), a]);
  const groupName = (slug: string) => GROUPS.find((g) => g.slug === slug)?.name ?? bySlug.get(slug)![0].applicant;
  const groups: MockGroup[] = [...bySlug.entries()]
    .map(([slug, mine]) => {
      const def = GROUPS.find((g) => g.slug === slug);
      const ents = new Map<string, MockApp[]>();
      for (const a of mine) ents.set(a.slug, [...(ents.get(a.slug) ?? []), a]);
      const meets = new Map<string, string[]>();
      for (const a of mine)
        if (a.setSize > 1)
          for (const o of apps)
            if (o.tld === a.tld && o.group !== slug)
              meets.set(o.group, [...new Set([...(meets.get(o.group) ?? []), a.tld])]);
      return {
        slug,
        name: groupName(slug),
        link: def?.link ?? null,
        evidence: def?.evidence ?? null,
        entities: [...ents.entries()]
          .map(([es, ea]) => ({
            slug: es,
            name: ea[0].applicant,
            jurisdiction: ea[0].entity.jurisdiction,
            people: ea[0].entity.people,
            fixture: ea[0].fixture,
            apps: ea,
          }))
          .sort((x, y) => y.apps.length - x.apps.length || x.name.localeCompare(y.name)),
        apps: mine,
        inSets: mine.filter((a) => a.setSize > 1).length,
        rivals: [...meets.entries()]
          .map(([rs, tlds]) => ({ slug: rs, name: groupName(rs), tlds: tlds.sort() }))
          .sort((x, y) => y.tlds.length - x.tlds.length || x.name.localeCompare(y.name)),
      };
    })
    .sort((x, y) => y.apps.length - x.apps.length || x.name.localeCompare(y.name));

  const contended = apps.filter((a) => a.setSize > 1);
  return {
    apps,
    sets,
    groups,
    disclosed,
    stats: {
      groups: groups.length,
      applications: apps.length,
      strings: applied.size,
      applicants: new Set(apps.map((a) => a.slug)).size,
      replacements: apps.filter((a) => a.replacement).length,
      sets: sets.length,
      inContention: contended.length,
      canSwitch: contended.filter((a) => a.status === "open").length,
      blocked: apps.filter((a) => a.status.startsWith("blocked")).length,
    },
  };
}
