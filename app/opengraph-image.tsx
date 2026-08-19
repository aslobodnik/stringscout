import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout — ICANN 2026 gTLD round tracker";

async function jost(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      "https://fonts.googleapis.com/css2?family=Jost:wght@500&display=swap"
    ).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OgImage() {
  const font = await jost();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#f4efe3",
          color: "#211d15",
          padding: "72px 88px",
          fontFamily: font ? "Jost" : "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#6b6353",
            paddingBottom: 20,
          }}
        >
          ICANN gTLD round · 2026
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ height: 6, background: "#211d15" }} />
          <div style={{ height: 4 }} />
          <div style={{ height: 2, background: "#211d15" }} />
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 118,
            letterSpacing: 18,
            textTransform: "uppercase",
            marginTop: 36,
          }}
        >
          <span>String</span>
          <span style={{ color: "#8a5f1a" }}>scout</span>
        </div>
        <div style={{ fontSize: 32, color: "#6b6353", marginTop: 24 }}>
          Self-revealed strings in the 2026 gTLD round.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Jost", data: font, style: "normal" as const, weight: 500 as const }]
        : undefined,
    }
  );
}
