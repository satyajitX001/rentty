import { Property } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export async function getProperties() {
  const data = await httpClient.get<unknown>("/properties");
  return toArray<Property>(data, ["properties", "items", "data"]);
}
