import { describe, expect, it } from "vitest";
import { claims, type Claim } from "@/data/claims";
import {
  applicants,
  type Applicant,
  type ApplicantStatus,
} from "@/data/applicants";
import { sources, sourceIndex, KIND_ORDER } from "@/data/sources";
import { announced } from "@/data/announced";
import {
  ALIASES,
  announcedClaims,
  leadSlug,
  liveStrings,
  withdrawnClaims,
} from "@/data/announcedAdapter";
import { handWithdrawn } from "@/data/withdrawn";
import {
  applicantBackers,
  applicantMarks,
  latestReveal,
  roundShares,
  roundStats,
  stats,
  stringCount,
  stringRows,
} from "@/lib/derive";
import { matches, type Searchable } from "@/lib/search";
import { formatDate } from "@/lib/format";

const rows = stringRows();
const ui = (r: (typeof rows)[number]): Searchable => ({
  tld: r.tld,
  gloss: r.gloss,
  overlap: r.contested,
  issues: r.issues,
  applicants: r.applicants,
});
const NONE = {
  q: "",
  applicant: "all",
  scope: "all",
  mark: null,
} as const;
const find = (q: string) =>
  rows.map(ui).filter((r) => matches(r, { ...NONE, q }, applicantBackers));

describe("search", () => {
  it("strips a leading dot, so the text the table prints is findable", () => {
    expect(find(".anime").map((r) => r.tld)).toContain("anime");
  });

  it("treats a dotted query as the string only", () => {
    // "anime" is a substring of backer "Animecoin Foundation"
    expect(find("anime").length).toBeGreaterThan(find(".anime").length);
    expect(find(".anime").every((r) => r.tld.includes("anime"))).toBe(true);
  });

  it("reaches the English gloss of a CJK string", () => {
    const hits = find("sports");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((r) => /[一-鿿]/.test(r.tld))).toBe(true);
  });

  it("reaches the people behind an applicant", () => {
    expect(find("namecheap").length).toBeGreaterThan(0);
  });
});

describe("claims and applicants", () => {
  it("every claim points at an applicant that exists", () => {
    const slugs = new Set(applicants.map((a) => a.slug));
    const orphans = [
      ...new Set(claims.filter((c) => !slugs.has(c.applicantSlug)).map((c) => c.applicantSlug)),
    ];
    expect(orphans).toEqual([]);
  });

  it("records one string, applicant and source once", () => {
    const seen = new Map<string, number>();
    for (const c of claims) {
      const k = `.${c.tld} ${c.applicantSlug} ${[...c.sourceIds].sort().join(",")}`;
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    for (const [k, n] of seen) expect(n, `${k} recorded ${n} times`).toBe(1);
  });

  it("every claim cites a source that exists", () => {
    const ids = new Set(sources.map((s) => s.id));
    const missing = [
      ...new Set(claims.flatMap((c) => c.sourceIds).filter((id) => !ids.has(id))),
    ];
    expect(missing).toEqual([]);
  });

  it("keeps an applicant's strongest marker and unions its sources", () => {
    const claim = (kind: Claim["kind"], ...sourceIds: string[]): Claim => ({
      tld: "x",
      applicantSlug: "unstoppable",
      kind,
      sourceIds,
    });
    const marks = applicantMarks([claim("intent", "a"), claim("unknown", "b"), claim("primary", "c")]);
    expect(marks).toHaveLength(1);
    expect(marks[0].mark).toBe("p");
    expect([...marks[0].sourceIds].sort()).toEqual(["a", "b", "c"]);
  });

  it("counts overlaps by distinct applicant, not by claim", () => {
    for (const r of rows) {
      const owners = new Set(r.claims.map((c) => c.applicantSlug));
      expect(r.contested).toBe(owners.size > 1);
    }
  });
});

describe("strings", () => {
  const row = (tld: string) => rows.find((r) => r.tld === tld)!;

  it("flags a string already in the root zone, by its A-label", () => {
    expect(row("fan").issues).toEqual([{ kind: "delegated" }]);
    expect(row("公益").punycode).toBe("xn--55qw42g");
    expect(row("公益").issues).toEqual([{ kind: "delegated" }]);
  });

  it("flags the singular or plural of a delegated string, never a ccTLD", () => {
    expect(row("farms").issues).toEqual([{ kind: "plural", other: "farm" }]);
    expect(row("tire").issues).toEqual([{ kind: "plural", other: "tires" }]);
    // .es is delegated; .e is not a plural collision
    const others = rows.flatMap((r) => r.issues).filter((i) => i.kind === "plural").map((i) => i.other!);
    expect(others.filter((o) => o.length === 2)).toEqual([]);
  });

  it("flags singular and plural disclosed by different applicants, on both rows", () => {
    expect(row("lab").issues).toEqual([{ kind: "similar", other: "labs" }]);
    expect(row("labs").issues).toEqual([{ kind: "similar", other: "lab" }]);
  });
});

describe("round", () => {
  const r = roundStats();

  it("counts every filed unit the table counts, with intent outside it", () => {
    expect(r.primary + r.replacement + r.unknown).toBe(stats().claims);
  });

  it("shares out the disclosed total by applicant, largest first", () => {
    const shares = roundShares();
    expect(shares.reduce((n, s) => n + s.count, 0)).toBe(r.primary + r.replacement + r.unknown);
    expect(shares.map((s) => s.count)).toEqual([...shares.map((s) => s.count)].sort((a, b) => b - a));
  });

  it("counts an intent the applicant later filed as a filing, not an intent", () => {
    // Unstoppable announced .agi upstream and then filed it: one unit, filed.
    const pairs = new Set(
      claims.filter((c) => c.kind === "intent").map((c) => `${c.applicantSlug}|${c.tld}`)
    );
    const filed = claims.filter((c) => c.kind !== "intent" && pairs.has(`${c.applicantSlug}|${c.tld}`));
    expect(filed.length).toBeGreaterThan(0);
    expect(r.intent).toBe(pairs.size - new Set(filed.map((c) => `${c.applicantSlug}|${c.tld}`)).size);
  });
});

describe("scraped announcements", () => {
  it("parses strings, not the prose beside them", () => {
    const bad = [...new Set(announced.flatMap((a) => a.strings))].filter(
      (s) => !/^[a-z0-9-]+$/.test(s)
    );
    expect(bad).toEqual([]);
  });

  it("still recognises every aliased lead upstream", () => {
    // If Applicant Auction rewords a lead, the alias misses, a second slug is
    // minted for the same entity, and every string it holds becomes a
    // fabricated overlap. Fail here instead.
    const leads = new Set(announced.map((a) => a.lead.toLowerCase()));
    for (const name of Object.keys(ALIASES))
      expect(leads.has(name), `"${name}" no longer appears upstream`).toBe(true);
  });

  it("gives each lead entity exactly one slug", () => {
    const bySlug = new Map<string, Set<string>>();
    for (const a of announced) {
      const slug = leadSlug(a.lead);
      const names = bySlug.get(slug) ?? new Set<string>();
      names.add(a.lead);
      bySlug.set(slug, names);
    }
    for (const [slug, names] of bySlug)
      expect([...names], `${slug} covers more than one entity`).toHaveLength(1);
  });

  it("records where every withdrawal is written down", () => {
    const pulled = announced.filter((r) => r.withdrawnStrings.length);
    expect(pulled.length).toBeGreaterThan(0);
    for (const r of pulled) {
      expect(r.withdrawnUrl, `${r.lead} withdrew with no citation`).toBeTruthy();
      expect(() => new URL(r.withdrawnUrl!)).not.toThrow();
      for (const t of r.withdrawnStrings)
        expect(r.strings, `.${t} withdrawn but not in the row`).toContain(t);
    }
  });

  it("keeps a part-withdrawn row's live strings", () => {
    // A row-level flag would either lose the withdrawal or take the live
    // string down with it.
    const row = {
      lead: "x",
      partners: [],
      strings: ["a", "b"],
      note: null,
      withdrawnStrings: ["a"],
      withdrawnUrl: "https://example.com/",
      sourceUrl: null,
      sourceTitle: "",
      date: "2026-01-01",
    };
    expect(liveStrings(row)).toEqual(["b"]);
  });

  it("lays a hand withdrawal over the scraped row without touching it", () => {
    // Unstoppable/Kintsugi: upstream pulled .manga, Unstoppable's own filing
    // post later pulled .anime. The generated row still says .manga only.
    const row = announced.find((r) => r.strings.includes("manga"))!;
    expect(row.withdrawnStrings).toEqual(["manga"]);
    expect(liveStrings(row)).toEqual([]);
    const pulled = withdrawnClaims.filter((w) => w.applicant === row.lead);
    expect(pulled.map((w) => w.tld)).toEqual(expect.arrayContaining(["manga", "anime"]));
    expect(announcedClaims.some((c) => c.tld === "anime" && c.applicantSlug === "d3")).toBe(true);
    expect(
      announcedClaims.some((c) => c.applicantSlug === "unstoppable" && ["anime", "manga"].includes(c.tld))
    ).toBe(false);
  });

  it("points every hand withdrawal at a row that exists upstream", () => {
    // If Applicant Auction rewords a lead, the overlay misses and the string
    // silently comes back to life. Fail here instead.
    for (const w of handWithdrawn) {
      const rows = announced.filter((r) => r.lead.toLowerCase() === w.lead.toLowerCase());
      expect(rows.length, `"${w.lead}" no longer appears upstream`).toBeGreaterThan(0);
      for (const t of w.strings)
        expect(rows.some((r) => r.strings.includes(t)), `.${t} is not on a "${w.lead}" row`).toBe(true);
      expect(() => new URL(w.url)).not.toThrow();
    }
  });

  it("names where every withdrawal is recorded", () => {
    for (const w of withdrawnClaims) {
      expect(w.withdrawnUrl, `.${w.tld} withdrawn with no citation`).toBeTruthy();
      expect(w.withdrawnLabel, `.${w.tld} withdrawal has no label`).toBeTruthy();
    }
  });

  it("never emits a withdrawn announcement as a claim by that applicant", () => {
    expect(withdrawnClaims.length).toBeGreaterThan(0);
    for (const w of withdrawnClaims) {
      const slug = leadSlug(w.applicant);
      const claimed = claims.some(
        (c) => c.tld === w.tld && c.applicantSlug === slug
      );
      expect(claimed, `${w.applicant} should not claim .${w.tld}`).toBe(false);
    }
  });
});

describe("latest reveal", () => {
  const row = (
    slug: string,
    status: ApplicantStatus,
    revealedOn: string
  ): Applicant => ({ ...applicants[0], slug, name: slug, status, revealedOn });

  it("returns every disclosed applicant on the newest date, and no intent row", () => {
    const latest = latestReveal([
      row("older", "disclosed", "2026-08-20"),
      row("a", "disclosed", "2026-08-27"),
      row("announced", "intent", "2026-08-30"),
      row("b", "disclosed", "2026-08-27"),
    ]);
    expect(latest.map((a) => a.slug)).toEqual(["a", "b"]);
  });
});

describe("string counts", () => {
  it("counts a string once however many claims an applicant has on it", () => {
    // Unstoppable filed .agi and also announced it upstream: two claims, one
    // string. The count is what the applicants column, its sort and the
    // dateline all print, so a link's number matches the row it lands on.
    const mine = claims.filter((c) => c.applicantSlug === "unstoppable");
    expect(mine.filter((c) => c.tld === "agi").length).toBeGreaterThan(1);
    expect(stringCount("unstoppable")).toBe(new Set(mine.map((c) => c.tld)).size);
    expect(stringCount("nobody")).toBe(0);
  });
});

describe("sources", () => {
  it("registers each URL once, so one article is not two numbered sources", () => {
    const byUrl = new Map<string, string[]>();
    for (const s of sources) byUrl.set(s.url, [...(byUrl.get(s.url) ?? []), s.id]);
    for (const [url, ids] of byUrl)
      expect(ids, `${url} is cited under ${ids.join(" and ")}`).toHaveLength(1);
  });

  it("numbers every source exactly once, in bucket order", () => {
    expect(sourceIndex.size).toBe(sources.length);
    const order = sources.map((s) => KIND_ORDER.indexOf(s.kind));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("renders each date at the precision it actually has", () => {
    expect(formatDate("2026-08-13")).toBe("13 Aug 2026");
    expect(formatDate("2024-06")).toBe("Jun 2024");
    expect(formatDate("2026")).toBe("2026");
    expect(formatDate("2026-13-01")).toBe("2026-13-01"); // not a month
  });

  it("leaves no unformatted date on any page", () => {
    const dates = [
      ...sources.map((s) => s.date),
      ...applicants.map((a) => a.revealedOn),
    ];
    for (const d of dates)
      expect(formatDate(d), `${d} rendered raw`).not.toMatch(/^\d{4}-\d{2}/);
  });
});
