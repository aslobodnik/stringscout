// What the applicants and people search boxes match, and what they say about
// why a row matched. Pure, so the matching is testable without a page.
import type { MockApp, MockGroup, MockPerson } from "./mock";

// trimmed, lowercased, a leading dot dropped so ".agent" and "agent" agree
export const term = (q: string) => q.trim().toLowerCase().replace(/^\./, "");
const has = (s: string | undefined | null, t: string) => !!s && s.toLowerCase().includes(t);
export const stringHit = (a: MockApp, t: string) =>
  a.tld.includes(t) || has(a.uLabel, t) || (a.replacement ?? "").includes(t) || has(a.replacementU, t);

// Why a group row is in the result. `name` means the group's own name matched
// and nothing more needs saying; the other lists are what the row would not
// otherwise show for this query.
export type GroupHit = { name: boolean; entities: string[]; people: string[]; strings: MockApp[] };
export function groupHit(g: MockGroup, q: string): GroupHit | null {
  const t = term(q);
  const hit: GroupHit = { name: !t || has(g.name, t), entities: [], people: [], strings: [] };
  if (!t) return hit;
  const seen = new Set<string>();
  for (const e of g.entities) {
    if (has(e.name, t) && !has(g.name, t)) hit.entities.push(e.name);
    for (const r of e.roles ?? [])
      for (const n of r.names) if (has(n, t) && !seen.has(n)) { seen.add(n); hit.people.push(n); }
  }
  for (const a of g.apps) if (stringHit(a, t)) hit.strings.push(a);
  return hit.name || hit.entities.length || hit.people.length || hit.strings.length ? hit : null;
}

export type PersonHit = { name: boolean; entities: string[]; roles: string[]; strings: MockApp[] };
export function personHit(p: MockPerson, q: string): PersonHit | null {
  const t = term(q);
  const hit: PersonHit = { name: !t || has(p.name, t), entities: [], roles: [], strings: [] };
  if (!t) return hit;
  for (const e of p.entities) if (has(e.name, t)) hit.entities.push(e.name);
  for (const r of p.roles) if (has(r, t)) hit.roles.push(r);
  for (const a of p.apps) if (stringHit(a, t)) hit.strings.push(a);
  return hit.name || hit.entities.length || hit.roles.length || hit.strings.length ? hit : null;
}

// Suggestions under a box: names the typed fragment starts, then names it sits
// in, each tagged with what it is. Picking one fills the box with the name.
export type Suggestion = { kind: string; text: string };
export type NameList = { kind: string; items: string[] };
export function suggest(q: string, lists: NameList[], max = 8): Suggestion[] {
  const t = term(q);
  if (t.length < 2) return [];
  const starts: Suggestion[] = [];
  const within: Suggestion[] = [];
  for (const { kind, items } of lists)
    for (const text of items) {
      const l = text.toLowerCase();
      if (l.startsWith(t)) starts.push({ kind, text });
      else if (l.includes(t)) within.push({ kind, text });
      if (starts.length >= max) return starts.slice(0, max);
    }
  return [...starts, ...within].slice(0, max);
}

// The string names a list of applications offers for suggestions: U-label
// when there is one, each once, sorted.
export const stringNames = (apps: MockApp[]) => [...new Set(apps.map((a) => a.uLabel ?? a.tld))].sort();
