import { httpClient } from "./httpClient";

export type LoginPayload = {
  phone: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  role: string;
};

export type LoginResponse = {
  token: string;
  refreshToken: string;
  user: AuthUser;
};

export type RegisterPayload = {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
};

export type RegisterResponse = {
  token?: string;
  refreshToken?: string;
  user?: AuthUser;
  message?: string;
};

export async function login(payload: LoginPayload) {
  return httpClient.post<LoginResponse>("/auth/login", payload);
}

export async function register(payload: RegisterPayload) {
  return httpClient.post<RegisterResponse>("/auth/register", payload);
}
