"use client";

// The days of RecentWithdrawals as a ledger. A day opens on its own line: the
// chevron pulls a dot leader out to the names, which run to the right of the
// dates, so the page below holds still unless a day runs past the last date,
// and then it gives way over the same 300ms. Below sm there is no room beside
// the dates and the names unfold under their day.
import { Fragment, useState, type CSSProperties } from "react";
import Tld from "@/components/Tld";
import { LINK } from "@/app/prototype/reveal/bits";

export type WithdrawalDay = {
  date: string; // ISO, the key
  label: string; // "25 Nov"
  count: number;
  groups: { applicant: string; tlds: string[] }[];
};

const REDUCE = "motion-reduce:transition-none";
// from sm the names wait for the leader on the way in; out, both go in 150ms
const PANEL = {
  open: "grid-rows-[1fr] opacity-100 [transition:grid-template-rows_300ms_ease-in-out,opacity_300ms_ease-in-out_var(--wait)] [--wait:0ms] sm:[--wait:100ms]",
  // from sm the names fade where they stand and only then give back any room
  // they took, so no line is ever sliced mid-glyph on the way out
  shut: "grid-rows-[0fr] opacity-0 [transition:grid-template-rows_300ms_ease-in-out_var(--shut),opacity_150ms_ease-in-out] [--shut:0ms] sm:[--shut:150ms]",
};

export default function WithdrawalDays({ days }: { days: WithdrawalDay[] }) {
  const [open, setOpen] = useState<string | null>(null);
  // counts share a slot, so the words and the chevrons line up down the list
  const digits = Math.max(...days.map((d) => String(d.count).length));
  return (
    <div
      // from sm: the dates in one column, a row each, and every day's names in
      // the other from its own row down. The last row is the only one that
      // can stretch, so a long day never spreads the dates apart.
      className="mt-2 grid text-sm leading-6 sm:grid-cols-[max-content_minmax(0,1fr)] sm:[grid-template-rows:repeat(var(--days),auto)_1fr]"
      style={{ "--days": days.length } as CSSProperties}
    >
      {days.map((d, i) => {
        const on = open === d.date;
        const dim = open !== null && !on;
        const id = `withdrawn-${d.date}`;
        return (
          <Fragment key={d.date}>
            <button
              type="button"
              aria-expanded={on}
              aria-controls={id}
              onClick={() => setOpen(on ? null : d.date)}
              // the leader and chevron leave in half the time they arrive, with
              // the names, so a swap never shows two days drawn at once
              className="group flex w-fit cursor-pointer items-baseline text-left [--t:150ms] aria-expanded:[--t:300ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:col-start-1 sm:w-full sm:[grid-row:var(--row)]"
              style={{ "--row": i + 1 } as CSSProperties}
            >
              {/* from sm, while another day is open this one steps back, so
                  the names beside it read as the open day's */}
              <span
                className={`flex items-baseline transition-opacity duration-300 ease-in-out motion-reduce:transition-none ${dim ? "sm:opacity-40 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100" : ""}`}
              >
                <span className="mr-4 w-14 shrink-0 text-ink-soft">{d.label}</span>
                <span className="whitespace-nowrap">
                  <span className="inline-block text-right" style={{ width: `${digits}ch` }}>
                    {d.count}
                  </span>{" "}
                  withdrawn
                </span>
                {/* below sm the chevron turns; from sm it draws the leader out
                    to the rule and is gone on arrival */}
                <span
                  aria-hidden
                  className={`ml-1.5 inline-block text-ink-soft group-hover:text-gold [transition:translate_var(--t)_ease-in-out,rotate_var(--t)_ease-in-out,opacity_var(--t)_ease-in-out,color_200ms_ease-in-out] group-aria-expanded:rotate-90 sm:group-aria-expanded:translate-x-10 sm:group-aria-expanded:rotate-0 sm:group-aria-expanded:opacity-0 ${REDUCE}`}
                >
                  ›
                </span>
              </span>
              <span
                aria-hidden
                className={`-ml-[0.6em] hidden w-12 -translate-y-[3px] border-b border-dotted border-gold [clip-path:inset(0_100%_0_0)] [transition:clip-path_var(--t)_ease-in-out] group-aria-expanded:[clip-path:inset(0)] sm:block ${REDUCE}`}
              />
            </button>
            <div
              id={id}
              inert={!on}
              className={`grid motion-reduce:transition-none sm:col-start-2 sm:self-start sm:[grid-row:var(--row)/-1] ${on ? PANEL.open : PANEL.shut}`}
              style={{ "--row": i + 1 } as CSSProperties}
            >
              <ul className="flex min-h-0 flex-wrap gap-x-5 overflow-hidden pl-[4.5rem] pr-1 sm:border-l sm:border-gold sm:pl-3">
                {d.groups.map((g) => (
                  <li key={g.applicant} className="basis-full pl-4 -indent-4 last:mb-2 sm:basis-auto sm:last:mb-0">
                    <span className="text-ink-soft">{g.applicant}</span>
                    {g.tlds.map((t) => (
                      <Fragment key={t}>
                        {" "}
                        {/* a full load: the table reads ?q= once, on mount */}
                        <a href={`/?q=${t}`} className={`${LINK} whitespace-nowrap font-medium`}>
                          <Tld>{t}</Tld>
                        </a>
                      </Fragment>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
