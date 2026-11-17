"use client";

// Site-wide feedback note, after hardmoneysuccess's. Posts to the API, which
// stores it in the Full Range feedback store. Says "Saved" only once the store
// confirms; an uncertain send keeps the same id and body for the retry.
import { useRef, useState } from "react";

const URL_ = process.env.NEXT_PUBLIC_FEEDBACK_API_URL ?? (
  process.env.NODE_ENV === "development"
    ? "http://localhost:3001/api/feedback"
    : "https://api.stringscout.com/api/feedback"
);
const FIELD =
  "block w-full border border-ink bg-transparent px-3 py-2 text-base sm:text-sm placeholder:text-ink-soft focus:border-gold focus:outline-none transition-colors duration-200 ease-in-out";
const BTN =
  "label border border-ink h-9 px-4 cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-60 disabled:cursor-wait";

type Body = { id: string; message: string; email: string | null; page: string };

export default function Feedback() {
  const dialog = useRef<HTMLDialogElement>(null);
  const draft = useRef<Body | null>(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);

  const open = () => {
    if (saved) {
      setMessage("");
      setEmail("");
      setSaved(false);
      setStatus(null);
      draft.current = null;
    }
    dialog.current?.showModal();
  };
  const close = () => dialog.current?.close();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || saved || !message.trim()) return;
    const body = (draft.current ??= {
      id: crypto.randomUUID(),
      message,
      email: email.trim() || null,
      page: window.location.pathname,
    });
    setBusy(true);
    setStatus(null);
    try {
      const r = await fetch(URL_, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      const data = await r.json().catch(() => null);
      if ((r.status === 201 || r.status === 200) && data?.ok && data.id === body.id) {
        setSaved(true);
        draft.current = null;
        setStatus({ text: "Saved. Thank you.", error: false });
        return;
      }
      const detail = data?.error?.message;
      setStatus({ text: typeof detail === "string" ? detail : "Could not confirm it was saved. Try again.", error: true });
    } catch {
      setStatus({ text: "Delivery was not confirmed. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  };

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
          {!saved && (
            <>
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  draft.current = null;
                  setStatus(null);
                }}
                required
                maxLength={4000}
                rows={5}
                placeholder="What's wrong, missing, or unclear?"
                aria-label="Message"
                disabled={busy}
                className={`${FIELD} resize-y min-h-28`}
                autoFocus
              />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  draft.current = null;
                  setStatus(null);
                }}
                maxLength={254}
                placeholder="Email for a reply (optional)"
                aria-label="Email for a reply, optional"
                disabled={busy}
                className={FIELD}
              />
            </>
          )}
          {status && (
            <p role="status" className={`text-xs ${status.error ? "text-oxblood" : "font-medium"}`}>
              {status.text}
            </p>
          )}
          {!saved && (
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={close} className={`${BTN} hover:bg-paper-deep`}>
                Cancel
              </button>
              <button type="submit" disabled={busy || !message.trim()} className={`${BTN} bg-ink text-paper hover:bg-ink/85`}>
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          )}
        </form>
      </dialog>
    </>
  );
}
