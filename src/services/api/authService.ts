import { httpClient } from "./httpClient";

export type LoginPayload = {
  phone: string;
  password: string;
};

export type UserRole = "owner" | "caretaker";

export type AuthUser = {
  id: string;
  name: string;
  role: UserRole;
};

type RawAuthUser = {
  id?: unknown;
  name?: unknown;
  role?: unknown;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export type RegisterPayload = {
  name: string;
  phone: string;
  password: string;
  role: UserRole;
  ownerId?: string;
};

export type RegisterResponse = {
  token?: string;
  refreshToken?: string;
  user?: AuthUser;
  message?: string;
};

const isAppRole = (role: unknown): role is UserRole => role === "owner" || role === "caretaker";

const normalizeAuthUser = (rawUser: RawAuthUser): AuthUser => {
  if (!isAppRole(rawUser.role)) {
    throw new Error("This app supports only owner and caretaker accounts.");
  }

  return {
    id: String(rawUser.id ?? ""),
    name: String(rawUser.name ?? ""),
    role: rawUser.role
  };
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const result = await httpClient.post<{ token: string; refreshToken: string; user: RawAuthUser }>(
    "/auth/login",
    payload
  );

  return {
    token: result.token,
    refreshToken: result.refreshToken,
    user: normalizeAuthUser(result.user ?? {})
  };
}

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const result = await httpClient.post<{
    token?: string;
    refreshToken?: string;
    user?: RawAuthUser;
    message?: string;
  }>("/auth/register", payload);

  return {
    token: result.token,
    refreshToken: result.refreshToken,
    user: result.user ? normalizeAuthUser(result.user) : undefined,
    message: result.message
  };
}
