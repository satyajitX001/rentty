import { Tenant, LedgerEntry, SettlementResult, LedgerEntryType } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

// Keep tenant phones consistent with auth phones (stored as +91 format).
// Safe to call on already-formatted values (won't double-prefix).
function normalizePhoneToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return phone.trim();
}

export type CreateTenantPayload = {
  fullName: string;
  fullAddress: string;
  phone: string;
  propertyId: string;
  monthlyRent: number;
  rentDueDay: number;
  joinedOn: string;
  securityDeposit?: number;
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
  const securityDeposit = Number(raw.securityDeposit ?? raw.advanceAmount ?? 0);

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
    securityDeposit,
    advanceAmount: securityDeposit,
    openingDueAmount: Number(raw.openingDueAmount ?? 0),
    dueAmount: Number(raw.dueAmount ?? 0),
    creditBalance: raw.creditBalance !== undefined && raw.creditBalance !== null
      ? Number(raw.creditBalance)
      : 0,
    rentHistory: raw.rentHistory ? toArray<unknown>(raw.rentHistory).map(item => ({
      effectiveFrom: String((item as Record<string, unknown>).effectiveFrom ?? ""),
      monthlyRent: Number((item as Record<string, unknown>).monthlyRent ?? 0),
    })) : undefined,
    ledger: raw.ledger ? toArray<unknown>(raw.ledger).map(item => {
      const ledgerRaw = item as Record<string, unknown>;
      return {
        id: String(ledgerRaw.id ?? ledgerRaw._id ?? ""),
        tenantId: String(ledgerRaw.tenantId ?? ""),
        propertyId: String(ledgerRaw.propertyId ?? ""),
        transactionType: String(ledgerRaw.transactionType ?? "") as LedgerEntryType,
        amount: Number(ledgerRaw.amount ?? 0),
        effectiveDate: String(ledgerRaw.effectiveDate ?? ""),
        dueMonth: ledgerRaw.dueMonth ? String(ledgerRaw.dueMonth) : undefined,
        paymentId: ledgerRaw.paymentId ? String(ledgerRaw.paymentId) : undefined,
        notes: ledgerRaw.notes ? String(ledgerRaw.notes) : undefined,
        runningBalance: Number(ledgerRaw.runningBalance ?? 0),
      };
    }) : undefined,
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
  const securityDeposit = payload.securityDeposit ?? payload.advanceAmount ?? 0;
  const data = await httpClient.post<unknown>("/tenants", {
    ...payload,
    securityDeposit,
    advanceAmount: securityDeposit,
    phone: normalizePhoneToE164(payload.phone),
  });

  if (typeof data === "object" && data !== null && "tenant" in data) {
    return normalizeTenant((data as Record<string, unknown>).tenant);
  }

  return normalizeTenant(data);
}

export async function updateTenant(tenantId: string, payload: UpdateTenantPayload) {
  const hasSecurityDeposit =
    payload.securityDeposit !== undefined || payload.advanceAmount !== undefined;
  const securityDeposit = payload.securityDeposit ?? payload.advanceAmount ?? 0;
  const data = await httpClient.put<unknown>(`/tenants/${tenantId}`, {
    ...payload,
    ...(hasSecurityDeposit ? { securityDeposit, advanceAmount: securityDeposit } : {}),
    ...(payload.phone !== undefined ? { phone: normalizePhoneToE164(payload.phone) } : {}),
  });

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

export async function getTenantLedger(tenantId: string): Promise<LedgerEntry[]> {
  const data = await httpClient.get<unknown>(`/tenants/${tenantId}/ledger`);
  const ledgerRaw = toArray<unknown>(data, ["ledger", "items", "data"]);
  return ledgerRaw.map(item => {
    const raw = item as Record<string, unknown>;
    return {
      id: String(raw.id ?? raw._id ?? ""),
      tenantId: String(raw.tenantId ?? ""),
      propertyId: String(raw.propertyId ?? ""),
      transactionType: String(raw.transactionType ?? "") as LedgerEntryType,
      amount: Number(raw.amount ?? 0),
      effectiveDate: String(raw.effectiveDate ?? ""),
      dueMonth: raw.dueMonth ? String(raw.dueMonth) : undefined,
      paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
      notes: raw.notes ? String(raw.notes) : undefined,
      runningBalance: Number(raw.runningBalance ?? 0),
    };
  });
}

export async function getTenantOutstanding(tenantId: string): Promise<{ outstanding: number }> {
  const data = await httpClient.get<{ outstanding: number }>(`/tenants/${tenantId}/outstanding`);
  return data;
}

export async function getTenantCredit(tenantId: string): Promise<{ creditBalance: number }> {
  const data = await httpClient.get<{ creditBalance: number }>(`/tenants/${tenantId}/credit`);
  return data;
}

export async function calculateSettlement(tenantId: string, vacatedOn: string): Promise<SettlementResult> {
  const data = await httpClient.post<unknown>(`/tenants/${tenantId}/settlement`, { vacatedOn });
  const raw = data as Record<string, unknown>;
  return {
    tenantId: String(raw.tenantId ?? ""),
    tenantName: String(raw.tenantName ?? ""),
    vacatedOn: String(raw.vacatedOn ?? ""),
    outstandingRent: Number(raw.outstandingRent ?? 0),
    depositHeld: Number(raw.depositHeld ?? 0),
    creditBalance: Number(raw.creditBalance ?? 0),
    maintenanceCharges: Number(raw.maintenanceCharges ?? 0),
    damageCharges: Number(raw.damageCharges ?? 0),
    refundAmount: Number(raw.refundAmount ?? 0),
    settlementDetails: (raw.settlementDetails as Array<Record<string, unknown>> ?? []).map(item => ({
      description: String(item.description ?? ""),
      amount: Number(item.amount ?? 0),
    })),
  };
}

