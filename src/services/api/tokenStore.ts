let accessToken: string | null = null;
let refreshToken: string | null = null;
let authFailureHandler: (() => void) | null = null;

export function setAuthTokens(tokens: { accessToken: string | null; refreshToken: string | null }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
}

export function setAuthFailureHandler(handler: (() => void) | null) {
  authFailureHandler = handler;
}

export function notifyAuthFailure() {
  if (authFailureHandler) {
    authFailureHandler();
  }
}
