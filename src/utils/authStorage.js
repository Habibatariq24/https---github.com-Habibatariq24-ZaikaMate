export function saveAuthSession(auth) {
  localStorage.setItem("auth_token", auth.token || "");
  localStorage.setItem("auth_user", JSON.stringify(auth.user || {}));
}

export function getAuthSession() {
  return {
    token: localStorage.getItem("auth_token"),
    user: JSON.parse(localStorage.getItem("auth_user") || "{}"),
  };
}

export function clearAuthSession() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_user");
}