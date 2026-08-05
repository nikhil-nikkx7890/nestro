import api from "@/lib/axios";

export const getRoomTypes = async () => {
    const response = await api.get("/room-types");
    return response.data;
};

export const getRoomTypeById = async (id) => {
    const response = await api.get(`/room-types/${id}`);
    return response.data;
};

export const createRoomType = async (data) => {
    const response = await api.post("/room-types", data);
    return response.data;
};

export const updateRoomType = async (id, data) => {
    const response = await api.put(`/room-types/${id}`, data);
    return response.data;
};

export const deleteRoomType = async (id) => {
    const response = await api.delete(`/room-types/${id}`);
    return response.data;
};