import { httpClient } from "./httpClient";

export type ProfitAndLoss = {
  totalCollection: number;
  totalExpense: number;
  net: number;
};

export async function getProfitAndLoss(from: string, to: string) {
  return httpClient.get<ProfitAndLoss>("/finance/reports/pnl", { from, to });
}
