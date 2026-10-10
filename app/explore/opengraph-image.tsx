import { ImageResponse } from "next/og";
import { GOLD, INK, INK_SOFT, ogFonts, PAPER_DEEP, PageCard, RULE } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout Explore — a ski search with related strings: mountain, lift, resort, gear, edge, and himalaya.";

// A fixed example keeps shared links fast and never calls the search API.
export default async function ExploreOgImage() {
  return new ImageResponse(
    <PageCard path="/explore" title="Explore Related Strings">
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
    </PageCard>,
    { ...size, fonts: await ogFonts() },
  );
}
