import * as SecureStore from "expo-secure-store";
import { UserRole } from "../services/api/authService";

type StoredUser = {
  id: string;
  name: string;
  phone?: string;
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
  } catch {
    // SecureStore can fail on unsupported environments; auth can continue without persistence.
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
  } catch {
    return null;
  }
}

export async function clearSessionStorage() {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch {
    // Ignore storage cleanup errors; in-memory auth state is already cleared by the caller.
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
