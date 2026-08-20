const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

// Dates arrive at three granularities: a full ISO date, a year and month
// where the day was never reported, or a bare year. Each renders at the
// precision it actually has, in the same worded shape.
export function formatDate(d: string): string {
  const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (full) {
    const m = MONTHS[Number(full[2]) - 1];
    if (m) return `${Number(full[3])} ${m} ${full[1]}`;
  }
  const month = /^(\d{4})-(\d{2})$/.exec(d);
  if (month) {
    const m = MONTHS[Number(month[2]) - 1];
    if (m) return `${m} ${month[1]}`;
  }
  return d;
}
