import { Expense } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export async function getExpenses(month?: string) {
  const data = await httpClient.get<unknown>("/expenses", month ? { month } : undefined);
  return toArray<Expense>(data, ["expenses", "items", "data"]);
}
