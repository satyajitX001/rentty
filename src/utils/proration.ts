import { Property } from "../types/models";

/**
 * Proration calculation utility
 * Determines first month rent based on property proration mode
 */

export type ProrationMode = "full_month" | "pro_rata_daily" | "next_cycle";

export interface ProrationResult {
  amount: number;
  daysCharged: number;
  description: string;
}

const prorationLabels: Record<ProrationMode, string> = {
  full_month: "Full Month",
  pro_rata_daily: "Daily Calculation",
  next_cycle: "Next Rent Cycle",
};

const prorationDescriptions: Record<ProrationMode, string> = {
  full_month: "Charge full month rent regardless of join date",
  pro_rata_daily: "Calculate daily rate × days based on due date",
  next_cycle: "Skip partial month, first charge on next due date",
};

function getDaysInMonth(year: number, month: number): number {
  // month is 1-indexed (1 = January)
  return new Date(year, month, 0).getDate();
}

/**
 * Calculate first month prorated rent
 * @param monthlyRent - Monthly rent amount
 * @param joinedOn - Join date in YYYY-MM-DD or ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
 * @param rentDueDay - Day of month rent is due (1-31), optional
 * @param prorationMode - Proration mode from property settings
 * @returns ProrationResult with amount and description
 */
export function calculateFirstMonthProration(
  monthlyRent: number,
  joinedOn: string,
  rentDueDay?: number,
  prorationMode: ProrationMode = "pro_rata_daily"
): ProrationResult {
  if (monthlyRent <= 0) {
    return { amount: 0, daysCharged: 0, description: "No rent configured" };
  }

  // Handle both YYYY-MM-DD and ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
  const joinDate = new Date(joinedOn.includes("T") ? joinedOn : joinedOn + "T00:00:00");
  if (isNaN(joinDate.getTime())) {
    return { amount: 0, daysCharged: 0, description: "Invalid join date" };
  }

  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth(); // 0-indexed
  const joinDay = joinDate.getDate();

  // If no rentDueDay provided, default: charge from join date to end of month
  if (!rentDueDay || rentDueDay < 1 || rentDueDay > 31) {
    const daysInJoinMonth = getDaysInMonth(joinYear, joinMonth + 1);
    const daysCharged = daysInJoinMonth - joinDay + 1; // inclusive of join day
    const dailyRate = monthlyRent / daysInJoinMonth;
    const amount = Math.round(dailyRate * daysCharged);

    return {
      amount,
      daysCharged,
      description: `No due day set. ₹${monthlyRent.toLocaleString("en-IN")} / ${daysInJoinMonth} days × ${daysCharged} days (join to month end) = ₹${amount.toLocaleString("en-IN")}`,
    };
  }

  // Calculate the first due date in the join month
  const firstDueDateInJoinMonth = new Date(joinYear, joinMonth, rentDueDay);

  // Case 1: due date >= joining date (same month)
  // e.g., due=10, joining=Aug 8 → charge from Aug 8 to Aug 10
  if (rentDueDay >= joinDay) {
    const daysCharged = rentDueDay - joinDay + 1; // inclusive of both join day and due day
    const daysInJoinMonth = getDaysInMonth(joinYear, joinMonth + 1);
    const dailyRate = monthlyRent / daysInJoinMonth;
    const amount = Math.round(dailyRate * daysCharged);

    return {
      amount,
      daysCharged,
      description: `Due day (${rentDueDay}) ≥ Join day (${joinDay}). ₹${monthlyRent.toLocaleString("en-IN")} / ${daysInJoinMonth} days × ${daysCharged} days (${joinDay}–${rentDueDay}) = ₹${amount.toLocaleString("en-IN")}`,
    };
  }

  // Case 2: due date < joining date (next month)
  // e.g., due=8, joining=Aug 10 → charge from Aug 10 to Sep 8
  const nextMonth = joinMonth + 1;
  const nextMonthYear = nextMonth > 11 ? joinYear + 1 : joinYear;
  const nextMonthIndex = nextMonth > 11 ? 0 : nextMonth;
  const daysInNextMonth = getDaysInMonth(nextMonthYear, nextMonthIndex + 1);

  // Days from join date to end of join month
  const daysInJoinMonth = getDaysInMonth(joinYear, joinMonth + 1);
  const daysRemainingInJoinMonth = daysInJoinMonth - joinDay + 1;

  // Days from start of next month to due day (inclusive)
  const daysInNextMonthToDue = rentDueDay;

  const totalDaysCharged = daysRemainingInJoinMonth + daysInNextMonthToDue;
  const dailyRate = monthlyRent / daysInJoinMonth; // Use join month days for daily rate
  const amount = Math.round(dailyRate * totalDaysCharged);

  return {
    amount,
    daysCharged: totalDaysCharged,
    description: `Due day (${rentDueDay}) < Join day (${joinDay}). ₹${monthlyRent.toLocaleString("en-IN")} / ${daysInJoinMonth} days × ${totalDaysCharged} days (${joinDay}–month end + 1–${rentDueDay} next month) = ₹${amount.toLocaleString("en-IN")}`,
  };
}

/**
 * Get all proration modes with labels and descriptions for UI dropdown
 */
export function getProrationModes(): { value: ProrationMode; label: string; description: string }[] {
  return prorationModes.map((mode) => ({
    value: mode,
    label: prorationLabels[mode],
    description: prorationDescriptions[mode],
  }));
}

/**
 * Get proration mode label
 */
export function getProrationLabel(mode: ProrationMode): string {
  return prorationLabels[mode];
}

/**
 * Get proration mode description
 */
export function getProrationDescription(mode: ProrationMode): string {
  return prorationDescriptions[mode];
}

/**
 * Helper to format date for display
 */
function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const prorationModes: ProrationMode[] = ["full_month", "pro_rata_daily", "next_cycle"];