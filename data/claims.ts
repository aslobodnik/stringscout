import { lfgStrings } from "./lfgStrings";
import { jttwPrimary, jttwOther } from "./jttwStrings";
import { announcedClaims } from "./announcedAdapter";

// "intent" = stated an intention to apply, application not confirmed.
export type ClaimKind = "primary" | "backup" | "unknown" | "intent";

export type Claim = {
  tld: string;
  applicantSlug: string;
  kind: ClaimKind; // primary/backup split — undisclosed for all applicants so far
  sourceIds: string[];
};

function expand(
  tlds: string[],
  applicantSlug: string,
  sourceIds: string[],
  kind: ClaimKind = "unknown"
): Claim[] {
  return tlds.map((tld) => ({ tld, applicantSlug, kind, sourceIds }));
}

// Oinkadot — 25 strings, called its primary domains in the Domain Name Wire
// piece; replacement strings withheld.
const oinkadot = expand(
  [
    "anime", "bit", "bug", "cancel", "dine", "dragon", "ghost", "glitch",
    "hack", "heart", "king", "loop", "manga", "moon", "panda", "puff",
    "queen", "sign", "spice", "stack", "stay", "super", "weed", "wire", "zzz",
  ],
  "oinkadot",
  ["dnw"],
  "primary"
);

// Link Freedom Group — full 316-string list published on lfg.link.
const lfg = expand(lfgStrings, "lfg", ["lfg"]);

// TLD1 LLC — four applied-for strings per its site.
const tld1 = expand(["bewell", "etc", "joinus", "whatsnew"], "tld1", ["tld1"]);

// internet.Best — ten applied-for strings per internet.best/icann2026.
const ibest = expand(
  [
    "prompt", "chatbot", "answer", "ask", "skills",
    "creator", "socialmedia", "influencer", "content", "streamer",
  ],
  "ibest",
  ["ibest"]
);

// Endpoint Domains — eight strings, stated as primary applications on its site.
const endpoint = expand(
  ["big", "fab", "fart", "ftw", "happy", "nsfw", "private", "true"],
  "endpoint",
  ["endpoint"],
  "primary"
);

// Suffix Inc. — 13 strings, stated as primary in the founder's X post.
const suffix = expand(
  [
    "asap", "create", "future", "lfg", "mvp", "out", "pal",
    "planet", "research", "share", "tag", "this", "visit",
  ],
  "suffix",
  ["tomx"],
  "primary"
);

// Four applicants named exactly one string and referred to "the application"
// in the singular. AGB Appendix 1 Question Set 5 designates the applied-for
// string as TAMS.1, the primary, and §5.1 allows at most one replacement, so a
// single-string applicant has necessarily named its primary. None of the four
// used the word, which is why they sat at "unknown" until this was decided.

// Wiz — .bitcoin community priority application.
const wiz = expand(["bitcoin"], "wiz", ["cb"], "primary");

// USA Made in America — .factory, stated as its only primary string.
const usamade = expand(["factory"], "usamade", ["gnw-factory"], "primary");

// Journey To The West — 323 strings from xiyou.domains, which presents them
// under one heading, "Our Primary and Replacements", without saying which are
// which. The split in the site's own data file is a display grouping, not a
// primary/replacement designation.
const jttw = [
  ...expand(jttwPrimary, "jttw", ["xiyou"]),
  ...expand(jttwOther, "jttw", ["xiyou"]),
];

// Phoenix Domain Partners — 13 disclosed strings via Domain Name Wire.
const phoenix = expand(
  [
    "merch", "amor", "beach", "bbq", "chic", "comics", "connect",
    "jackpot", "pool", "quince", "quote", "therapy", "vibe",
  ],
  "phoenix",
  ["dnw-sp"]
);

// Youness Kasmi — .bit and .ion per his X post; entity undisclosed.
const kasmi = expand(["bit", "ion"], "kasmi", ["kasmi-x"]);

// Sui Naming Limited — .sui per SuiNS X post.
const suinaming = expand(["sui"], "suinaming", ["suins-x"], "primary");

// Name Space LLC — 10 primary strings named to Domain Name Wire; replacement
// strings undisclosed.
const namespace = expand(
  ["mars", "sound", "hello", "fest", "aura", "yam", "ify", "iii", "yyy", "brain"],
  "namespace",
  ["dnw-ns"],
  "primary"
);

// Telegram — .gram per Pavel Durov's X post. Unstoppable's filing post names
// .gram as its own fifth filing, made as registry service provider to
// Telegram: one application, so it corroborates this claim rather than adding
// an applicant.
const telegram = expand(["gram"], "telegram", ["durov-x", "ud-filed"], "primary");

// easyGroup Ltd — .easy dotBrand per its RNS announcement.
const easygroup = expand(["easy"], "easygroup", ["easy-rns"], "primary");

// Starlight Registry — 40 strings named to Domain Name Wire, listed there as
// its primary applications.
const starlight = expand(
  [
    "aid", "arc", "asi", "brain", "clone", "craft", "den", "did",
    "droid", "fab", "flux", "folio", "forge", "foundry", "gate", "grid",
    "intel", "intelligence", "kit", "lab", "lens", "lift", "logic", "maker",
    "mart", "matrix", "mesh", "mod", "ops", "path", "scan", "sense",
    "shift", "ship", "sync", "synth", "sys", "trek", "view", "wave",
  ],
  "starlight",
  ["dnw-starlight"],
  "primary"
);

// Brian Harbin — .grit, via Domain Name Wire (only record of the reveal).
const harbin = expand(["grit"], "harbin", ["dnw-grit"]);

// Human-Centered Computing Foundation — .self, submission confirmed in its own
// X post with an ICANN portal screenshot. Single-string applicant, so primary.
// The Applicant Auction row for the same entity joins via ALIASES.
const hccf = expand(["self"], "hccf", ["hccf-x"], "primary");

// Gate Naming Limited — .gate, announced by D3 on X (only record of the reveal).
const gatenaming = expand(["gate"], "gatenaming", ["d3-gate-x"]);

// Unstoppable Domains — .agi, .robot, .hub and .xmr, filed per its own post
// (with 0G Foundation, Hub Culture and Cake Wallet). Primary/replacement split
// not stated. Its Applicant Auction intent rows join via ALIASES; the ones the
// same post lists as not proceeding are in data/withdrawn.ts.
const unstoppable = expand(["agi", "robot", "hub", "xmr"], "unstoppable", ["ud-filed"]);

// Radix — 46 strings, stated as its primary applications on deux.radix.website.
const radix = expand(
  [
    "agi", "asi", "agent", "agentic", "intelligence", "mcp", "mind", "robotics",
    "bit", "hub", "stack", "platform", "quantum", "labs", "flow", "neo",
    "therapy", "wellness", "biotech", "pharma",
    "fintech", "wealth", "invest", "wallet", "coin", "crypto",
    "founder", "firm", "brand", "official", "advisory", "project", "research",
    "mart", "etc", "fix",
    "creator", "profile", "portfolio", "podcast", "pod", "merch",
    "collective", "vibe", "zen", "atelier",
  ],
  "radix",
  ["radix"],
  "primary"
);

// Agent Community — .agent, its own blog post confirming the community
// application was filed before the window closed. Single-string applicant,
// so primary.
const agentcommunity = expand(["agent"], "agentcommunity", ["agentcommunity"], "primary");

// Pre-window intent announcements, per Domain Incite. Not applications: the
// "intent" kind keeps them visible in the table without counting them as
// disclosed strings.
const intents = [
  // .anime by D3 only. Unstoppable's refund page pulled .manga and its filing
  // post pulled .anime, so both are carried on /withdrawn and claimed here by
  // neither Unstoppable nor Kintsugi.
  ...expand(["anime"], "d3", ["di"], "intent"),
  ...expand(["chain"], "freename", ["di"], "intent"),
  ...expand(["chain"], "3dns", ["di"], "intent"),
];

// A hand-written claim and a scraped one can land on the same string, the same
// applicant and the same URL — one fact recorded twice. Two claims citing the
// same string and applicant from *different* sources are two corroborations
// and both stay. Hand entries come first, so they win the tie and keep their
// kind, which the scraper can only ever record as "intent".
const dedupe = (all: Claim[]): Claim[] => {
  const seen = new Set<string>();
  return all.filter((c) => {
    const k = `${c.tld}|${c.applicantSlug}|${[...c.sourceIds].sort().join(",")}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export const claims: Claim[] = dedupe([
  ...oinkadot,
  ...lfg,
  ...tld1,
  ...ibest,
  ...suffix,
  ...endpoint,
  ...wiz,
  ...usamade,
  ...jttw,
  ...phoenix,
  ...kasmi,
  ...suinaming,
  ...namespace,
  ...telegram,
  ...easygroup,
  ...starlight,
  ...harbin,
  ...hccf,
  ...gatenaming,
  ...unstoppable,
  ...radix,
  ...agentcommunity,
  ...intents,
  ...announcedClaims,
]);
