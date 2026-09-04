import api from "@/lib/axios";

// Single storage-only POST, same shape as contact.service.js — not built
// on createResourceService for the same reason.
export const newsletterService = {
  subscribe: async (email) => {
    const response = await api.post("/newsletter", { email });
    return response.data;
  },
};
