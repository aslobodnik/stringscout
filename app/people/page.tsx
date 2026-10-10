// The post-reveal people view on APS data: everyone the records name as a
// director, officer or executive, and what they stand behind.
import type { Metadata } from "next";
import { share } from "@/lib/share";
import { TopBar } from "@/components/PageHeader";
import { buildReal } from "@/app/prototype/reveal/real";
import People from "@/app/prototype/reveal/people/People";

export const metadata: Metadata = {
  title: "People",
  ...share("People", "/people"),
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/people" />
      <People data={data} />
    </>
  );
}
