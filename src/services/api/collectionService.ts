import { Payment } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export type CollectRentInput = {
  tenantId: string;
  amount: number;
  mode: Payment["mode"];
  notes?: string;
  paidOn: string;
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

export async function getPayments(month?: string) {
  const data = await httpClient.get<unknown>("/collections/payments", month ? { month } : undefined);
  return toArray<Payment>(data, ["payments", "items", "data"]);
}

export async function collectRent(payload: CollectRentInput) {
  return httpClient.post<CollectRentResponse>("/collections/collect", payload);
}
