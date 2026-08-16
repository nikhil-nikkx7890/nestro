import api from "@/lib/axios";

export function createResourceService(endpoint) {
  return {
    list: async (params = {}) => {
      const response = await api.get(endpoint, { params });
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
    remove: async (id, params = {}) => {
      const response = await api.delete(`${endpoint}/${id}`, { params });
      return response.data;
    },
  };
}
