import { ImageResponse } from "next/og";
import { INK_SOFT, OXBLOOD, ogFonts, PageCard } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout Overlaps: applicants for strings in the same contention set may not communicate, directly or indirectly, with each other about their applications or any strategy for the string. AGB §5.2.3.1";

const RULE_TEXT: [string, boolean][] = [
  ["Applicants for strings in the same contention set may not communicate,", false],
  ["directly or indirectly,", true],
  ["with each other about their applications or any strategy for the string.", false],
];

// the rule the page answers to. One box per word, so the line wraps between
// words and the marked words can take their own face.
export default async function OverlapOgImage() {
  const words = RULE_TEXT.flatMap(([text, marked]) => text.split(" ").map((w) => [w, marked] as const));
  return new ImageResponse(
    <PageCard path="/overlap" title="Overlaps">
      <div style={{ position: "absolute", top: 284, left: 72, right: 72, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", columnGap: 11, fontSize: 40, fontWeight: 300, lineHeight: 1.4 }}>
          {words.map(([w, marked], i) =>
            marked ? (
              <span key={i} style={{ fontFamily: "Old Standard", fontStyle: "italic", fontWeight: 400, fontSize: 44, color: OXBLOOD }}>{w}</span>
            ) : (
              <span key={i}>{w}</span>
            ),
          )}
        </div>
        <div style={{ fontSize: 15, letterSpacing: 3, color: INK_SOFT, marginTop: 18 }}>AGB §5.2.3.1</div>
      </div>
    </PageCard>,
    { ...size, fonts: await ogFonts() },
  );
}
