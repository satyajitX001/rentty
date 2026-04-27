import { Tenant } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export type CreateTenantPayload = {
  fullName: string;
  fullAddress: string;
  phone: string;
  propertyId: string;
  monthlyRent: number;
  rentDueDay: number;
  joinedOn: string;
  advanceAmount?: number;
  openingDueAmount?: number;
};

export type UpdateTenantPayload = Partial<CreateTenantPayload> & {
  roomNumber?: string;
  kycVerified?: boolean;
  remarks?: string;
  leaseStart?: string;
  leaseEnd?: string;
};

export type RemoveTenantPayload = {
  reason: string;
  vacatedOn?: string;
};

export type TenantFilters = {
  propertyId?: string;
  status?: Tenant["status"];
  includeInactive?: boolean;
};

function normalizeTenant(input: unknown): Tenant {
  const raw = (input ?? {}) as Record<string, unknown>;
  const propertyIdValue = raw.propertyId;

  return {
    id: String(raw.id ?? raw._id ?? ""),
    fullName: String(raw.fullName ?? ""),
    fullAddress: String(raw.fullAddress ?? ""),
    phone: String(raw.phone ?? ""),
    propertyId:
      typeof propertyIdValue === "object" && propertyIdValue !== null
        ? String((propertyIdValue as Record<string, unknown>)._id ?? "")
        : String(propertyIdValue ?? ""),
    roomNumber: raw.roomNumber ? String(raw.roomNumber) : undefined,
    monthlyRent: Number(raw.monthlyRent ?? 0),
    rentDueDay: Number(raw.rentDueDay ?? 1),
    joinedOn: String(raw.joinedOn ?? raw.leaseStart ?? ""),
    advanceAmount: Number(raw.advanceAmount ?? 0),
    openingDueAmount: Number(raw.openingDueAmount ?? 0),
    dueAmount: Number(raw.dueAmount ?? 0),
    status: (raw.status as Tenant["status"]) ?? "active",
    kycVerified: Boolean(raw.kycVerified),
    leaseStart: raw.leaseStart ? String(raw.leaseStart) : undefined,
    leaseEnd: raw.leaseEnd ? String(raw.leaseEnd) : undefined,
    vacatedOn: raw.vacatedOn ? String(raw.vacatedOn) : undefined,
    vacateReason: raw.vacateReason ? String(raw.vacateReason) : undefined,
    active: raw.active !== false
  };
}

export async function getTenants(filters: TenantFilters = {}) {
  const query = {
    ...(filters?.propertyId ? { propertyId: filters.propertyId } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(filters?.includeInactive ? { includeInactive: "true" } : {})
  };

  const data = await httpClient.get<unknown>("/tenants", Object.keys(query).length ? query : undefined);
  return toArray<unknown>(data, ["tenants", "items", "data"]).map(normalizeTenant);
}

export async function createTenant(payload: CreateTenantPayload) {
  const data = await httpClient.post<unknown>("/tenants", payload);

  if (typeof data === "object" && data !== null && "tenant" in data) {
    return normalizeTenant((data as Record<string, unknown>).tenant);
  }

  return normalizeTenant(data);
}

export async function updateTenant(tenantId: string, payload: UpdateTenantPayload) {
  const data = await httpClient.put<unknown>(`/tenants/${tenantId}`, payload);

  if (typeof data === "object" && data !== null && "tenant" in data) {
    return normalizeTenant((data as Record<string, unknown>).tenant);
  }

  return normalizeTenant(data);
}

export async function removeTenant(tenantId: string, payload: RemoveTenantPayload) {
  return httpClient.patch<{ success: boolean; message: string }>(
    `/tenants/${tenantId}/remove`,
    payload
  );
}

