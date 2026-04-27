import { Payment } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export type CollectRentInput = {
  tenantId: string;
  amount: number;
  mode: Payment["mode"];
  paidOn: string;
  dueMonth?: string;
  utr?: string;
  notes?: string;
};

export type CollectRentResponse = {
  payment: Payment;
  receipt: {
    receiptNo: string;
    tenantName?: string;
    amount?: number;
    paidOn?: string;
    balanceDue: number;
  };
};

const normalizePayment = (input: unknown): Payment => {
  const raw = (input ?? {}) as Record<string, unknown>;

  return {
    id: String(raw.id ?? raw._id ?? ""),
    tenantId: String(raw.tenantId ?? ""),
    propertyId: String(raw.propertyId ?? ""),
    amount: Number(raw.amount ?? 0),
    dueMonth: String(raw.dueMonth ?? raw.month ?? ""),
    paidMonth: raw.paidMonth ? String(raw.paidMonth) : undefined,
    paidOn: String(raw.paidOn ?? ""),
    mode: (raw.mode as Payment["mode"]) ?? "UPI",
    utr: raw.utr ? String(raw.utr) : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    receiptNo: raw.receiptNo ? String(raw.receiptNo) : undefined
  };
};

export type PaymentFilters = {
  month?: string;
  tenantId?: string;
};

export type UpdatePaymentInput = {
  amount?: number;
  mode?: Payment["mode"];
  paidOn?: string;
  dueMonth?: string;
  utr?: string;
  notes?: string;
};

export async function getPayments(filters: PaymentFilters = {}) {
  const query = {
    ...(filters.month && filters.month.trim().length > 0 ? { month: filters.month } : {}),
    ...(filters.tenantId ? { tenantId: filters.tenantId } : {})
  };
  const data = await httpClient.get<unknown>("/collections/payments", query);
  return toArray<unknown>(data, ["payments", "items", "data"]).map(normalizePayment);
}

export async function collectRent(payload: CollectRentInput) {
  return httpClient.post<CollectRentResponse>("/collections/collect", payload);
}

export async function updatePayment(paymentId: string, payload: UpdatePaymentInput) {
  const data = await httpClient.patch<unknown>(`/collections/payments/${paymentId}`, payload);

  if (typeof data === "object" && data !== null && "payment" in data) {
    return normalizePayment((data as Record<string, unknown>).payment);
  }

  return normalizePayment(data);
}
