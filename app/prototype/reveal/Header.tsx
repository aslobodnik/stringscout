// PROTOTYPE, throwaway. The sentence both views open with; its two counts are
// the way between them.
import Link from "next/link";
import NextDate from "./NextDate";
import { ENTITIES, LINK, STRINGS } from "./bits";
import type { MockData } from "./mock";

// stands in for the APS list URL, which ICANN has not published yet
const ICANN_SOURCE =
  "https://www.icann.org/en/announcements/details/icann-announces-date-for-reveal-day-and-other-2026-round-milestones-29-09-2026-en";

export default function Header({ stats, current }: { stats: MockData["stats"]; current: "strings" | "groups" }) {
  const strings = `${stats.strings} strings`;
  const groups = `${stats.groups} groups`;
  return (
    <header className="pt-6 pb-7">
      <h1 className="serif italic text-lg sm:text-xl text-ink max-w-3xl">
        ICANN revealed{" "}
        {current === "strings" ? strings : <Link href={STRINGS} className={LINK}>{strings}</Link>} in{" "}
        {stats.applications} applications from{" "}
        {current === "groups" ? groups : <Link href={ENTITIES} className={LINK}>{groups}</Link>} on 7 October 2026.
        <sup className="src not-italic ml-1">
          <a href={ICANN_SOURCE} target="_blank" rel="noopener noreferrer">
            ICANN
          </a>
        </sup>
      </h1>
      <NextDate />
    </header>
  );
}
