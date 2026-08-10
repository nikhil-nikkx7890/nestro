import api from "@/lib/axios";

export function createResourceService(endpoint) {
  return {
    list: async () => {
      const response = await api.get(endpoint);
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`${endpoint}/${id}`);
      return response.data;
    },
    create: async (data) => {
      const response = await api.post(endpoint, data);
      return response.data;
    },
    update: async (id, data) => {
      const response = await api.put(`${endpoint}/${id}`, data);
      return response.data;
    },
    remove: async (id) => {
      const response = await api.delete(`${endpoint}/${id}`);
      return response.data;
    },
  };
}
