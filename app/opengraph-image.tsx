import { ImageResponse } from "next/og";
import { buildReal } from "@/app/prototype/reveal/real";
import { GOLD, INK, INK_SOFT, ogFonts, PAPER, Plate, Tiles } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout: every string applied for in ICANN's 2026 gTLD round";

// The card is the page's own header counts, rendered at build from ICANN's
// APS record, so a shared link carries the numbers as of that deploy.
export default async function OgImage() {
  const s = buildReal().stats;
  const tiles = [
    [s.strings, "Strings"],
    [s.applications, "Applications"],
    [s.groups, "Parent companies"],
    [s.sets, "Contention sets"],
  ] as const;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: PAPER,
          color: INK,
          padding: "0 84px",
          fontFamily: "Jost",
          fontWeight: 500,
        }}
      >
        <Plate />
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: INK_SOFT,
            paddingBottom: 18,
          }}
        >
          ICANN gTLD round · 2026
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 5, background: INK }} />
          <div style={{ height: 4 }} />
          <div style={{ height: 2, background: INK }} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            letterSpacing: 13,
            textTransform: "uppercase",
            marginTop: 26,
          }}
        >
          <span>String</span>
          <span style={{ color: GOLD }}>scout</span>
        </div>
        <Tiles tiles={tiles} dashed style={{ marginTop: 34 }} />
        <div
          style={{
            fontSize: 17,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: INK_SOFT,
            marginTop: 24,
          }}
        >
          Revealed by ICANN 7 October 2026
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() }
  );
}
