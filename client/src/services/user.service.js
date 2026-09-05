import api from "@/lib/axios";

// Admin-only user directory. Not built on createResourceService — there's
// no create/update/delete here by design (see user.controller.js), just a
// list and one status toggle.
export const userService = {
  list: async (params) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  setStatus: async (userId, isActive) => {
    const response = await api.patch(`/users/${userId}/status`, { isActive });
    return response.data;
  },
};
