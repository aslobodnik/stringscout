// Who shares a string with one person: the check before a conversation.
import type { Metadata } from "next";
import { share } from "@/lib/share";
import { TopBar } from "@/components/PageHeader";
import PageIntro from "@/components/PageIntro";
import { LINK } from "@/app/prototype/reveal/bits";
import { buildReal } from "@/app/prototype/reveal/real";
import Overlap from "./Overlap";

const description =
  "Who shares a string with you in ICANN's 2026 new gTLD round, most shared first.";

export const metadata: Metadata = {
  title: "Overlaps",
  description,
  ...share("Overlaps", "/overlap", description),
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/overlap" />
      <PageIntro title="See who shares a string with you">
        Applicants for strings in the same contention set may not communicate,
        directly or indirectly, with each other about their applications or
        any strategy for the string{" "}
        <a
          href="https://newgtldprogram-2026-agb.icann.org/en/9-module-5-contention-set-resolution.html"
          target="_blank"
          rel="noopener"
          className={`${LINK} whitespace-nowrap`}
        >
          AGB §5.2.3.1
        </a>
        .
      </PageIntro>
      <Overlap data={data} />
    </>
  );
}
