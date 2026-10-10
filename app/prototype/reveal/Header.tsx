// The sentence the strings page opens with; its two counts are the way
// between views. Under it, the rule the overlap page serves and the way there.
import Link from "next/link";
import { ENTITIES, LINK, STRINGS } from "./bits";
import type { MockData } from "./mock";

// ICANN's Application Publication and Statistics site, the record itself
const ICANN_SOURCE = "https://newgtldprogram-aps.icann.org/applications";
const AGB_CONTENTION = "https://newgtldprogram-2026-agb.icann.org/en/9-module-5-contention-set-resolution.html";

export default function Header({ stats, current }: { stats: MockData["stats"]; current: "strings" | "groups" | "people" }) {
  const strings = `${stats.strings} strings`;
  const groups = `${stats.groups} parent companies`;
  return (
    <header className="pt-6 pb-7">
      <h1 className="serif italic text-lg sm:text-xl text-ink">
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
      <p className="mt-3 text-sm">
        Applicants in the same contention set may not communicate with each other about their{" "}
        <span className="whitespace-nowrap">
          applications{" "}
          <a href={AGB_CONTENTION} target="_blank" rel="noopener" className={`${LINK} label !text-[10px] text-ink-soft`}>
            AGB §5.2.3.1
          </a>
          .
        </span>
      </p>
      <p className="mt-1 text-sm">
        <Link href="/overlap" className={`${LINK} font-medium`}>
          Find who you overlap with
        </Link>
      </p>
    </header>
  );
}
