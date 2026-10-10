import { ImageResponse } from "next/og";
import { withdrawnClaims } from "@/data/announcedAdapter";
import { GOLD, ogFonts, PageCard } from "@/lib/og";

const OXBLOOD_70 = "rgba(110, 42, 36, 0.7)"; // the page's decoration-oxblood/70

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout Withdrawn: every string announced for the 2026 round and then pulled, struck through";

// every withdrawn string, its label struck as the page strikes it
export default async function WithdrawnOgImage() {
  const tlds = [...new Set(withdrawnClaims.map((w) => w.tld))].sort();
  return new ImageResponse(
    <PageCard path="/withdrawn" title="Withdrawn" count={tlds.length}>
      <div style={{ position: "absolute", top: 296, left: 72, right: 72, display: "flex", flexWrap: "wrap", columnGap: 34, rowGap: 14, fontSize: 36, fontWeight: 300 }}>
        {tlds.map((t) => (
          <div key={t} style={{ display: "flex" }}>
            <span style={{ color: GOLD }}>.</span>
            <span style={{ textDecoration: "line-through", textDecorationColor: OXBLOOD_70 }}>{t}</span>
          </div>
        ))}
      </div>
    </PageCard>,
    { ...size, fonts: await ogFonts() },
  );
}
