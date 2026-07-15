import { SupportTicket } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export async function getSupportTickets() {
  const data = await httpClient.get<unknown>("/support/tickets");
  const raw = toArray<Record<string, unknown>>(data, ["tickets", "items", "data"]);

  return raw.map(
    (item): SupportTicket => ({
      id: String(item.id ?? ""),
      subject: String(item.subject ?? ""),
      priority: (item.priority as SupportTicket["priority"]) ?? "medium",
      status: (item.status as SupportTicket["status"]) ?? "open",
      createdOn: String(item.createdOn ?? item.createdAt ?? ""),
    })
  );
}
