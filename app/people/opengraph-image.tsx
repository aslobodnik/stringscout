import { ImageResponse } from "next/og";
import { buildReal } from "@/app/prototype/reveal/real";
import { ogFonts, PageCard, Rows } from "@/lib/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Stringscout People: the count of people the applications name and the first five by applications, with entities and applications for each";

// the page's head count and its first five rows, most applications first
export default async function PeopleOgImage() {
  const people = buildReal().people ?? [];
  return new ImageResponse(
    <PageCard path="/people" title="People" count={people.length}>
      <Rows head={["Person", "Entities", "Apps"]} rows={people.slice(0, 5).map((p) => [p.name, p.entities.length, p.apps.length] as const)} />
    </PageCard>,
    { ...size, fonts: await ogFonts() },
  );
}
