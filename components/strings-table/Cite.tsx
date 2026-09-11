import Link from "next/link";
import Tip from "@/components/Tip";
import { formatDate } from "@/lib/format";
import type { Citation, Citations } from "./types";

// The number in the /sources list, the outlet and date on hover.
export function Cite({ ids, cites }: { ids: string[]; cites: Citations }) {
  const nums = ids
    .map((id) => ({ id, c: cites[id] }))
    .filter((x): x is { id: string; c: Citation } => !!x.c);
  if (!nums.length) return null;
  return (
    <sup className="src ml-0.5 text-[9px] no-underline">
      {nums.map(({ id, c }, i) => (
        <span key={id} className="group relative">
          {i > 0 && <span className="text-rule">,</span>}
          <Tip>
            {c.outlet} · {formatDate(c.date)}
          </Tip>
          <Link href={`/sources#src-${c.n}`}>{c.n}</Link>
        </span>
      ))}
    </sup>
  );
}
