import { ImageResponse } from "next/og";
import { buildReal } from "@/app/prototype/reveal/real";
import { INK_SOFT, ogFonts, PageCard, Tiles } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout Overlaps: the AGB rule on contact within a contention set, with counts of contention sets, applications in them and people named on those applications";

// the rule the page answers to, and how many it reaches
export default async function OverlapOgImage() {
  const d = buildReal();
  const named = (d.people ?? []).filter((p) => p.inSets > 0).length;
  return new ImageResponse(
    <PageCard path="/overlap" title="Overlaps">
      <div style={{ position: "absolute", top: 282, left: 72, right: 72, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 27, fontWeight: 300, lineHeight: 1.4 }}>
          Applicants for strings in the same contention set may not communicate, directly or indirectly, with each other about their applications or any strategy for the string.
        </div>
        <div style={{ fontSize: 15, letterSpacing: 3, color: INK_SOFT, marginTop: 6 }}>AGB §5.2.3.1</div>
        <Tiles
          style={{ marginTop: 28 }}
          tiles={[
            [d.stats.sets, "Contention sets"],
            [d.stats.inContention, "Applications in a set"],
            [named, "People named on them"],
          ]}
        />
      </div>
    </PageCard>,
    { ...size, fonts: await ogFonts() },
  );
}
