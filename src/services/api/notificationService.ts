import { AlertItem } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export async function getNotifications() {
  const data = await httpClient.get<unknown>("/notifications");
  return toArray<AlertItem>(data, ["notifications", "items", "data"]);
}
