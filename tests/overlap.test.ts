import { describe, expect, it } from "vitest";
import { overlapsFor, suggestPeople } from "@/lib/overlap";
import type { MockApp, MockData, MockPerson } from "@/app/prototype/reveal/mock";

const app = (id: string, tld: string, slug: string, setSize: number): MockApp =>
  ({ id, tld, applicant: slug, slug, replacement: null, status: "none", blockers: [], setSize,
    type: "standard", registration: "open", entity: { jurisdiction: "", website: "", parent: null, people: "" },
    preReveal: null, fixture: false, group: slug }) as MockApp;

const person = (name: string, entity: string, apps: MockApp[]): MockPerson => ({
  slug: name.toLowerCase().replace(/ /g, "-"), name, roles: ["Directors"],
  entities: [{ slug: entity, name: entity, roles: ["Directors"], group: entity }], apps, inSets: 0,
});

// .agent: A and B both apply. .bit: A alone. .hub: A twice (two entities), B.
const aAgent = app("A1", "agent", "a", 2);
const bAgent = app("B1", "agent", "b", 2);
const aBit = app("A2", "bit", "a", 1);
const aHub = app("A3", "hub", "a", 3);
const a2Hub = app("A4", "hub", "a2", 3);
const bHub = app("B2", "hub", "b", 3);

const ann = person("Ann Lee", "a", [aAgent, aBit, aHub]);
const al = person("Al Ng", "a", [aAgent, aBit, aHub]); // Ann's colleague on the same applications
const bob = person("Bob Ray", "b", [bAgent, bHub]);
const sis = person("Sal Fox", "a2", [a2Hub]); // sibling entity, files separately
const data = { apps: [aAgent, bAgent, aBit, aHub, a2Hub, bHub], people: [ann, al, bob, sis] } as unknown as MockData;

describe("overlapsFor", () => {
  const rows = overlapsFor(ann, data);
  it("needs an opposing application, so a colleague on the same ones never counts", () => {
    expect(rows.map((r) => r.person.name)).toEqual(["Bob Ray", "Sal Fox"]);
  });
  it("counts each string once per pair and lists the person's own application", () => {
    expect(rows[0].apps.map((a) => a.tld)).toEqual(["agent", "hub"]);
    expect(rows[0].apps.every((a) => a.slug === "a")).toBe(true);
  });
  it("a sibling entity filing separately is an overlap", () => {
    expect(rows[1].apps.map((a) => a.tld)).toEqual(["hub"]);
  });
  it("carries the other side's applications, so a row names only the entities on the shared strings", () => {
    expect(rows[0].theirs.map((a) => a.id)).toEqual(["B1", "B2"]);
    expect(rows[1].theirs.map((a) => a.id)).toEqual(["A4"]);
  });
  it("a string with no other applicant is not shared", () => {
    expect(rows.flatMap((r) => r.apps).some((a) => a.tld === "bit")).toBe(false);
  });
  it("most shared first, then name", () => {
    const back = overlapsFor(bob, data);
    expect(back.map((r) => [r.person.name, r.apps.length])).toEqual([["Al Ng", 2], ["Ann Lee", 2], ["Sal Fox", 1]]);
  });
});

describe("suggestPeople", () => {
  const people = [ann, al, bob, sis];
  it("needs two characters", () => expect(suggestPeople("a", people)).toEqual([]));
  it("name starts first, then names and entities it sits in", () => {
    expect(suggestPeople("al", people).map((p) => p.name)).toEqual(["Al Ng", "Sal Fox"]);
  });
  it("an entity name reaches its people", () => {
    expect(suggestPeople("a2", people).map((p) => p.name)).toEqual(["Sal Fox"]);
  });
});
