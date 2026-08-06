import api from "@/lib/axios";

export const getMaterials = async () => {
  const response = await api.get("/materials");
  return response.data;
};

export const getMaterialById = async (id) => {
  const response = await api.get(`/materials/${id}`);
  return response.data;
};

export const createMaterial = async (data) => {
  const response = await api.post("/materials", data);
  return response.data;
};

export const updateMaterial = async (id, data) => {
  const response = await api.put(`/materials/${id}`, data);
  return response.data;
};

export const deleteMaterial = async (id) => {
  const response = await api.delete(`/materials/${id}`);
  return response.data;
};
