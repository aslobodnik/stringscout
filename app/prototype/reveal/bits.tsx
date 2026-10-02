// PROTOTYPE, throwaway. Pieces the strings view and the entities view share.
import Link from "next/link";
import Tld from "@/components/Tld";
import Tip from "@/components/Tip";
import type { Link as GroupLink, MockApp, MockGroup } from "./mock";

export const STRINGS = "/prototype/reveal";
export const ENTITIES = "/prototype/reveal/entities";

export const TAG = "label !text-[9px]";
export const LINK =
  "cursor-pointer underline decoration-rule underline-offset-2 hover:decoration-gold transition-colors duration-200 ease-in-out";
export const TH = "label !tracking-[0.06em] sm:!tracking-[0.18em] text-ink-soft pb-2 pr-4 font-medium whitespace-nowrap text-left";
export const DASH = <span className="text-ink-soft">—</span>;

export const LINK_LABEL: Record<GroupLink, string> = {
  parent: "declared parent",
  control: "declared controller",
  person: "shared director",
  address: "shared address",
};
// the first two are the applicant's own statement; the rest we inferred
export const inferred = (l: GroupLink | null) => l === "person" || l === "address";

const HOW = { applied: "applied for by", named: "also named by" };

// An application's replacement. Knocked out, it is struck through and carries
// the number of applications that knock it out; hovering names them. None
// named prints the dash /applicants uses for an empty count.
export function Replacement({ a }: { a: MockApp }) {
  if (!a.replacement) return DASH;
  const n = a.blockers.length;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span className={n ? "group relative cursor-default" : ""}>
        {n > 0 && (
          <Tip>
            {a.blockers.map((b) => (
              <span key={b.how + b.name} className="block">
                <span className="serif italic text-ink-soft">{HOW[b.how]}</span> {b.name}
              </span>
            ))}
          </Tip>
        )}
        <span className={n ? "line-through decoration-oxblood text-ink-soft" : ""}>
          <Tld>{a.replacement}</Tld>
        </span>
        {n > 0 && <sup className="text-oxblood ml-0.5">{n}</sup>}
      </span>
      {a.near && <span className={`${TAG} text-oxblood`}>{a.near}</span>}
    </span>
  );
}

export const MockTag = ({ on }: { on: boolean }) =>
  on ? <span className={`${TAG} text-ink-soft ml-2`}>mock</span> : null;

// A string that links to its row in the strings view; one with rivals carries
// the number of applications for it, as the homepage index does.
export function StringLink({ a }: { a: MockApp }) {
  return (
    <Link href={`${STRINGS}#s-${a.tld}`} className="whitespace-nowrap hover:text-gold transition-colors duration-200 ease-in-out">
      <Tld>{a.tld}</Tld>
      {a.setSize > 1 && <sup className="text-oxblood ml-0.5">{a.setSize}</sup>}
    </Link>
  );
}

export function StringList({ apps }: { apps: MockApp[] }) {
  return (
    <>
      {apps.map((a, i) => (
        <span key={a.id}>
          {i > 0 && <span className="text-rule"> · </span>}
          <StringLink a={a} />
        </span>
      ))}
    </>
  );
}

// What the group rests on, as one plain sentence.
export function evidence(g: MockGroup): string | null {
  if (g.link === "parent") return `Each entity declares ${g.evidence} as its parent.`;
  if (g.link === "control") return `Each entity declares ${g.evidence} as its controller.`;
  if (g.link === "person") return `The entities name the same director, ${g.evidence}.`;
  if (g.link === "address") return `The entities give the same business address, ${g.evidence}.`;
  return null;
}
