import { httpClient } from "./httpClient";

export type LoginPayload = {
  phone: string;
  password: string;
};

export type UserRole = "owner" | "caretaker";

export type AuthUser = {
  id: string;
  name: string;
  phone?: string;
  role: UserRole;
};

type RawAuthUser = {
  id?: unknown;
  name?: unknown;
  phone?: unknown;
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
    phone: rawUser.phone ? String(rawUser.phone) : undefined,
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

export async function requestPasswordReset(phone: string): Promise<{ resetToken: string }> {
  return httpClient.post<{ resetToken: string }>("/auth/forgot-password", { phone });
}

export async function resetPassword(payload: { token: string; newPassword: string }): Promise<void> {
  return httpClient.post("/auth/reset-password", payload);
}

export async function getProfile(): Promise<AuthUser> {
  const result = await httpClient.get<{ user: RawAuthUser }>("/auth/me");
  return normalizeAuthUser(result.user ?? {});
}

export async function updateProfile(payload: { name: string; phone: string }): Promise<AuthUser> {
  const result = await httpClient.patch<{ user: RawAuthUser }>("/auth/me", payload);
  return normalizeAuthUser(result.user ?? {});
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }): Promise<void> {
  return httpClient.patch("/auth/me/password", payload);
}

export async function logout(refreshToken: string): Promise<void> {
  return httpClient.post("/auth/logout", { refreshToken });
}
