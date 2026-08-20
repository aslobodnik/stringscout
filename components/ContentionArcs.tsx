import { stringRows, applicantName } from "@/lib/derive";

// Axis labels have ~70px each. First words alone collide ("Name", "Journey"),
// so the ones that need it get a hand-set short form.
const SHORT: Record<string, string> = {
  lfg: "LFG",
  jttw: "JTTW",
  namespace: "Name Space",
  suffix: "Suffix",
  endpoint: "Endpoint",
  unstoppable: "Unstoppable",
  starlight: "Starlight",
  oinkadot: "Oinkadot",
  phoenix: "Phoenix",
  freename: "Freename",
  kasmi: "Kasmi",
  "3dns": "3DNS",
  d3: "D3",
};

// The shape of the round's fights, which the table cannot show: 82 contested
// strings resolve to 32 applicant pairs, and Link Freedom Group sits in 74 of
// the 82. An arc diagram is the only form that makes a hub visible.
//
// Applicants sit on a baseline ordered by how many contested strings they
// touch; each arc joins two that want the same string, weighted by how many
// they share. Everything is hairline geometry, in the same register as the
// double rules.

const W = 1000;
const H = 190;
const BASE = H - 24;
const MIN_SHARED = 2; // a single shared string is noise at this scale

type Pair = { a: string; b: string; n: number };

function contention() {
  const rows = stringRows().filter((r) => r.contested);
  const pairs = new Map<string, number>();
  const touched = new Map<string, number>();
  for (const r of rows) {
    const own = [...new Set(r.claims.map((c) => c.applicantSlug))].sort();
    for (const s of own) touched.set(s, (touched.get(s) ?? 0) + 1);
    for (let i = 0; i < own.length; i++)
      for (let j = i + 1; j < own.length; j++) {
        const k = `${own[i]}|${own[j]}`;
        pairs.set(k, (pairs.get(k) ?? 0) + 1);
      }
  }
  const kept: Pair[] = [...pairs]
    .filter(([, n]) => n >= MIN_SHARED)
    .map(([k, n]) => ({ a: k.split("|")[0], b: k.split("|")[1], n }));
  const involved = [...new Set(kept.flatMap((p) => [p.a, p.b]))].sort(
    (x, y) => (touched.get(y) ?? 0) - (touched.get(x) ?? 0)
  );
  return { kept, involved, touched, total: rows.length };
}

export default function ContentionArcs({ className = "" }: { className?: string }) {
  const { kept, involved, touched, total } = contention();
  const step = W / involved.length;
  const x = (slug: string) => involved.indexOf(slug) * step + step / 2;
  const maxShared = Math.max(...kept.map((p) => p.n));

  return (
    <figure className={className}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${total} contested strings across ${involved.length} applicants. Each arc joins two applicants that want the same string.`}
      >
        {kept.map((p) => {
          const x1 = Math.min(x(p.a), x(p.b));
          const x2 = Math.max(x(p.a), x(p.b));
          const r = (x2 - x1) / 2;
          return (
            <path
              key={`${p.a}-${p.b}`}
              d={`M ${x1} ${BASE} A ${r} ${Math.min(BASE - 8, r * 0.42)} 0 0 1 ${x2} ${BASE}`}
              fill="none"
              stroke="var(--oxblood)"
              strokeWidth={0.5 + (p.n / maxShared) * 1.9}
              opacity={0.2 + (p.n / maxShared) * 0.45}
            />
          );
        })}
        <line
          x1="0"
          y1={BASE}
          x2={W}
          y2={BASE}
          stroke="var(--ink)"
          strokeWidth="0.75"
        />
        {involved.map((slug) => (
          <g key={slug}>
            <circle cx={x(slug)} cy={BASE} r="2" fill="var(--ink)" />
            <text
              x={x(slug)}
              y={BASE + 13}
              textAnchor="middle"
              fontSize="8.5"
              letterSpacing="0.4"
              fill="var(--ink-soft)"
              fontFamily="var(--font-jost), sans-serif"
            >
              {SHORT[slug] ?? (applicantName.get(slug) ?? slug).slice(0, 11)}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="label text-ink-soft !text-[10px] !tracking-[0.08em] mt-2">
        {total} overlapping strings · Link Freedom Group is in{" "}
        {touched.get("lfg")} of them
      </figcaption>
    </figure>
  );
}
