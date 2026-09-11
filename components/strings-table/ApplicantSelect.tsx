import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export function Backdrop({ onClose }: { onClose: () => void }) {
  return <div className="fixed inset-0 z-10" aria-hidden onClick={onClose} />;
}

export function ApplicantSelect({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const items = ["all", ...options];
  const labelFor = (v: string) => (v === "all" ? "All applicants" : v);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  // the option to land on once the list mounts, when a key rather than a click opened it
  const landOn = useRef<number | null>(null);
  // letters typed in a row jump the list, as they do in a native select
  const typed = useRef("");
  const typedAt = useRef(0);
  const selected = Math.max(0, items.indexOf(value));

  const buttons = () =>
    [...(list.current?.querySelectorAll("button") ?? [])] as HTMLButtonElement[];
  const focusAt = (i: number) => {
    const b = buttons();
    b[Math.max(0, Math.min(b.length - 1, i))]?.focus();
  };

  useLayoutEffect(() => {
    if (!open || landOn.current === null) return;
    const b = list.current?.querySelectorAll("button");
    b?.[Math.min(b.length - 1, landOn.current)]?.focus();
    landOn.current = null;
  }, [open]);

  const close = () => {
    setOpen(false);
    typed.current = "";
    trigger.current?.focus();
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.metaKey || e.ctrlKey || e.altKey) {
      // a chord is the page's (Cmd-K reaches the search box); the list gets out of its way
      if (open) setOpen(false);
      return;
    }
    if (!open) {
      // Enter and Space press the trigger on their own
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        landOn.current = selected;
        setOpen(true);
      }
      return;
    }
    // while the list is open its keys are its own: none reach the page's shortcuts
    e.stopPropagation();
    const cur = buttons().indexOf(document.activeElement as HTMLButtonElement);
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusAt(cur < 0 ? selected : cur + 1);
        return;
      case "ArrowUp":
        e.preventDefault();
        focusAt(cur < 0 ? selected : cur - 1);
        return;
      case "Home":
        e.preventDefault();
        focusAt(0);
        return;
      case "End":
        e.preventDefault();
        focusAt(items.length - 1);
        return;
      case "Escape":
        e.preventDefault();
        close();
        return;
      case "Tab":
        setOpen(false);
        return;
    }
    if (e.key.length !== 1) return;
    const now = e.timeStamp;
    const running = typed.current !== "" && now - typedAt.current < 600;
    if (e.key === " " && !running) return; // a bare space presses the focused option
    e.preventDefault();
    typed.current = running ? typed.current + e.key : e.key;
    typedAt.current = now;
    // one letter, or the same letter again, walks the names that start with it
    const run = /^(.)\1*$/.test(typed.current) ? typed.current[0] : typed.current;
    const from = run.length === 1 ? cur + 1 : Math.max(cur, 0);
    const want = run.toLowerCase();
    for (let i = 0; i < items.length; i++) {
      const at = (from + i) % items.length;
      if (labelFor(items[at]).toLowerCase().startsWith(want)) {
        focusAt(at);
        return;
      }
    }
  };

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          typed.current = "";
          setOpen((v) => !v);
        }}
        className="label border border-ink text-ink px-3 h-10 w-56 cursor-pointer hover:bg-paper-deep transition-colors duration-200 ease-in-out flex items-center justify-between gap-2"
      >
        <span className="truncate">{labelFor(value)}</span>
        <span aria-hidden className="text-[8px] shrink-0">
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <>
          <Backdrop onClose={close} />
          <ul
            ref={list}
            role="listbox"
            className="paper-scroll absolute left-0 top-full z-20 mt-1 min-w-full w-max max-h-[50vh] overflow-y-auto border border-ink bg-paper"
          >
            {items.map((v) => (
              <li
                key={v}
                role="option"
                aria-selected={v === value}
                className="border-t border-dotted border-rule first:border-t-0"
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    onChange(v);
                    close();
                  }}
                  className={`label block w-full text-left px-3 py-3 cursor-pointer focus:outline-none focus:[box-shadow:inset_3px_0_0_var(--gold)] transition-colors duration-200 ease-in-out ${
                    v === value
                      ? "bg-ink text-paper"
                      : "text-ink hover:bg-paper-deep"
                  }`}
                >
                  {labelFor(v)}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
