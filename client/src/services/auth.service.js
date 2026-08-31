import api from "@/lib/axios";

// Not built on createResourceService (resource.service.js) — that factory
// assumes a standard list/getById/create/update/remove CRUD shape scoped to
// one endpoint. Auth's endpoints (login, logout, me) don't fit that shape at
// all, so this is written directly instead of forced into a factory that
// doesn't match (same "don't abstract until it actually fits" principle
// used throughout the backend).
export const authService = {
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  me: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
