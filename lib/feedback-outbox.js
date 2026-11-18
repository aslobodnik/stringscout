// Feedback outbox: copy this file into a site. No dependencies.
//
//   const feedback = createOutbox({ app: "stringscout" });
//   feedback.send({ message, email });      // returns at once; the note is kept until the server saves it
//   feedback.subscribe(state => ...);       // { sending, waiting, failed } counts, after every change
//
// Notes sit in localStorage until https://feedback.slobo.xyz answers 2xx (saved).
// A network error, 429 or 5xx retries with backoff while the page is open, when
// the browser comes back online, and on the next visit. 400/409 are permanent:
// the note is kept as failed and never retried. JSON goes as text/plain, so
// there is no CORS preflight.
const ENDPOINT = "https://feedback.slobo.xyz/";
const MAX_NOTES = 20;
const BACKOFF = [2000, 10000, 60000, 300000];

export function createOutbox({ app, endpoint = ENDPOINT, key = "feedback-outbox" }) {
  let notes = load();
  const inflight = new Set();
  const listeners = new Set();
  let timer = null;

  function load() {
    try { const v = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(key, JSON.stringify(notes)); } catch { /* private mode: notes live in memory for this page */ }
  }
  function state() {
    return {
      sending: notes.filter(n => !n.failed && inflight.has(n.id)).length,
      waiting: notes.filter(n => !n.failed && !inflight.has(n.id)).length,
      failed: notes.filter(n => n.failed).length,
    };
  }
  function emit() { const s = state(); listeners.forEach(f => f(s)); }

  async function post(note) {
    inflight.add(note.id);
    emit();
    let outcome = "retry";
    try {
      const r = await fetch(endpoint, {
        method: "POST", credentials: "omit", keepalive: true,
        headers: { "content-type": "text/plain" },
        body: JSON.stringify({ id: note.id, message: note.message, email: note.email, page: note.page, app }),
      });
      if (r.ok) outcome = "saved";
      else if (r.status === 400 || r.status === 403 || r.status === 409 || r.status === 413) outcome = "failed";
    } catch { /* offline or blocked: retry later */ }
    inflight.delete(note.id);
    notes = load().map(n => n.id === note.id ? { ...n, tries: (n.tries || 0) + 1, failed: outcome === "failed" } : n);
    if (outcome === "saved") notes = notes.filter(n => n.id !== note.id);
    save();
    emit();
    if (outcome === "retry") schedule();
  }

  function flush() {
    notes = load();
    for (const n of notes) if (!n.failed && !inflight.has(n.id)) post(n);
  }
  function schedule() {
    if (timer) return;
    const tries = Math.min(...notes.filter(n => !n.failed).map(n => n.tries || 0), BACKOFF.length - 1);
    timer = setTimeout(() => { timer = null; flush(); }, BACKOFF[tries] ?? BACKOFF.at(-1));
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", flush);
    if (notes.some(n => !n.failed)) setTimeout(flush, 1000);
  }

  return {
    /** @param {{ message: string, email?: string | null }} note */
    send({ message, email = null }) {
      const note = {
        id: crypto.randomUUID(), message, email: email?.trim() || null,
        page: location.origin + location.pathname, tries: 0, failed: false,
      };
      notes = [...load(), note].slice(-MAX_NOTES);
      save();
      post(note);
      return note.id;
    },
    subscribe(fn) { listeners.add(fn); fn(state()); return () => { listeners.delete(fn); }; },
    dismissFailed() { notes = load().filter(n => !n.failed); save(); emit(); },
  };
}
