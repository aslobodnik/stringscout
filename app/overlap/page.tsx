// Who shares a string with one person: the check before a conversation.
import type { Metadata } from "next";
import { TopBar } from "@/components/PageHeader";
import { buildReal } from "@/app/prototype/reveal/real";
import Overlap from "./Overlap";

export const metadata: Metadata = {
  title: "Overlap",
  robots: { index: false },
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
