import { ImageResponse } from "next/og";
import { KIND_LABEL, KIND_ORDER, sources } from "@/data/sources";
import { ogFonts, PageCard, Tiles } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout Sources: the source count, split by applicant statements, trade press, general press and reference";

// the page's groups and how many sources each holds
export default async function SourcesOgImage() {
  const tiles = KIND_ORDER.map((k) => [sources.filter((s) => s.kind === k).length, KIND_LABEL[k]] as const).filter(([n]) => n);
  return new ImageResponse(
    <PageCard path="/sources" title="Sources" count={sources.length}>
      <Tiles style={{ position: "absolute", top: 300, left: 72, right: 72 }} tiles={tiles} />
    </PageCard>,
    { ...size, fonts: await ogFonts() },
  );
}
