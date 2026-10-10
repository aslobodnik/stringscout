// PROTOTYPE. Builds the reveal views from ICANN's APS records pulled into
// data/icann/aps/ by scripts/pull-aps.mjs. Same shape as buildMock() so the
// layout code is untouched. Fields that need the per-application responses
// (parent, people, jurisdiction) fill in as the pull lands; until then they
// read as a dash.
import fs from "node:fs";
import path from "node:path";
import { claims } from "@/data/claims";
import { applicants } from "@/data/applicants";
import { sources } from "@/data/sources";
import { rootZone } from "@/data/rootZone";
import { idnGloss } from "@/data/translations";
import type { AppType, Link, MockApp, MockData, MockEntity, MockGroup, MockPerson, MockSet, Outlook, Registration, Role, Status } from "./mock";

// the one derived file, from scripts/derive-aps.mjs; the raw pull stays out of git
const DERIVED = path.join(process.cwd(), "data/icann/aps-derived.json");

type ListRow = {
  applicationHumanReadableId: string;
  primaryString: { aLabel: string; uLabel: string };
  organizationName: string;
  organizationCountryCode: string;
  icannRegion: string;
  variants: { aLabel: string; uLabel: string }[];
  tldTypes: string[];
  applicationType: string;
  labels: { labels: string[] }[];
};

// per application, the AGB answers the site uses keyed by question number,
// plus the website from the summary
type Derived = { pulledAt: string; list: ListRow[]; answers: Record<string, Record<string, string>> };

function readDerived(): Derived {
  try {
    return JSON.parse(fs.readFileSync(DERIVED, "utf8")) as Derived;
  } catch {
    return { pulledAt: "", list: [], answers: {} };
  }
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// strip entity suffixes so "XYZ.COM LLC" and "XYZ.com, LLC" meet
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.,'"()]/g, " ")
    .replace(/\b(llc|inc|ltd|limited|corp|corporation|co|gmbh|ag|sa|s\.?p\.?a|pty|plc|lp|l\.?l\.?c|b\.?v|s\.?r\.?l|sezc)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// split a names answer; names come comma- or newline-separated, some with
// titles after a dash or in parentheses
function people(...fields: (string | undefined)[]): string[] {
  return names(fields, false);
}

// entities: keep company names (shareholders and controllers are often companies)
function names(fields: (string | undefined)[], entities: boolean): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const f of fields) {
    if (!f) continue;
    for (const raw of f.split(/[\n;,]+|\band\b/)) {
      const n = raw.replace(/\(.*?\)/g, "").replace(/\s*[-–:].*$/, "").replace(/\s+/g, " ").trim();
      if (n.length < 4 || /^(n\/?a|none|not applicable)$/i.test(n)) continue;
      if (!entities && ENTITY_WORD.test(n)) continue;
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
  }
  return out;
}

// AGB question -> role label, in the order the record asks
const ROLES: [string, string, boolean][] = [
  ["104", "Directors", false],
  ["105", "Officers & partners", false],
  ["107", "Executive responsibility", false],
  ["106", "Material shareholders", true],
  ["108", "Ultimate control", true],
];
function roles(a: Map<string, string>): Role[] {
  return ROLES.map(([q, role, ent]) => ({ role, names: names([a.get(q)], ent) })).filter((r) => r.names.length);
}

const ENTITY_WORD =
  /\b(llc|inc|ltd|limited|corp|corporation|co|company|gmbh|ag|sa|s\.?p\.?a|pty|plc|lp|b\.?v|s\.?r\.?l|sezc|holdings?|group|trust|foundation|partners|capital|fund|publicly|public|shareholders?|listed|exchange)\b/i;

const typeOf = (tldTypes: string[]): AppType => {
  const t = tldTypes.map((x) => x.toLowerCase());
  if (t.some((x) => x.includes("brand"))) return "brand";
  if (t.some((x) => x.includes("geo"))) return "geo";
  if (t.some((x) => x.includes("community"))) return "community";
  return "standard";
};

const delegated = new Set(rootZone);

let cache: MockData | null = null;

export function buildReal(): MockData {
  if (cache && process.env.NODE_ENV === "production") return cache;
  const { list, answers: answered } = readDerived();

  // the replacement record for a primary carries the primary's id plus "-R"
  const replacementOf = new Map<string, ListRow>();
  const primaries: ListRow[] = [];
  for (const r of list) {
    if (r.applicationType === "Replacement String") replacementOf.set(r.applicationHumanReadableId.replace(/-R$/, ""), r);
    else primaries.push(r);
  }

  // per-application answers, where pulled
  type Detail = {
    jurisdiction: string;
    website: string;
    parent: string | null;
    ultimate: string | null;
    people: string[];
    roles: Role[];
    registration: Registration;
    address: string | null;
    affiliate: string | null;
  };
  const detail = (id: string): Detail | null => {
    const raw = answered[id];
    if (!raw) return null;
    const a = new Map(Object.entries(raw));
    if (a.size === 0) return null;
    const addr = [a.get("20"), a.get("22"), a.get("25")].filter(Boolean).join(", ");
    return {
      jurisdiction: a.get("4") ?? "",
      website: (a.get("website") ?? a.get("10") ?? "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
      parent: a.get("26") && !/^(n\/?a|none)$/i.test(a.get("26")!) ? a.get("26")! : null,
      ultimate: a.get("36") && !/^(n\/?a|none)$/i.test(a.get("36")!) ? a.get("36")! : null,
      people: people(a.get("104"), a.get("105"), a.get("107"), a.get("108")),
      roles: roles(a),
      registration: /^yes$/i.test(a.get("179") ?? "") ? "brand" : /^(yes|true)$/i.test(a.get("186") ?? "") ? "closed" : "open",
      address: addr || null,
      affiliate: a.get("14") ?? null,
    };
  };

  // pre-reveal disclosures from data/: match by string and applicant name
  const srcById = new Map(sources.map((s) => [s.id, s]));
  const appBySlug = new Map(applicants.map((a) => [a.slug, a]));
  const disclosedBy = new Map<string, { slug: string; name: string; sourceId: string }[]>();
  for (const c of claims) {
    if (c.kind !== "primary") continue;
    const name = appBySlug.get(c.applicantSlug)?.name ?? c.applicantSlug;
    disclosedBy.set(c.tld, [...(disclosedBy.get(c.tld) ?? []), { slug: c.applicantSlug, name, sourceId: c.sourceIds[0] }]);
  }
  const findDisclosure = (tld: string, org: string) => {
    const n = norm(org);
    return (disclosedBy.get(tld) ?? []).find((d) => {
      const m = norm(d.name);
      return n === m || n.includes(m) || m.includes(n);
    });
  };

  // who applied for each string, and who named each replacement
  const label = (r: ListRow) => r.primaryString.aLabel.toLowerCase();
  const appliedBy = new Map<string, ListRow[]>();
  for (const r of primaries) appliedBy.set(label(r), [...(appliedBy.get(label(r)) ?? []), r]);
  const replacedBy = new Map<string, ListRow[]>();
  for (const r of primaries) {
    const rep = replacementOf.get(r.applicationHumanReadableId);
    if (rep) replacedBy.set(label(rep), [...(replacedBy.get(label(rep)) ?? []), r]);
  }
  const applied = new Set(appliedBy.keys());
  const named = new Set([...applied, ...replacedBy.keys()]);

  const details = new Map<string, Detail | null>();
  const entitySlug = (org: string) => slugify(norm(org)) || slugify(org);

  const apps: MockApp[] = primaries.map((r) => {
    const tld = label(r);
    const rep = replacementOf.get(r.applicationHumanReadableId);
    const replacement = rep ? label(rep) : null;
    let status: Status = "none";
    const blockers: MockApp["blockers"] = [];
    let near: string | undefined;
    if (replacement) {
      const holders = (appliedBy.get(replacement) ?? []).filter((o) => o !== r);
      const twins = (replacedBy.get(replacement) ?? []).filter((o) => o !== r);
      // one line per blocker, however many of its filings name the string
      const seenBlock = new Set<string>();
      for (const [list, how] of [[holders, "applied"], [twins, "named"]] as const)
        for (const o of list) {
          const k = `${how}|${o.organizationName}`;
          if (seenBlock.has(k)) continue;
          seenBlock.add(k);
          blockers.push({ name: o.organizationName, how });
        }
      status = holders.length ? "blocked-applied" : twins.length ? "blocked-twin" : "open";
      const forms = [replacement + "s", replacement.endsWith("s") ? replacement.slice(0, -1) : ""];
      const hit = forms.find((f) => f && (named.has(f) || delegated.has(f)));
      if (hit) near = delegated.has(hit) ? `plural of .${hit}` : `near .${hit}`;
    }
    const d = detail(r.applicationHumanReadableId);
    details.set(r.applicationHumanReadableId, d);
    const slug = entitySlug(r.organizationName);
    const disc = findDisclosure(tld, r.organizationName);
    const src = disc ? srcById.get(disc.sourceId) : undefined;
    return {
      id: r.applicationHumanReadableId,
      tld,
      uLabel: r.primaryString.uLabel || undefined,
      gloss: idnGloss[r.primaryString.uLabel],
      replacementU: rep?.primaryString.uLabel || undefined,
      replacementGloss: rep ? idnGloss[rep.primaryString.uLabel] : undefined,
      applicant: r.organizationName,
      slug,
      replacement,
      status,
      blockers,
      near,
      setSize: appliedBy.get(tld)!.length,
      type: typeOf(r.tldTypes),
      registration: d?.registration ?? (typeOf(r.tldTypes) === "brand" ? "brand" : "open"),
      entity: {
        jurisdiction: d?.jurisdiction || r.organizationCountryCode,
        website: d?.website || "",
        parent: d?.parent ?? d?.ultimate ?? null,
        ultimate: d?.ultimate ?? null,
        people: d?.people.join(", ") ?? "",
        roles: d?.roles,
      },
      preReveal: src ? { outlet: src.outlet, url: src.url, date: src.date } : null,
      fixture: false,
      group: slug, // set below
    };
  });

  // groups: entities under the same declared parent (Q36 ultimate, else Q26
  // direct). Shared directors and addresses are real in the record but
  // say nothing about ownership, so they stay searchable and do not group.
  const parentOf = new Map<string, string>(); // entity slug -> parent name
  const entityName = new Map<string, string>();
  for (const a of apps) {
    entityName.set(a.slug, a.applicant);
    const d = details.get(a.id);
    if (!d) continue;
    // group under the ultimate parent so sibling shells meet; the Parent
    // column still prints the direct parent
    const p = d.ultimate ?? d.parent;
    if (p && norm(p) !== norm(a.applicant)) parentOf.set(a.slug, p);
  }
  const up = new Map<string, string>();
  const find = (x: string): string => {
    const p = up.get(x);
    if (!p || p === x) return x;
    const r = find(p);
    up.set(x, r);
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) up.set(ra, rb);
  };
  const linkOf = new Map<string, { link: Link; evidence: string }>();
  const byParent = new Map<string, string[]>();
  for (const [slug, p] of parentOf) byParent.set(norm(p), [...(byParent.get(norm(p)) ?? []), slug]);
  for (const [, members] of byParent) {
    const parentSlug = entitySlug(parentOf.get(members[0])!);
    // the parent may itself be an applicant; fold it in
    const anchor = entityName.has(parentSlug) ? parentSlug : members[0];
    for (const m of members) union(m, anchor);
  }
  for (const [slug, p] of parentOf) linkOf.set(find(slug), { link: "parent", evidence: p });
  for (const a of apps) a.group = find(a.slug);

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
  for (const a of apps) if (a.preReveal) disclosed[a.slug] = (disclosed[a.slug] ?? 0) + 1;

  const byGroup = new Map<string, MockApp[]>();
  for (const a of apps) byGroup.set(a.group, [...(byGroup.get(a.group) ?? []), a]);
  const groupName = (root: string) => {
    const l = linkOf.get(root);
    if (l?.link === "parent") return l.evidence;
    const mine = byGroup.get(root)!;
    const ents = new Set(mine.map((a) => a.slug));
    const first = [...mine].sort((x, y) => y.setSize - x.setSize)[0].applicant;
    return ents.size > 1 ? `${first} + ${ents.size - 1}` : first;
  };
  const groups: MockGroup[] = [...byGroup.entries()]
    .map(([root, mine]) => {
      const l = linkOf.get(root);
      const ents = new Map<string, MockApp[]>();
      for (const a of mine) ents.set(a.slug, [...(ents.get(a.slug) ?? []), a]);
      const meets = new Map<string, string[]>();
      for (const a of mine)
        if (a.setSize > 1)
          for (const o of apps)
            if (o.tld === a.tld && o.group !== root)
              meets.set(o.group, [...new Set([...(meets.get(o.group) ?? []), a.tld])]);
      const entities: MockEntity[] = [...ents.entries()]
        .map(([es, ea]) => ({
          slug: es,
          name: ea[0].applicant,
          jurisdiction: ea[0].entity.jurisdiction,
          people: ea[0].entity.people,
          roles: ea[0].entity.roles,
          fixture: false,
          apps: ea,
        }))
        .sort((x, y) => y.apps.length - x.apps.length || x.name.localeCompare(y.name));
      return {
        slug: root,
        name: groupName(root),
        link: ents.size > 1 || l?.link === "parent" ? (l?.link ?? null) : null,
        evidence: ents.size > 1 || l?.link === "parent" ? (l?.evidence ?? null) : null,
        entities,
        apps: mine,
        inSets: mine.filter((a) => a.setSize > 1).length,
        rivals: [...meets.entries()]
          .map(([rs, tlds]) => ({ slug: rs, name: groupName(rs), tlds: tlds.sort() }))
          .sort((x, y) => y.tlds.length - x.tlds.length || x.name.localeCompare(y.name)),
      };
    })
    .sort((x, y) => y.apps.length - x.apps.length || x.name.localeCompare(y.name));

  // people: every name under a person question, keyed case-insensitively
  const PERSON_ROLES = new Set(["Directors", "Officers & partners", "Executive responsibility"]);
  const personMap = new Map<string, MockPerson>();
  const entityApps = new Map<string, MockApp[]>();
  for (const a of apps) entityApps.set(a.slug, [...(entityApps.get(a.slug) ?? []), a]);
  for (const [slug, mine] of entityApps) {
    const d = details.get(mine[0].id);
    if (!d) continue;
    const byName = new Map<string, Set<string>>();
    for (const r of d.roles)
      if (PERSON_ROLES.has(r.role))
        for (const n of r.names) byName.set(n.toLowerCase(), (byName.get(n.toLowerCase()) ?? new Set()).add(r.role));
    for (const [k, roles] of byName) {
      const first = d.roles.flatMap((r) => r.names).find((n) => n.toLowerCase() === k)!;
      const person = personMap.get(k) ?? { slug: slugify(k), name: first, roles: [], entities: [], apps: [], inSets: 0 };
      person.entities.push({ slug, name: mine[0].applicant, roles: [...roles], group: mine[0].group });
      person.apps.push(...mine);
      for (const r of roles) if (!person.roles.includes(r)) person.roles.push(r);
      personMap.set(k, person);
    }
  }
  const persons = [...personMap.values()]
    .map((p) => ({ ...p, inSets: p.apps.filter((a) => a.setSize > 1).length, apps: [...p.apps].sort((x, y) => x.tld.localeCompare(y.tld)) }))
    .sort((x, y) => y.apps.length - x.apps.length || x.name.localeCompare(y.name));

  const contended = apps.filter((a) => a.setSize > 1);
  cache = {
    people: persons,
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
      people: persons.length,
    },
  };
  return cache;
}
