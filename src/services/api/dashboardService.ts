import { DashboardSummary } from "../../types/models";
import { httpClient } from "./httpClient";

const fallbackSummary: DashboardSummary = {
  totalProperties: 0,
  occupiedBeds: 0,
  totalBeds: 0,
  activeTenants: 0,
  pendingDues: 0,
  monthCollection: 0,
  openMaintenance: 0,
  monthExpenses: 0
};

export async function getDashboardSummary() {
  const data = await httpClient.get<Partial<DashboardSummary>>("/dashboard/summary");
  return {
    ...fallbackSummary,
    ...data
  };
}
