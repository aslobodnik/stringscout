"use client";

// Site-wide feedback note. Send clears the box at once and the panel stays open
// for the next note; the outbox delivers to feedback.slobo.xyz and retries
// until the Full Range store has it (lib/feedback-outbox.js, shared with the
// other sites via github.com/aslobodnik/feedback).
import { useEffect, useRef, useState } from "react";
import { createOutbox } from "@/lib/feedback-outbox";

const FIELD =
  "block w-full border border-ink bg-transparent px-3 py-2 text-base sm:text-sm placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";
const BTN =
  "label border border-ink h-9 px-4 cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-60 disabled:cursor-not-allowed";

type Outbox = ReturnType<typeof createOutbox>;
type State = { sending: number; waiting: number; failed: number };

export default function Feedback() {
  const dialog = useRef<HTMLDialogElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);
  const outbox = useRef<Outbox | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(0);
  const [state, setState] = useState<State>({ sending: 0, waiting: 0, failed: 0 });

  useEffect(() => {
    outbox.current = createOutbox({ app: "stringscout" });
    try { setEmail(localStorage.getItem("feedback-email") ?? ""); } catch {}
    return outbox.current.subscribe(setState);
  }, []);

  const open = () => {
    setSent(0);
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim() || !outbox.current) return;
    outbox.current.send({ message, email });
    try { localStorage.setItem("feedback-email", email.trim()); } catch {}
    setMessage("");
    setSent((n) => n + 1);
    box.current?.focus();
  };

  const waiting = state.waiting;
  return (
    <>
      <button
        type="button"
        onClick={open}
        className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-40 label border border-ink bg-paper text-ink h-9 px-4 cursor-pointer hover:bg-paper-deep hover:border-gold transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold"
      >
        Feedback
      </button>
      <dialog
        ref={dialog}
        onClick={(e) => e.target === dialog.current && close()}
        className="fixed inset-auto right-4 bottom-4 sm:right-6 sm:bottom-6 m-0 w-[min(22rem,calc(100vw-2rem))] border border-ink bg-paper text-ink p-0 backdrop:bg-ink/20"
      >
        <form onSubmit={submit} className="grid gap-3 p-5">
          <div className="flex items-baseline justify-between">
            <span className="label">Feedback</span>
            <button type="button" onClick={close} aria-label="Close" className="text-ink-soft hover:text-ink text-xl leading-none cursor-pointer transition-colors duration-200 ease-in-out">
              ×
            </button>
          </div>
          <textarea
            ref={box}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            maxLength={4000}
            rows={5}
            placeholder={sent ? "Anything else?" : "What's wrong, missing, or unclear?"}
            aria-label="Message"
            className={`${FIELD} resize-y min-h-28`}
            autoFocus
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            placeholder="Email for a reply (optional)"
            aria-label="Email for a reply, optional"
            className={FIELD}
          />
          <div className="flex items-center justify-between gap-3 pt-1">
            <p role="status" aria-live="polite" className="text-xs">
              {state.failed > 0 ? (
                <span className="text-oxblood">
                  {state.failed === 1 ? "1 note" : `${state.failed} notes`} could not be sent.{" "}
                  <button type="button" onClick={() => outbox.current?.dismissFailed()} className="underline cursor-pointer">
                    Dismiss
                  </button>
                </span>
              ) : waiting > 0 && sent > 0 ? (
                <span className="text-ink-soft">Thanks. Offline for now, it will send when it can.</span>
              ) : sent > 0 ? (
                <span className="font-medium">{sent === 1 ? "Thanks, got it." : `Thanks, got all ${sent}.`}</span>
              ) : null}
            </p>
            <button type="submit" disabled={!message.trim()} className={`${BTN} shrink-0 bg-ink text-paper hover:bg-ink/85`}>
              Send
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
