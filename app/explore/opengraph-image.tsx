import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout Explore — a ski search with related strings: mountain, lift, resort, gear, edge, and himalaya.";

const PAPER = "#f4efe3";
const PAPER_DEEP = "#ece5d3";
const INK = "#211d15";
const INK_SOFT = "#6b6353";
const GOLD = "#8a5f1a";
const RULE = "rgba(33, 29, 21, 0.25)";

// A fixed example keeps shared links fast and never calls the search API.
export default async function ExploreOgImage() {
  const [serif, light, medium] = await Promise.all([
    readFile(join(process.cwd(), "app/fonts/old-standard-400.ttf")),
    readFile(join(process.cwd(), "app/fonts/jost-300.ttf")),
    readFile(join(process.cwd(), "app/fonts/jost-500.ttf")),
  ]);

  return new ImageResponse(
    <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: PAPER, color: INK, fontFamily: "Jost", fontWeight: 500 }}>
      <div style={{ position: "absolute", top: 14, left: 14, right: 14, bottom: 14, border: "1px solid rgba(33, 29, 21, 0.2)" }} />
      <div style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, border: "1px solid rgba(138, 95, 26, 0.3)" }} />

      <div style={{ position: "absolute", top: 56, left: 72, right: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 5, textTransform: "uppercase" }}>
          <span>String</span><span style={{ color: GOLD }}>scout</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 300, color: INK_SOFT }}>stringscout.com/explore</div>
      </div>
      <div style={{ position: "absolute", top: 111, left: 72, right: 72, height: 1, background: INK }} />

      <div style={{ position: "absolute", top: 165, left: 72, fontFamily: "Old Standard", fontSize: 78, fontWeight: 400, lineHeight: 1.1, letterSpacing: -2 }}>
        Explore Related Strings
      </div>
      <div style={{ position: "absolute", top: 265, left: 72, fontSize: 28, fontWeight: 300, color: INK_SOFT }}>
        Type a word or phrase. Find related strings.
      </div>

      <div style={{ position: "absolute", top: 350, left: 72, right: 72, height: 84, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${INK}`, padding: "10px 12px 10px 24px" }}>
        <div style={{ fontSize: 40, fontWeight: 300 }}>ski</div>
        <div style={{ display: "flex", height: 60, alignItems: "center", padding: "0 30px", border: "1px solid rgba(138, 95, 26, 0.4)", background: PAPER_DEEP, color: GOLD, fontSize: 15, letterSpacing: 3, textTransform: "uppercase" }}>
          Explore
        </div>
      </div>
      <div style={{ position: "absolute", top: 464, left: 72, display: "flex", gap: 14 }}>
        {["mountain", "lift", "resort", "gear", "edge", "himalaya"].map((string) => (
          <div key={string} style={{ display: "flex", alignItems: "center", height: 60, padding: "0 24px", border: `1px solid ${RULE}`, borderRadius: 999, background: "rgba(236, 229, 211, 0.5)", fontSize: 28, fontWeight: 300 }}>
            <span style={{ color: GOLD }}>.</span><span>{string}</span>
          </div>
        ))}
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Old Standard", data: serif, style: "normal", weight: 400 },
        { name: "Jost", data: light, style: "normal", weight: 300 },
        { name: "Jost", data: medium, style: "normal", weight: 500 },
      ],
    },
  );
}
