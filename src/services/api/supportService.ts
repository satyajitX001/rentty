import { SupportTicket } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export async function getSupportTickets() {
  const data = await httpClient.get<unknown>("/support/tickets");
  return toArray<SupportTicket>(data, ["tickets", "items", "data"]);
}
