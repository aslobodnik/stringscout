// Who shares a string with a person: the view an applicant checks before a
// conversation. Only humans talk, so the unit is the person the records name,
// never the entity or its parent.
//
// A string counts when one of the person's applications sits in an
// identical-string set (ICANN's reveal-day contention sets) with an
// application that is not theirs; everyone named on that other application
// shares the string. A colleague on the person's own application never
// qualifies through it, but does through a sibling entity filing separately.
// Each string counts once per pair however many applications carry it.
import type { MockApp, MockData, MockPerson } from "@/app/prototype/reveal/mock";

export type OverlapRow = {
  person: MockPerson;
  apps: MockApp[]; // the viewer's own applications on the shared strings, by string
  theirs: MockApp[]; // the other person's applications on those strings, by string
};

// everyone the records name on an application, by application id
const peopleOn = (people: MockPerson[]) => {
  const m = new Map<string, MockPerson[]>();
  for (const p of people) for (const a of p.apps) m.set(a.id, [...(m.get(a.id) ?? []), p]);
  return m;
};

export function overlapsFor(me: MockPerson, d: MockData): OverlapRow[] {
  const onApp = peopleOn(d.people ?? []);
  const inSet = new Map<string, MockApp[]>();
  for (const a of d.apps) if (a.setSize > 1) inSet.set(a.tld, [...(inSet.get(a.tld) ?? []), a]);
  const mine = new Set(me.apps.map((a) => a.id));
  const shared = new Map<string, Map<string, MockApp>>(); // person slug -> tld -> my app
  const theirs = new Map<string, Map<string, MockApp>>(); // person slug -> app id -> their app
  const who = new Map<string, MockPerson>();
  for (const a of me.apps) {
    if (a.setSize <= 1) continue;
    for (const other of inSet.get(a.tld) ?? []) {
      if (mine.has(other.id)) continue;
      for (const p of onApp.get(other.id) ?? []) {
        if (p.slug === me.slug) continue;
        who.set(p.slug, p);
        const byTld = shared.get(p.slug) ?? new Map<string, MockApp>();
        if (!byTld.has(a.tld)) byTld.set(a.tld, a);
        shared.set(p.slug, byTld);
        theirs.set(p.slug, (theirs.get(p.slug) ?? new Map<string, MockApp>()).set(other.id, other));
      }
    }
  }
  return [...shared.entries()]
    .map(([slug, byTld]) => ({
      person: who.get(slug)!,
      apps: [...byTld.values()].sort((x, y) => x.tld.localeCompare(y.tld)),
      theirs: [...theirs.get(slug)!.values()].sort((x, y) => x.tld.localeCompare(y.tld)),
    }))
    .sort((x, y) => y.apps.length - x.apps.length || x.person.name.localeCompare(y.person.name));
}

// Names a typed fragment starts, then names it sits in; an entity name
// reaches its people. At most `max`, each person once.
export function suggestPeople(q: string, people: MockPerson[], max = 8): MockPerson[] {
  const t = q.trim().toLowerCase().replace(/^\./, "");
  if (t.length < 2) return [];
  const starts: MockPerson[] = [];
  const within: MockPerson[] = [];
  for (const p of people) {
    const n = p.name.toLowerCase();
    if (n.startsWith(t)) starts.push(p);
    else if (n.includes(t) || p.entities.some((e) => e.name.toLowerCase().includes(t))) within.push(p);
    if (starts.length >= max) return starts.slice(0, max);
  }
  return [...starts, ...within].slice(0, max);
}

// People behind the same parents read as one row, every name on it, with
// the union of their strings: three directors of one company are not three
// copies of one line. A name on fewer strings than the row keeps its own
// list, so the row can say "6 of 7". Order is kept by the first person in,
// then by the union, so the merged list is still most shared first.
export type OverlapGroup = { people: OverlapRow[]; apps: MockApp[]; theirs: MockApp[] };
export function mergeByParent(rows: OverlapRow[]): OverlapGroup[] {
  const out = new Map<string, OverlapGroup>();
  for (const r of rows) {
    const key = [...new Set(r.theirs.map((a) => a.group))].sort().join(" ");
    const g = out.get(key);
    if (g) {
      g.people.push(r);
      const seen = new Set(g.apps.map((a) => a.tld));
      for (const a of r.apps) if (!seen.has(a.tld)) g.apps.push(a);
      const ids = new Set(g.theirs.map((a) => a.id));
      for (const a of r.theirs) if (!ids.has(a.id)) g.theirs.push(a);
    } else out.set(key, { people: [r], apps: [...r.apps], theirs: [...r.theirs] });
  }
  return [...out.values()]
    .map((g) => ({ ...g, apps: g.apps.sort((x, y) => x.tld.localeCompare(y.tld)) }))
    .sort((x, y) => y.apps.length - x.apps.length);
}
