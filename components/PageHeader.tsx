import Link from "next/link";

// /withdrawn is deliberately absent: it exists for the record, reachable by
// typing the path, but it is not something to send a reader to.
const NAV = [
  { href: "/", label: "Strings" },
  { href: "/applicants", label: "Applicants" },
  { href: "/sources", label: "Sources" },
];

export function TopBar({ current }: { current: string }) {
  return (
    <div className="sticky top-0 z-30 bg-paper flex flex-wrap items-stretch justify-between gap-x-4 border-b border-ink">
      <Link
        href="/"
        className="group label !text-[13px] flex items-center py-3 focus-visible:outline-2 focus-visible:outline-gold"
      >
        <span className="text-ink group-hover:text-oxblood transition-colors duration-200 ease-in-out">
          String
        </span>
        <span className="text-gold group-hover:text-oxblood transition-colors duration-200 ease-in-out">
          scout
        </span>
      </Link>
      <nav aria-label="Site" className="flex">
        {NAV.map((n) =>
          n.href === current ? (
            <span
              key={n.href}
              aria-current="page"
              className="label text-ink flex items-center px-3 py-3 -mb-px border-b-2 border-ink"
            >
              {n.label}
            </span>
          ) : (
            <Link
              key={n.href}
              href={n.href}
              className="label text-ink-soft flex items-center px-3 py-3 -mb-px border-b-2 border-transparent hover:text-oxblood focus-visible:outline-2 focus-visible:outline-gold transition-colors duration-200 ease-in-out"
            >
              {n.label}
            </Link>
          )
        )}
      </nav>
    </div>
  );
}

export default function PageHeader({
  title,
  current,
}: {
  title: string;
  current: string;
}) {
  return (
    <>
      <TopBar current={current} />
      <header className="pb-6">
        <h1 className="mt-5 text-3xl font-medium tracking-[0.14em] uppercase leading-none">
          {title}
        </h1>
      </header>
    </>
  );
}
