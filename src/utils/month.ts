export function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonthKey(monthKey: string) {
  const [rawYear, rawMonth] = monthKey.split("-").map(Number);
  return {
    year: rawYear ?? new Date().getFullYear(),
    month: rawMonth ?? 1,
  };
}

export function shiftMonth(monthKey: string, amount: number) {
  const { year, month } = parseMonthKey(monthKey);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(monthKey: string) {
  const { year, month } = parseMonthKey(monthKey);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  };
}

export function monthLabel(monthKey: string) {
  const { year, month } = parseMonthKey(monthKey);
  return new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function buildMonthOptions(monthsBack = 24, monthsForward = 6) {
  const base = currentMonthKey();
  const options: string[] = [];
  for (let offset = -monthsBack; offset <= monthsForward; offset += 1) {
    options.push(shiftMonth(base, offset));
  }
  return options.reverse();
}
