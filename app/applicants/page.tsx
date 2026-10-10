// The post-reveal entities view on APS data. The pre-reveal page is at /archive/applicants.
import type { Metadata } from "next";
import { share } from "@/lib/share";
import { TopBar } from "@/components/PageHeader";
import { buildReal } from "@/app/prototype/reveal/real";
import Entities from "@/app/prototype/reveal/entities/Entities";

export const metadata: Metadata = {
  title: "Applicants",
  ...share("Applicants", "/applicants"),
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/applicants" />
      <Entities data={data} />
    </>
  );
}
