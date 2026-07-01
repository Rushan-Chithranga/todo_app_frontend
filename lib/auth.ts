export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function saveAuth(token: string, user: AuthUser) {
    console.log("userr==============",JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  if (typeof window === "undefined") return null;

  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const user = localStorage.getItem(USER_KEY);

  return user ? JSON.parse(user) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function authHeaders() {
  const token = getToken();

  return {
    Accept: "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
}
