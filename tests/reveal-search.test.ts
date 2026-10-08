import { describe, expect, it } from "vitest";
import { groupHit, personHit, suggest, term } from "@/app/prototype/reveal/search";
import type { MockApp, MockGroup, MockPerson } from "@/app/prototype/reveal/mock";

const app = (tld: string, extra: Partial<MockApp> = {}): MockApp =>
  ({ id: tld, tld, applicant: "A", slug: "a", replacement: null, status: "none", blockers: [], setSize: 1,
    type: "standard", registration: "open", entity: { jurisdiction: "", website: "", parent: null, people: "" },
    preReveal: null, fixture: false, group: "g", ...extra }) as MockApp;

const group: MockGroup = {
  slug: "g", name: "Ethos Capital", link: "parent", evidence: "Ethos Capital", inSets: 0, rivals: [],
  apps: [app("agent"), app("xn--fiq228c", { uLabel: "中文", replacement: "bit" })],
  entities: [
    { slug: "e1", name: "Toddler Logic, LLC", jurisdiction: "Delaware", people: "Catherine Paletta", fixture: false, apps: [],
      roles: [{ role: "Executive responsibility", names: ["Catherine Paletta"] }] },
    { slug: "e2", name: "Pirin Tablet, LLC", jurisdiction: "Delaware", people: "Eric Trump", fixture: false, apps: [],
      roles: [{ role: "Directors", names: ["Eric Trump", "Catherine Paletta"] }] },
  ],
};

describe("term", () => {
  it("drops a leading dot, case and padding", () => {
    expect(term("  .Agent ")).toBe("agent");
  });
});

describe("groupHit", () => {
  it("matches the group name and says nothing more", () => {
    expect(groupHit(group, "ethos")).toMatchObject({ name: true, entities: [], people: [] });
  });
  it("names the entity and the person the query reached, each once", () => {
    expect(groupHit(group, "toddler")).toMatchObject({ name: false, entities: ["Toddler Logic, LLC"], people: [] });
    expect(groupHit(group, "paletta")).toMatchObject({ name: false, entities: [], people: ["Catherine Paletta"] });
  });
  it("reads the string, its u-label and its replacement", () => {
    expect(groupHit(group, ".agent")!.strings.map((a) => a.tld)).toEqual(["agent"]);
    expect(groupHit(group, "中")!.strings.map((a) => a.tld)).toEqual(["xn--fiq228c"]);
    expect(groupHit(group, "bit")!.strings.map((a) => a.tld)).toEqual(["xn--fiq228c"]);
  });
  it("returns null when nothing matches and a name-only hit when the box is empty", () => {
    expect(groupHit(group, "zebra")).toBeNull();
    expect(groupHit(group, "")).toMatchObject({ name: true });
  });
});

describe("personHit", () => {
  const person: MockPerson = { slug: "p", name: "Catherine Paletta", roles: ["Executive responsibility"], inSets: 0,
    entities: [{ slug: "e1", name: "Toddler Logic, LLC", roles: ["Executive responsibility"], group: "g" }], apps: [app("agent")] };
  it("reads name, entity, role and string", () => {
    expect(personHit(person, "cather")).toMatchObject({ name: true });
    expect(personHit(person, "toddler")).toMatchObject({ name: false, entities: ["Toddler Logic, LLC"] });
    expect(personHit(person, "executive")).toMatchObject({ name: false, roles: ["Executive responsibility"] });
    expect(personHit(person, "agent")!.strings).toHaveLength(1);
    expect(personHit(person, "zebra")).toBeNull();
  });
});

describe("suggest", () => {
  const lists = [
    { kind: "group", items: ["Ethos Capital", "Google"] },
    { kind: "person", items: ["Eric Trump", "Catherine Paletta"] },
    { kind: "string", items: ["agent", "agentic", "magent"] },
  ];
  it("needs two characters, puts prefix matches first and tags each kind", () => {
    expect(suggest("a", lists)).toEqual([]);
    expect(suggest(".agen", lists)).toEqual([
      { kind: "string", text: "agent" }, { kind: "string", text: "agentic" }, { kind: "string", text: "magent" },
    ]);
    expect(suggest("er", lists).map((s) => s.text)).toEqual(["Eric Trump", "Catherine Paletta"]);
  });
  it("caps the list", () => {
    expect(suggest("e", lists, 2)).toEqual([]);
    expect(suggest("en", lists, 2)).toHaveLength(2);
  });
});
