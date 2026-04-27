import * as SecureStore from "expo-secure-store";
import { UserRole } from "../services/api/authService";

type StoredUser = {
  id: string;
  name: string;
  role: UserRole;
};

const SESSION_KEY = "rentok_auth_session_v1";

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: StoredUser;
};

export async function saveSession(session: AuthSession) {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("[AUTH] Failed to persist session", error);
  }
}

export async function loadSession() {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AuthSession>;

    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      user: parsed.user
    } satisfies AuthSession;
  } catch (error) {
    console.error("[AUTH] Failed to load session", error);
    return null;
  }
}

export async function clearSessionStorage() {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (error) {
    console.error("[AUTH] Failed to clear session", error);
  }
}

export async function updateSessionTokens(tokens: { accessToken: string; refreshToken: string }) {
  const current = await loadSession();
  if (!current) return;

  await saveSession({
    ...current,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
}
