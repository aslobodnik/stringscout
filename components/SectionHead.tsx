// The rule-and-numeral head used at the top of every section on every page.
export default function SectionHead({
  n,
  title,
  count,
  className = "",
}: {
  n: string;
  title: string;
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={`double-rule pt-4 mb-5 flex items-baseline justify-between gap-4 ${className}`}
    >
      <h2 className="label !text-sm text-ink">{title}</h2>
      <span className="label text-ink-soft shrink-0">
        {count !== undefined ? `${count} · ` : ""}
        {n}
      </span>
    </div>
  );
}
