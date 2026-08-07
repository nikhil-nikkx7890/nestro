import api from "@/lib/axios";

export const getColors = async () => {
    const response = await api.get("/colors");
    return response.data;
};

export const getColorById = async (id) => {
    const response = await api.get(`/colors/${id}`);
    return response.data;
};

export const createColor = async (data) => {
    const response = await api.post("/colors", data);
    return response.data;
};

export const updateColor = async (id, data) => {
    const response = await api.put(`/colors/${id}`, data);
    return response.data;
};

export const deleteColor = async (id) => {
    const response = await api.delete(`/colors/${id}`);
    return response.data;
};