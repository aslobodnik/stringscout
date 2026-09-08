// The house hover: a paper-deep box with a gold rule at its left edge that
// fades and lifts in over 300ms on the parent's hover. The parent carries
// `group relative`. Never a native title: the browser's grey box neither
// fades nor matches the page. Hidden below sm, where there is no hover.
export const TIP_BOX =
  "pointer-events-none absolute bottom-full mb-1.5 z-30 hidden sm:block whitespace-nowrap border border-ink border-l-2 border-l-gold bg-paper-deep text-ink px-2.5 py-1.5 text-xs font-normal normal-case tracking-normal opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out";

const SIDE = { left: "left-0", right: "right-0" };

export default function Tip({
  children,
  side = "left",
  className = "",
}: {
  children: React.ReactNode;
  side?: keyof typeof SIDE; // right, for a control at the page's right edge
  className?: string;
}) {
  return (
    <span role="tooltip" className={`${TIP_BOX} ${SIDE[side]} ${className}`}>
      {children}
    </span>
  );
}
