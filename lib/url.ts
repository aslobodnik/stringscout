// history.pushState does not emit an event, so a client-side navigation from
// /applicants to /?applicant=Name has to be caught by patching it. Next routes
// through pushState, and back/forward arrive as popstate.
export const subscribeToUrl = (onChange: () => void) => {
  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function (...args: Parameters<typeof push>) {
    push.apply(this, args);
    onChange();
  };
  history.replaceState = function (...args: Parameters<typeof replace>) {
    replace.apply(this, args);
    onChange();
  };
  window.addEventListener("popstate", onChange);
  return () => {
    history.pushState = push;
    history.replaceState = replace;
    window.removeEventListener("popstate", onChange);
  };
};
