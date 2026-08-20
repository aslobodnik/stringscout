import { rootZone } from "@/data/rootZone";
import { stringRows } from "@/lib/derive";

// The alphabet as a measure. For each initial letter, ink rises for the TLDs
// already delegated in the root zone and gold falls for the strings disclosed
// this round, both to the same scale. Where gold outruns ink, applicants have
// asked for more strings under that letter than the root zone holds today.
// IDN sits in its own block: binning punycode alphabetically would pile every
// xn-- label under "x", which is a lie.

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const STEP = 38;
const BAR = 22;
const AMP = 36; // px at the tallest bar on either side
const PAD = 6;

// the viewBox is ~1000 wide, so at 390px these render around 3px
const TICK = "hidden sm:inline";
const W = LETTERS.length * STEP;
const H = AMP * 2 + 22;
const MID = AMP + PAD;

const isIdn = (s: string) => s.startsWith("xn--");
const idx = (s: string) => LETTERS.indexOf(s[0]);

function bins(strings: string[]): number[] {
  const out = new Array(LETTERS.length).fill(0);
  for (const s of strings) {
    const i = idx(s);
    if (i >= 0) out[i]++;
  }
  return out;
}

export default function RootZoneBand({ className }: { className?: string }) {
  const rows = stringRows();

  const rootAscii = rootZone.filter((t) => !isIdn(t));
  const rootIdn = rootZone.length - rootAscii.length;
  const disclosed = rows.filter((r) => !isIdn(r.punycode));
  const discIdn = rows.length - disclosed.length;

  const ink = bins(rootAscii);
  const gold = bins(disclosed.map((r) => r.punycode));
  const issues = bins(
    rows.filter((r) => r.issues.length && !isIdn(r.punycode)).map((r) => r.punycode)
  );
  const scale = AMP / Math.max(...ink, ...gold);

  const IDN_X = W + 20;
  const IDN_W = BAR;
  const idnScale = AMP / Math.max(rootIdn, discIdn, 1);

  return (
    <svg
      viewBox={`0 0 ${IDN_X + IDN_W} ${H}`}
      className={`w-full h-auto ${className ?? ""}`}
      role="img"
      aria-label={`Root zone against this round, by initial letter. Above the line, ${rootAscii.length} delegated TLDs; below it, ${disclosed.length} disclosed strings. IDN block: ${rootIdn} delegated, ${discIdn} disclosed.`}
    >
      {LETTERS.map((ch, i) => {
        const x = i * STEP + (STEP - BAR) / 2;
        return (
          <g key={ch}>
            {ink[i] > 0 && (
              <rect
                x={x}
                y={MID - ink[i] * scale}
                width={BAR}
                height={ink[i] * scale}
                fill="var(--ink)"
                opacity="0.3"
              />
            )}
            {gold[i] > 0 && (
              <rect
                x={x}
                y={MID}
                width={BAR}
                height={gold[i] * scale}
                fill="var(--gold)"
              />
            )}
            {issues[i] > 0 && (
              <rect
                x={x}
                y={MID}
                width={BAR}
                height={issues[i] * scale}
                fill="var(--oxblood)"
              />
            )}
            <text
              className={TICK}
              x={i * STEP + STEP / 2}
              y={H - 3}
              textAnchor="middle"
              fontSize="8"
              letterSpacing="0.5"
              fill="var(--ink-soft)"
              fontFamily="var(--font-jost), sans-serif"
            >
              {ch}
            </text>
          </g>
        );
      })}

      <rect
        x={IDN_X}
        y={MID - rootIdn * idnScale}
        width={IDN_W}
        height={rootIdn * idnScale}
        fill="var(--ink)"
        opacity="0.3"
      />
      <rect
        x={IDN_X}
        y={MID}
        width={IDN_W}
        height={discIdn * idnScale}
        fill="var(--gold)"
      />
      <text
        className={TICK}
        x={IDN_X + IDN_W / 2}
        y={H - 3}
        textAnchor="middle"
        fontSize="8"
        letterSpacing="0.5"
        fill="var(--ink-soft)"
        fontFamily="var(--font-jost), sans-serif"
      >
        idn
      </text>

      <line x1="0" y1={MID} x2={W} y2={MID} stroke="var(--ink)" strokeWidth="0.75" />
      <line
        x1={IDN_X}
        y1={MID}
        x2={IDN_X + IDN_W}
        y2={MID}
        stroke="var(--ink)"
        strokeWidth="0.75"
      />
    </svg>
  );
}
