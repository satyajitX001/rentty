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
  pro_rata_daily: "Pro-Rata (Daily)",
  next_cycle: "Next Rent Cycle",
};

const prorationDescriptions: Record<ProrationMode, string> = {
  full_month: "Charge full month rent regardless of join date",
  pro_rata_daily: "Calculate daily rate × days remaining in month",
  next_cycle: "Skip partial month, first charge on next due date",
};

function getDaysInMonth(year: number, month: number): number {
  // month is 1-indexed (1 = January)
  return new Date(year, month, 0).getDate();
}

/**
 * Calculate first month prorated rent
 * @param monthlyRent - Monthly rent amount
 * @param joinedOn - Join date in YYYY-MM-DD format
 * @param rentDueDay - Day of month rent is due (1-31)
 * @param prorationMode - Proration mode from property settings
 * @returns ProrationResult with amount and description
 */
export function calculateFirstMonthProration(
  monthlyRent: number,
  joinedOn: string,
  rentDueDay: number,
  prorationMode: ProrationMode = "pro_rata_daily"
): ProrationResult {
  if (monthlyRent <= 0) {
    return { amount: 0, daysCharged: 0, description: "No rent configured" };
  }

  const joinDate = new Date(joinedOn + "T00:00:00");
  if (isNaN(joinDate.getTime())) {
    return { amount: 0, daysCharged: 0, description: "Invalid join date" };
  }

  const joinYear = joinDate.getFullYear();
  const joinMonth = joinDate.getMonth() + 1; // 1-indexed
  const joinDay = joinDate.getDate();

  // Calculate the first due date
  const firstDueDate = new Date(joinYear, joinMonth - 1, rentDueDay);

  // If join date is after the due day in the same month, first due is next month
  if (joinDay > rentDueDay) {
    firstDueDate.setMonth(firstDueDate.getMonth() + 1);
  }

  const dueYear = firstDueDate.getFullYear();
  const dueMonth = firstDueDate.getMonth() + 1;

  switch (prorationMode) {
    case "full_month":
      return {
        amount: monthlyRent,
        daysCharged: getDaysInMonth(dueYear, dueMonth),
        description: `${prorationLabels.full_month}: Full month rent of ₹${monthlyRent.toLocaleString("en-IN")}`,
      };

    case "next_cycle":
      // Check if join date is exactly on the due day
      if (joinDay === rentDueDay) {
        return {
          amount: monthlyRent,
          daysCharged: getDaysInMonth(dueYear, dueMonth),
          description: `${prorationLabels.next_cycle}: Joined on due day, full month rent ₹${monthlyRent.toLocaleString("en-IN")}`,
        };
      }
      return {
        amount: 0,
        daysCharged: 0,
        description: `${prorationLabels.next_cycle}: No charge for partial month, first rent due on ${formatDateForDisplay(firstDueDate)}`,
      };

    case "pro_rata_daily":
    default: {
      // Calculate days from join date to end of the month containing the first due date
      // The charge period is from join date to the day before the NEXT due date
      // But typically proration is from join date to end of the month

      const daysInJoinMonth = getDaysInMonth(joinYear, joinMonth);

      // If first due is in the same month as join
      if (dueMonth === joinMonth && dueYear === joinYear) {
        // Days from join day to due day (exclusive of due day, or inclusive?)
        // Standard: charge from join date to day before next due date
        // For first month: from join date to end of month
        const daysCharged = daysInJoinMonth - joinDay + 1; // inclusive of join day
        const dailyRate = monthlyRent / daysInJoinMonth;
        const amount = Math.round(dailyRate * daysCharged);

        return {
          amount,
          daysCharged,
          description: `${prorationLabels.pro_rata_daily}: ₹${monthlyRent.toLocaleString("en-IN")} / ${daysInJoinMonth} days × ${daysCharged} days = ₹${amount.toLocaleString("en-IN")}`,
        };
      } else {
        // First due is next month - charge for partial month of join month + full next month?
        // Standard interpretation: only charge for days in join month (partial)
        // The full next month will be charged on the due date
        const daysCharged = daysInJoinMonth - joinDay + 1;
        const dailyRate = monthlyRent / daysInJoinMonth;
        const amount = Math.round(dailyRate * daysCharged);

        return {
          amount,
          daysCharged,
          description: `${prorationLabels.pro_rata_daily}: ₹${monthlyRent.toLocaleString("en-IN")} / ${daysInJoinMonth} days × ${daysCharged} days (join month) = ₹${amount.toLocaleString("en-IN")}`,
        };
      }
    }
  }
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