import { Property } from "../../types/models";
import { httpClient } from "./httpClient";
import { toArray } from "./normalizers";

export type CreatePropertyPayload = {
  name: string;
  address: string;
  type?: "hostels" | "flat" | "villa";
  caretakerName?: string;
  caretakerPhone?: string;
  location?: string;
  floors?: number;
  rooms?: number;
  flatSize?: "1BHK" | "2BHK" | "3BHK";
  amenities?: string;
};

export type UpdatePropertyPayload = Partial<CreatePropertyPayload>;

export type AssignCaretakerPayload = {
  caretaker?: string;
  caretakerPhone: string;
};

export type AssignCaretakerResult = {
  property: Property;
  onboarding?: {
    accountCreated: boolean;
    phone: string;
    tempPassword?: string;
  };
};

function normalizeProperty(input: unknown): Property {
  const raw = (input ?? {}) as Record<string, unknown>;
  const status = raw.occupancyStatus;

  return {
    id: String(raw.id ?? raw._id ?? ""),
    name: String(raw.name ?? ""),
    address: String(raw.address ?? ""),
    type: raw.type === "hostels" || raw.type === "flat" || raw.type === "villa" ? raw.type : undefined,
    caretaker: raw.caretaker ? String(raw.caretaker) : undefined,
    caretakerPhone: raw.caretakerPhone ? String(raw.caretakerPhone) : undefined,
    occupancyStatus: status === "occupied" ? "occupied" : "available",
    totalBeds: raw.totalBeds !== undefined ? Number(raw.totalBeds) : undefined,
    occupiedBeds: raw.occupiedBeds !== undefined ? Number(raw.occupiedBeds) : undefined,
    active: raw.active !== false
  };
}

export async function getProperties() {
  const data = await httpClient.get<unknown>("/properties");
  return toArray<unknown>(data, ["properties", "items", "data"]).map(normalizeProperty);
}

export async function createProperty(payload: CreatePropertyPayload) {
  const data = await httpClient.post<unknown>("/properties", payload);

  if (typeof data === "object" && data !== null && "property" in data) {
    return normalizeProperty((data as Record<string, unknown>).property);
  }

  return normalizeProperty(data);
}

export async function assignCaretaker(propertyId: string, payload: AssignCaretakerPayload): Promise<AssignCaretakerResult> {
  const data = await httpClient.patch<unknown>(`/properties/${propertyId}/caretaker`, payload);

  if (typeof data === "object" && data !== null && "property" in data) {
    const raw = data as Record<string, unknown>;
    const onboardingRaw = raw.onboarding as Record<string, unknown> | undefined;

    return {
      property: normalizeProperty(raw.property),
      onboarding: onboardingRaw
        ? {
            accountCreated: Boolean(onboardingRaw.accountCreated),
            phone: String(onboardingRaw.phone ?? ""),
            tempPassword: onboardingRaw.tempPassword ? String(onboardingRaw.tempPassword) : undefined
          }
        : undefined
    };
  }

  return {
    property: normalizeProperty(data)
  };
}

export async function updateProperty(propertyId: string, payload: UpdatePropertyPayload) {
  const data = await httpClient.put<unknown>(`/properties/${propertyId}`, payload);

  if (typeof data === "object" && data !== null && "property" in data) {
    return normalizeProperty((data as Record<string, unknown>).property);
  }

  return normalizeProperty(data);
}
