import { Tenant } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export async function getTenants() {
  const data = await httpClient.get<unknown>("/tenants");
  return toArray<Tenant>(data, ["tenants", "items", "data"]);
}
