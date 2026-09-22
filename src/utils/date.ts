const shortMonths = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Formats API and picker dates without shifting their calendar day by timezone. */
export function formatDate(value?: string): string {
  if (!value) return "-";

  const calendarMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (calendarMatch && calendarMatch[1] && calendarMatch[2] && calendarMatch[3]) {
    const year = calendarMatch[1];
    const month = calendarMatch[2];
    const day = calendarMatch[3];
    const monthIndex = Number(month) - 1;
    if (monthIndex >= 0 && monthIndex < shortMonths.length) {
      return `${day}-${shortMonths[monthIndex]}-${year.slice(-2)}`;
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return `${String(parsed.getUTCDate()).padStart(2, "0")}-${shortMonths[parsed.getUTCMonth()]}-${String(parsed.getUTCFullYear()).slice(-2)}`;
}
