import api from "@/lib/axios";

// Not built on createResourceService — the contact endpoint is a single
// storage-only POST with no list/getById/update/remove shape (same
// reasoning as auth.service.js).
export const contactService = {
  submit: async (data) => {
    const response = await api.post("/contact", data);
    return response.data;
  },
};
