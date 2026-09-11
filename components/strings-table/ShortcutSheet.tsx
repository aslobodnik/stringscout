import { Fragment, useEffect, useRef, useSyncExternalStore } from "react";

// A key cap: a square box with a heavier foot, in the site's mono because it
// names a key rather than a word.
const KBD =
  "min-w-[1.75em] border border-ink border-b-2 bg-paper-deep px-1.5 text-center text-[11px] font-medium leading-5 text-ink";

export const isMac = () => /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const never = () => () => {};

// The list a reader gets by pressing ? anywhere on the page. Reached only by
// key, so it only ever opens for someone with a keyboard.
export function ShortcutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const box = useRef<HTMLDialogElement>(null);
  // the server does not know the platform; the client fills it in after hydration
  const mac = useSyncExternalStore(never, isMac, () => false);
  // Always mounted, opened and closed in place: showModal puts the rest of the
  // page out of reach, and close() on an element still in the document hands
  // focus back to wherever it was.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);
  const rows: { keys: string[]; or?: boolean; what: string }[] = [
    { keys: ["/", mac ? "⌘ K" : "Ctrl K"], or: true, what: "Search" },
    { keys: ["←", "→"], what: "Previous page, next page" },
    { keys: ["Esc"], what: "Clear the search and filters, or close this" },
    { keys: ["↑", "↓"], what: "Move through the applicant menu; a letter jumps to it" },
    { keys: ["?"], what: "This list" },
  ];
  return (
    <dialog
      ref={box}
      aria-label="Keyboard shortcuts"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // the backdrop is the dialog's own margin
      }}
      className="m-auto w-[min(92vw,24rem)] border border-ink bg-paper px-6 py-5 text-ink focus:outline-none backdrop:bg-ink/20"
    >
        <div className="label">Keyboard</div>
        <div className="double-rule mt-2 mb-4" />
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-3 text-sm">
          {rows.map(({ keys, or, what }) => (
            <Fragment key={what}>
              <dt className="flex items-baseline gap-1.5 whitespace-nowrap">
                {keys.map((k, i) => (
                  <Fragment key={k}>
                    {i > 0 && or && <span className="text-xs text-ink-soft">or</span>}
                    <kbd className={`inline-block ${KBD}`}>{k}</kbd>
                  </Fragment>
                ))}
              </dt>
              <dd>{what}</dd>
            </Fragment>
          ))}
        </dl>
    </dialog>
  );
}
