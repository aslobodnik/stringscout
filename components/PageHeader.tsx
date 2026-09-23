import Link from "next/link";
import Dateline from "./Dateline";
import SiteNav from "./SiteNav";

// Scrolls with the page rather than floating: pinned, it slid over the plate
// frame lines on every scroll.
export function TopBar({ current }: { current: string }) {
  return (
    <div className="flex items-stretch justify-between gap-x-4 border-b border-ink">
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
      <SiteNav current={current} />
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
        <Dateline />
      </header>
    </>
  );
}
