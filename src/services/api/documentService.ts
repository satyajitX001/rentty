import { DocumentItem } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export async function getDocuments(entityType?: string, entityId?: string) {
  const query = {
    entityType,
    entityId
  };

  const data = await httpClient.get<unknown>("/documents", query);
  return toArray<DocumentItem>(data, ["documents", "items", "data"]);
}
