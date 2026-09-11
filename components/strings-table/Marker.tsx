import Tip, { TIP_BOX } from "@/components/Tip";
import { MARKS, type Mark } from "@/lib/marks";

export const MARK_LABEL = Object.fromEntries(MARKS.map((m) => [m.mark, m.label]));
const MARK_DETAIL = Object.fromEntries(MARKS.map((m) => [m.mark, m.detail]));

// How firmly an applicant tied itself to a string. Every claim carries one,
// and the weight of the box falls with it: "p" solid ink, "r" an ink outline,
// "u" a hairline. "u" is most of them and says only that nobody stated which,
// which a reader should be told rather than left to infer from an absence.
const BLOCK: Record<Mark, string> = {
  p: "bg-ink text-paper border-ink",
  r: "border-ink text-ink",
  u: "border-rule-faint text-ink-soft",
  i: "text-oxblood border-oxblood",
};

function MarkBlock({ mark, inverted }: { mark: Mark; inverted?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center w-[13px] h-[13px] text-[9px] font-medium uppercase leading-none border ${
        inverted ? "border-paper/45 text-paper" : BLOCK[mark]
      }`}
    >
      {mark}
    </span>
  );
}

export function Marker({
  mark,
  onFilter,
}: {
  mark: Mark;
  onFilter: (m: Mark) => void;
}) {
  return (
    // inline-block keeps the applicant button's underline from running beneath
    // the block: decorations are not drawn through an atomic inline
    <span className="group relative inline-block no-underline align-[0.1em]">
      <Tip>{MARK_DETAIL[mark]}</Tip>
      <button
        type="button"
        aria-label={MARK_DETAIL[mark]}
        onClick={(e) => {
          e.stopPropagation();
          onFilter(mark);
        }}
        className="ml-1 cursor-pointer align-middle"
      >
        <MarkBlock mark={mark} />
      </button>
    </span>
  );
}

// The legend doubles as a filter: the markers are the only way to separate a
// confirmed application from an announcement, so the definition and the way to
// isolate it belong in the same control.
export function Legend({
  present,
  active,
  onToggle,
}: {
  present: Mark[];
  active: Mark | null;
  onToggle: (m: Mark) => void;
}) {
  return (
    <div className="mt-4 mb-4 flex flex-wrap items-center gap-x-5 gap-y-2">
      {MARKS.filter((m) => present.includes(m.mark)).map(({ mark, label, detail }) => {
        const on = active === mark;
        return (
          <button
            key={mark}
            type="button"
            aria-pressed={on}
            aria-label={`${on ? "Show every marker" : `Show only ${label}`}. ${detail}`}
            onClick={() => onToggle(mark)}
            className={`group relative flex items-center gap-1.5 cursor-pointer px-1.5 -mx-1.5 py-1 transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold ${
              on ? "bg-ink text-paper" : "hover:bg-paper-deep"
            }`}
          >
            <span role="tooltip" className={`${TIP_BOX} left-0`}>
              {detail}
            </span>
            {/* selected, the whole control is one ink field — a bordered
                swatch inside it just reads as a box in a box */}
            <MarkBlock mark={mark} inverted={on} />
            <span
              className={`label !text-[10px] !tracking-[0.08em] ${
                on ? "text-paper" : "text-ink-soft"
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
