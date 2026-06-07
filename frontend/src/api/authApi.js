import { apiRequest } from "./http.js";

export const authApi = {
  login: (payload) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  forgotPassword: (payload) =>
    apiRequest("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),
  me: () => apiRequest("/user/me"),
  updateProfile: (payload) =>
    apiRequest("/user/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};
