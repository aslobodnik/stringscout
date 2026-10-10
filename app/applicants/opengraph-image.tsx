import { ImageResponse } from "next/og";
import { buildReal } from "@/app/prototype/reveal/real";
import { ogFonts, PageCard, Rows } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout Applicants: the applicant count and the first five applicants by applications, with entities and applications for each";

// the page's head count and its first five rows, most applications first
export default async function ApplicantsOgImage() {
  const { groups } = buildReal();
  return new ImageResponse(
    <PageCard path="/applicants" title="Applicants" count={groups.length}>
      <Rows head={["Applicant", "Entities", "Apps"]} rows={groups.slice(0, 5).map((g) => [g.name, g.entities.length, g.apps.length] as const)} />
    </PageCard>,
    { ...size, fonts: await ogFonts() },
  );
}
