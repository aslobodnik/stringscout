// The post-reveal entities view on APS data. The pre-reveal page is at /archive/applicants.
import type { Metadata } from "next";
import { TopBar } from "@/components/PageHeader";
import { buildReal } from "@/app/prototype/reveal/real";
import Header from "@/app/prototype/reveal/Header";
import Entities from "@/app/prototype/reveal/entities/Entities";

export const metadata: Metadata = {
  title: "Applicants",
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/applicants" />
      <Header stats={data.stats} current="groups" />
      <Entities data={data} />
    </>
  );
}
