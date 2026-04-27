import { MaintenanceRequest } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export type UpdateMaintenancePayload = {
  status: MaintenanceRequest["status"];
  serviceProvider?: string;
  actualCost?: number;
};

export async function getMaintenanceRequests() {
  const data = await httpClient.get<unknown>("/maintenance/requests");
  return toArray<MaintenanceRequest>(data, ["requests", "items", "data"]);
}

export async function updateMaintenanceStatus(requestId: string, payload: UpdateMaintenancePayload) {
  return httpClient.patch<MaintenanceRequest>(`/maintenance/requests/${requestId}/status`, payload);
}
