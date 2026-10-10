// What every share card is drawn from: the site's tokens, the plate frame,
// and the head that names the page. Each route's opengraph-image.tsx lays its
// own facts under the head, rendered at build from the same data the page reads.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties, ReactNode } from "react";
import { SITE } from "@/data/meta";

export const PAPER = "#f4efe3";
export const PAPER_DEEP = "#ece5d3";
export const INK = "#211d15";
export const INK_SOFT = "#6b6353";
export const GOLD = "#8a5f1a";
export const OXBLOOD = "#6e2a24";
export const RULE = "rgba(33, 29, 21, 0.25)";

// Vendored so the build never reaches Google Fonts and a missing file fails
// the build instead of the card silently falling back to sans-serif. Satori
// needs TTF or OTF.
const font = (file: string) => readFile(join(process.cwd(), "app/fonts", file));

export async function ogFonts() {
  const [serif, serifItalic, light, medium] = await Promise.all([
    font("old-standard-400.ttf"),
    font("old-standard-400-italic.ttf"),
    font("jost-300.ttf"),
    font("jost-500.ttf"),
  ]);
  return [
    { name: "Old Standard", data: serif, style: "normal" as const, weight: 400 as const },
    { name: "Old Standard", data: serifItalic, style: "italic" as const, weight: 400 as const },
    { name: "Jost", data: light, style: "normal" as const, weight: 300 as const },
    { name: "Jost", data: medium, style: "normal" as const, weight: 500 as const },
  ];
}

// The plate frame from the site: a hairline, then a gold one inside. One
// absolute box, not a fragment: satori lays a fragment out as a box in flow.
export function Plate() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex" }}>
      <div style={{ position: "absolute", top: 14, left: 14, right: 14, bottom: 14, border: "1px solid rgba(33, 29, 21, 0.2)" }} />
      <div style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, border: "1px solid rgba(138, 95, 26, 0.3)" }} />
    </div>
  );
}

// The wordmark and the address across the top, the page's name under the rule,
// and the body below from y 290. The count sits after the name as the page's
// section head prints it.
export function PageCard({ path, title, count, children }: { path: string; title: string; count?: number; children?: ReactNode }) {
  return (
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: PAPER, color: INK, fontFamily: "Jost", fontWeight: 500 }}>
      <Plate />
      <div style={{ position: "absolute", top: 56, left: 72, right: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, textTransform: "uppercase" }}>
          <span>String</span><span style={{ color: GOLD }}>scout</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 300, color: INK_SOFT }}>{`${new URL(SITE).host}${path}`}</div>
      </div>
      <div style={{ position: "absolute", top: 111, left: 72, right: 72, height: 1, background: INK }} />
      <div style={{ position: "absolute", top: 165, left: 72, display: "flex", alignItems: "baseline", gap: 26 }}>
        <div style={{ fontFamily: "Old Standard", fontSize: 78, fontWeight: 400, lineHeight: 1.1, letterSpacing: -2 }}>{title}</div>
        {count !== undefined && <div style={{ fontSize: 40, fontWeight: 300, color: INK_SOFT }}>{count.toLocaleString("en-US")}</div>}
      </div>
      {children}
    </div>
  );
}

// A row of counts in a ruled box, each labelled underneath.
export function Tiles({ tiles, dashed = false, style }: { tiles: readonly (readonly [number, string])[]; dashed?: boolean; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${INK}`, ...style }}>
      {tiles.map(([n, label], i) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", flex: 1, padding: "22px 20px", ...(i ? { borderLeft: `1px solid ${RULE}` } : {}) }}>
          <div style={{ fontSize: 60, fontWeight: 300, lineHeight: 1 }}>{n.toLocaleString("en-US")}</div>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              fontSize: 13,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: INK_SOFT,
              marginTop: 14,
              paddingBottom: 3,
              ...(dashed ? { borderBottom: `1px dashed ${RULE}` } : {}),
            }}
          >
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}

// The first rows of a page's table, its own columns, numbers set right.
export function Rows({ head, rows }: { head: string[]; rows: (readonly [string, ...number[]])[] }) {
  const label = { fontSize: 14, letterSpacing: 3, textTransform: "uppercase" as const, color: INK_SOFT };
  return (
    <div style={{ position: "absolute", top: 290, left: 72, right: 72, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", paddingBottom: 10 }}>
        <div style={{ ...label, flex: 1 }}>{head[0]}</div>
        {head.slice(1).map((h) => (
          <div key={h} style={{ ...label, width: 150, display: "flex", justifyContent: "flex-end" }}>{h}</div>
        ))}
      </div>
      {rows.map(([name, ...ns], r) => (
        <div key={r} style={{ display: "flex", alignItems: "baseline", borderTop: `1px solid ${RULE}`, padding: "6px 0", fontSize: 26, fontWeight: 300 }}>
          <div style={{ flex: 1, display: "flex", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{name}</div>
          {ns.map((n, i) => (
            <div key={i} style={{ width: 150, display: "flex", justifyContent: "flex-end" }}>{n.toLocaleString("en-US")}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
