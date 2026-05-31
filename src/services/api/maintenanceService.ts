import { MaintenanceRequest } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export type UpdateMaintenancePayload = {
  status: MaintenanceRequest["status"];
  serviceProvider?: string;
  actualCost?: number;
};

export type CreateMaintenancePayload = {
  propertyId: string;
  tenantId?: string;
  roomNumber: string;
  title: string;
  description?: string;
  priority: MaintenanceRequest["priority"];
  serviceProvider?: string;
  servicedOn?: string;
  estimatedCost?: number;
};

export type MaintenanceFilters = {
  status?: MaintenanceRequest["status"];
  month?: string;
};

const normalizeMaintenanceRequest = (input: unknown): MaintenanceRequest => {
  const raw = (input ?? {}) as Record<string, unknown>;
  const status = raw.status === "in_progress" || raw.status === "resolved" ? raw.status : "open";
  const priority = raw.priority === "low" || raw.priority === "high" ? raw.priority : "medium";

  return {
    id: String(raw.id ?? raw._id ?? ""),
    propertyId: String(raw.propertyId ?? ""),
    tenantId: raw.tenantId ? String(raw.tenantId) : "",
    roomNumber: String(raw.roomNumber ?? "-"),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    priority,
    status,
    servicedOn: String(raw.servicedOn ?? raw.requestedOn ?? raw.createdAt ?? ""),
    requestedOn: String(raw.requestedOn ?? raw.servicedOn ?? raw.createdAt ?? ""),
    updatedOn: String(raw.updatedOn ?? raw.updatedAt ?? ""),
    serviceProvider: raw.serviceProvider ? String(raw.serviceProvider) : "-",
    estimatedCost: Number(raw.estimatedCost ?? raw.actualCost ?? 0)
  };
};

export async function getMaintenanceRequests(filters: MaintenanceFilters = {}) {
  const data = await httpClient.get<unknown>("/maintenance/requests", {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.month ? { month: filters.month } : {})
  });
  return toArray<unknown>(data, ["requests", "items", "data"]).map(normalizeMaintenanceRequest);
}

export async function createMaintenanceRequest(payload: CreateMaintenancePayload) {
  const data = await httpClient.post<unknown>("/maintenance/requests", payload);

  if (typeof data === "object" && data !== null && "request" in data) {
    return normalizeMaintenanceRequest((data as Record<string, unknown>).request);
  }

  return normalizeMaintenanceRequest(data);
}

export async function updateMaintenanceStatus(requestId: string, payload: UpdateMaintenancePayload) {
  const data = await httpClient.patch<unknown>(`/maintenance/requests/${requestId}/status`, payload);

  if (typeof data === "object" && data !== null && "request" in data) {
    return normalizeMaintenanceRequest((data as Record<string, unknown>).request);
  }

  return normalizeMaintenanceRequest(data);
}
