// Withdrawals ICANN published after String Confirmation Day: one line per
// day with its count, opening to that day's applicants and their strings
// (WithdrawalDays). The head carries the count ICANN has tallied but not yet
// published, and on hover when we last looked.
import Tip from "@/components/Tip";
import WithdrawalDays, { type WithdrawalDay } from "@/components/WithdrawalDays";
import { formatDate } from "@/lib/format";

type Group = { date: string; applicant: string; tlds: string[] };

// "25 Nov, 7:14 pm ET"
function checkedET(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return `${p.day} ${p.month}, ${p.hour}:${p.minute} ${p.dayPeriod.toLowerCase()} ET`;
}

export default function RecentWithdrawals({
  groups,
  checkedAt,
  pending,
}: {
  groups: Group[];
  checkedAt: string | null;
  pending: number;
}) {
  if (groups.length === 0) return null;
  const checked = checkedAt ? checkedET(checkedAt) : null;
  // one line per day, newest first; the count is applications, not applicants
  const days: WithdrawalDay[] = [];
  for (const g of groups) {
    let day = days[days.length - 1];
    if (day?.date !== g.date) {
      day = { date: g.date, label: formatDate(g.date).replace(/ \d{4}$/, ""), count: 0, groups: [] };
      days.push(day);
    }
    day.count += g.tlds.length;
    day.groups.push({ applicant: g.applicant, tlds: g.tlds });
  }
  return (
    <section className="mb-8">
      <div className="flex items-baseline gap-4">
        {checked ? (
          <h3 className="group relative label text-ink-soft cursor-help underline decoration-dotted decoration-rule underline-offset-4">
            Recently withdrawn
            <Tip>Checked {checked}</Tip>
          </h3>
        ) : (
          <h3 className="label text-ink-soft">Recently withdrawn</h3>
        )}
        {pending > 0 && <span className="label text-oxblood">{pending} pending</span>}
      </div>
      <WithdrawalDays days={days} />
    </section>
  );
}
