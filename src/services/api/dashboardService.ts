import { DashboardSummary } from "../../types/models";
import { httpClient } from "./httpClient";

function readNumber(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (source[key] === null || source[key] === undefined || source[key] === "") {
      continue;
    }

    const value = Number(source[key]);
    if (Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}

function normalizeDashboardSummary(input: unknown): DashboardSummary {
  const raw = (input ?? {}) as Record<string, unknown>;
  const source =
    raw.summary && typeof raw.summary === "object" && !Array.isArray(raw.summary)
      ? (raw.summary as Record<string, unknown>)
      : raw;

  const totalProperties = readNumber(source, ["totalProperties", "total_properties"]) ?? 0;
  const occupiedProperties =
    readNumber(source, ["occupiedProperties", "occupied_properties", "occupiedBeds", "occupied_beds"]) ?? 0;
  const availableProperties =
    readNumber(source, ["availableProperties", "available_properties"]) ??
    (totalProperties > 0 ? Math.max(totalProperties - occupiedProperties, 0) : 0);

  return {
    totalProperties,
    occupiedProperties,
    availableProperties,
    activeTenants: readNumber(source, ["activeTenants", "active_tenants"]) ?? 0,
    pendingDues: readNumber(source, ["pendingDues", "pending_dues"]) ?? 0,
    monthCollection:
      readNumber(source, ["monthCollection", "month_collection", "totalCollection", "total_collection"]) ?? 0,
    openMaintenance: readNumber(source, ["openMaintenance", "open_maintenance"]) ?? 0,
    monthExpenses: readNumber(source, ["monthExpenses", "month_expenses"]) ?? 0,
    occupiedBeds: readNumber(source, ["occupiedBeds", "occupied_beds"]),
    totalBeds: readNumber(source, ["totalBeds", "total_beds"]),
  };
}

export async function getDashboardSummary() {
  const data = await httpClient.get<unknown>("/dashboard/summary");
  return normalizeDashboardSummary(data);
}
