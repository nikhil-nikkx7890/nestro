import api from "@/lib/axios";

// Not built on createResourceService (resource.service.js) — that
// factory's update() hardcodes PUT, and the backend address routes use
// PATCH (a genuine partial update, not a full replace — see
// updateAddressSchema's own comment on why). Same "don't force a factory
// that doesn't match" call auth.service.js already makes.
export const addressService = {
  list: async () => {
    const response = await api.get("/addresses");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/addresses", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.patch(`/addresses/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
};
