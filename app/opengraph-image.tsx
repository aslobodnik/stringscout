import { ImageResponse } from "next/og";
import { stats } from "@/lib/derive";
import { lastUpdated } from "@/data/meta";
import { formatDate } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout — self-revealed strings in the 2026 gTLD round";

// Google serves a TTF when asked without a browser user agent; satori needs
// TTF or OTF, not the woff2 it gives browsers.
async function jost(weight: number): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Jost:wght@${weight}&display=swap`
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

const PAPER = "#f4efe3";
const INK = "#211d15";
const INK_SOFT = "#6b6353";
const GOLD = "#8a5f1a";
const RULE = "rgba(33, 29, 21, 0.25)";

// The card is the page's own header and count tiles, rendered at build from
// the same data, so a shared link carries the numbers as of that deploy.
export default async function OgImage() {
  const s = stats();
  const [light, medium] = await Promise.all([jost(300), jost(500)]);
  const fonts = [
    light && { name: "Jost", data: light, style: "normal" as const, weight: 300 as const },
    medium && { name: "Jost", data: medium, style: "normal" as const, weight: 500 as const },
  ].filter((f) => !!f);
  const tiles = [
    [s.applicants, "Applicants"],
    [s.strings, "Strings disclosed"],
    [s.contested, "Overlapping strings"],
    [s.issues, "Potential issues"],
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
          fontFamily: fonts.length ? "Jost" : "sans-serif",
          fontWeight: 500,
        }}
      >
        {/* the plate frame from the site: a hairline, then a gold one inside */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            right: 14,
            bottom: 14,
            border: "1px solid rgba(33, 29, 21, 0.2)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: "1px solid rgba(138, 95, 26, 0.3)",
          }}
        />
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
        <div style={{ display: "flex", border: `1px solid ${INK}`, marginTop: 34 }}>
          {tiles.map(([n, label], i) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "22px 20px",
                ...(i ? { borderLeft: `1px solid ${RULE}` } : {}),
              }}
            >
              <div style={{ fontSize: 60, fontWeight: 300, lineHeight: 1 }}>{String(n)}</div>
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
                  borderBottom: `1px dashed ${RULE}`,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            fontSize: 17,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: INK_SOFT,
            marginTop: 24,
          }}
        >
          {`Updated ${formatDate(lastUpdated)}`}
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
