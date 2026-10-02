// PROTOTYPE, throwaway: the post-reveal entities view on mock data. Three
// variants of the page that starts from who applied, switchable via
// ?variant=A|B|C on /prototype/reveal/entities and the floating bar.
import type { Metadata } from "next";
import { TopBar } from "@/components/PageHeader";
import { buildMock } from "../mock";
import Header from "../Header";
import Entities from "./Entities";

export const metadata: Metadata = {
  title: "Reveal prototype, entities",
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const variant = typeof sp.variant === "string" ? sp.variant.toUpperCase() : "A";
  const data = buildMock();
  return (
    <>
      <TopBar current="/applicants" />
      <Header stats={data.stats} current="groups" />
      <Entities data={data} initial={variant} />
    </>
  );
}
