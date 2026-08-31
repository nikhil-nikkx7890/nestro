import api from "@/lib/axios";

export const wishlistService = {
  get: async () => {
    const response = await api.get("/wishlist");
    return response.data;
  },

  addItem: async (productId) => {
    const response = await api.post("/wishlist/items", { product: productId });
    return response.data;
  },

  removeItem: async (productId) => {
    const response = await api.delete(`/wishlist/items/${productId}`);
    return response.data;
  },
};
