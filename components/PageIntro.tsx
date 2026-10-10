// The header under the top bar on the strings and explore pages: an h1 that
// says what the page does, an h2 that says what a reader can do there. One
// component so the two never drift apart.
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
      <h2 className="mt-4 text-base sm:text-lg text-[color-mix(in_oklab,var(--oxblood)_80%,var(--paper))]">
        {children}
      </h2>
    </header>
  );
}
