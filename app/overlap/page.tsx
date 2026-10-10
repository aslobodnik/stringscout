// Who shares a string with one person: the check before a conversation.
import type { Metadata } from "next";
import { share } from "@/lib/share";
import { TopBar } from "@/components/PageHeader";
import { buildReal } from "@/app/prototype/reveal/real";
import Overlap from "./Overlap";

const description =
  "Who shares a string with you in ICANN's 2026 new gTLD round, most shared first.";

export const metadata: Metadata = {
  title: "Overlaps",
  description,
  alternates: { canonical: "/overlap" },
  ...share("Overlaps", "/overlap", description),
};

export default function Page() {
  const data = buildReal();
  return (
    <>
      <TopBar current="/overlap" />
      <Overlap data={data} />
    </>
  );
}
