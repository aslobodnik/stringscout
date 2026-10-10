// The header under the top bar on the strings, explore, applicants and
// overlap pages: an h1 that says what the page does, an h2 that says what a
// reader can do there. One component so the pages never drift apart. On desktop the h2 holds two lines
// whatever its length, so the rule under the header sits at the same height
// on every page and does not jump when the reader moves between them.
export default function PageIntro({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="pt-7 pb-6">
      <h1 className="serif text-3xl leading-[1.1] tracking-[-0.02em] text-ink">
        {title}
      </h1>
      <h2 className="mt-4 text-base sm:text-lg lg:min-h-14 text-[color-mix(in_oklab,var(--oxblood)_80%,var(--paper))]">
        {children}
      </h2>
    </header>
  );
}
