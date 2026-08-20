const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

// Dates arrive at mixed granularity: mostly full ISO, occasionally a bare
// year. Anything that is not a full date passes through as written.
export function formatDate(d: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d);
  if (!m) return d;
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return d;
  return `${Number(m[3])} ${month} ${m[1]}`;
}
